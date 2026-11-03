import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import gsap from "gsap";
import { useLounge } from "../LoungeContext";
import { STATIONS, type StationId } from "../stations";

/**
 * Flies the camera between stations.
 *
 * Model: a "base" pose (position + look-at target) is what GSAP tweens. Every frame the
 * rendered pose is derived from it: portrait pull-back, then pointer parallax, then lookAt.
 * Nothing here sets React state per frame; setTransitioning only flips at start/end.
 *
 * Each flight is a cubic Bézier (position and target separately) driven by one GSAP tween
 * on a progress proxy. A fresh flight uses an in-out ease with an upward arc on long moves.
 * An interrupted flight starts from the live pose and seeds the curve's first control point
 * with the current velocity, so the camera carries its momentum into the new move instead
 * of stopping dead (velocity is continuous across the interrupt).
 */

/** Ease for a flight that starts at rest. See report: quad in-out, not the strong UI curve. */
const EASE_FROM_REST = "power2.inOut";
/** Ease for a flight that starts mid-motion. Starts at speed, e'(0) = 2. */
const EASE_INTERRUPT = "power2.out";
const EASE_INTERRUPT_START_SLOPE = 2;

const MIN_DURATION = 1.2;
const MAX_DURATION = 2.4;
/** Travel (m) at which flights reach MAX_DURATION. */
const LONG_TRAVEL = 24;

/** Fit framing: the camera never pulls back more than this many extra meters (fog starts at 28). */
const MAX_PULLBACK_METERS = 8;
const BASE_FOV = 45;
const MAX_FIT_FOV = 70;
const T0 = Math.tan(MathUtils.degToRad(BASE_FOV / 2));
/**
 * What must stay visible around the target, as half-angle tangents. Horizontal = a square
 * 45° viewport (the desktop free area is ~square, so desktop needs no correction); vertical
 * is smaller because station props are short.
 */
const FIT_HALF_TAN_X = T0;
const FIT_HALF_TAN_Y = T0 * 0.55;

/**
 * HUD layout (from the HUD agent). Desktop ≥1024px: 4rem top nav, right side panel
 * min(24rem, 36vw) (26rem at ≥1280px). Below: 4rem top nav, bottom sheet up to 52vh (assumed
 * open); the target sits ~30% from the top.
 */
const DESKTOP_MIN_WIDTH = 1024;
const XL_MIN_WIDTH = 1280;
const NAV_REM = 4;
const SHEET_FRACTION = 0.52;
const MOBILE_TARGET_Y = 0.3;
/** On 'home' the overview stays near center: only this share of the panel shift applies. */
const HOME_PANEL_SHARE = 0.3;
const panelFrameFor = (id: StationId) => (id === "home" ? 0 : 1);

/** Parallax: position offset is a few cm, scaled gently with distance to target. */
const PARALLAX_PER_METER = 0.012;
const PARALLAX_MIN = 0.04;
const PARALLAX_MAX = 0.22;
const PARALLAX_LOOK = 0.35; // look offset as a fraction of the position offset, opposite sign
const PARALLAX_DAMPING = 3.5; // exponential smoothing rate (1/s)

type Curve = [Vector3, Vector3, Vector3, Vector3];

interface Flight {
  pos: Curve;
  look: Curve;
  /** Panel-framing blend (0 = home, 1 = station), interpolated with the flight so the offset never jumps. */
  frame: [number, number];
  duration: number;
  ease: (t: number) => number;
  progress: { t: number };
}

const v3 = (p: readonly [number, number, number]) => new Vector3(p[0], p[1], p[2]);
const newCurve = (): Curve => [new Vector3(), new Vector3(), new Vector3(), new Vector3()];

const bezier = (c: Curve, s: number, out: Vector3) => {
  const u = 1 - s;
  const a = u * u * u;
  const b = 3 * u * u * s;
  const d = 3 * u * s * s;
  const e = s * s * s;
  return out.set(
    a * c[0].x + b * c[1].x + d * c[2].x + e * c[3].x,
    a * c[0].y + b * c[1].y + d * c[2].y + e * c[3].y,
    a * c[0].z + b * c[1].z + d * c[2].z + e * c[3].z,
  );
};

/** dB/ds of a cubic Bézier. */
const bezierTangent = (c: Curve, s: number, out: Vector3) => {
  const u = 1 - s;
  const a = 3 * u * u;
  const b = 6 * u * s;
  const d = 3 * s * s;
  return out.set(
    a * (c[1].x - c[0].x) + b * (c[2].x - c[1].x) + d * (c[3].x - c[2].x),
    a * (c[1].y - c[0].y) + b * (c[2].y - c[1].y) + d * (c[3].y - c[2].y),
    a * (c[1].z - c[0].z) + b * (c[2].z - c[1].z) + d * (c[3].z - c[2].z),
  );
};

/**
 * Upward arc for long moves between low stations so the camera rises over the PC row,
 * reception desk and sim rig instead of skimming through them. Moves that start or end
 * high (home, y = 9) already clear everything, so the lift fades out above 5 m.
 */
const arcLift = (from: Vector3, to: Vector3) => {
  const dist = from.distanceTo(to);
  const lengthFactor = MathUtils.clamp((dist - 4) * 0.2, 0, 2.2);
  const heightFactor = MathUtils.clamp((6 - Math.max(from.y, to.y)) / 2, 0, 1);
  return lengthFactor * heightFactor;
};

const durationFor = (travel: number) =>
  MathUtils.lerp(MIN_DURATION, MAX_DURATION, MathUtils.clamp((travel - 4) / (LONG_TRAVEL - 4), 0, 1));

const finePointerQuery = "(hover: hover) and (pointer: fine)";

const CameraRig = () => {
  const { station, setTransitioning, reducedMotion } = useLounge();
  const camera = useThree((s) => s.camera);

  // Base pose: the tweened, un-adjusted camera position and look target.
  const base = useMemo(
    () => ({
      pos: v3(STATIONS[station].camera),
      look: v3(STATIONS[station].target),
      frame: panelFrameFor(station),
    }),
    // Initial placement only (deep links like /lounge#pcs); later changes animate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const flight = useRef<Flight | null>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const lastStation = useRef<StationId>(station);

  // Parallax state (refs only, never React state).
  const pointer = useRef({ x: 0, y: 0, active: false });
  const finePointer = useRef(false);
  const parallax = useRef(new Vector3());

  // Scratch vectors, reused every frame.
  const tmp = useMemo(
    () => ({
      dir: new Vector3(),
      right: new Vector3(),
      up: new Vector3(),
      offset: new Vector3(),
      pos: new Vector3(),
      look: new Vector3(),
      velPos: new Vector3(),
      velLook: new Vector3(),
    }),
    [],
  );

  // ---- Pointer tracking for parallax (fine pointers only) ----
  useEffect(() => {
    const mq = window.matchMedia(finePointerQuery);
    const updateMq = () => {
      finePointer.current = mq.matches;
    };
    updateMq();
    mq.addEventListener("change", updateMq);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
      pointer.current.active = true;
    };
    const onLeave = () => {
      pointer.current.active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      mq.removeEventListener("change", updateMq);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  // ---- Station changes ----
  useEffect(() => {
    const dest = STATIONS[station];
    const destPos = v3(dest.camera);
    const destLook = v3(dest.target);
    const isNewStation = lastStation.current !== station;
    lastStation.current = station;

    // Capture the live (presentation) velocity of the current flight before killing it.
    const current = flight.current;
    let hasVelocity = false;
    if (current && timeline.current?.isActive()) {
      const t = current.progress.t;
      const h = 1e-3;
      const t0 = Math.max(0, t - h);
      const t1 = Math.min(1, t + h);
      const s = current.ease(t);
      const dsdt = (current.ease(t1) - current.ease(t0)) / (t1 - t0) / current.duration; // ds per second
      bezierTangent(current.pos, s, tmp.velPos).multiplyScalar(dsdt);
      bezierTangent(current.look, s, tmp.velLook).multiplyScalar(dsdt);
      hasVelocity = true;
    }

    timeline.current?.kill();
    timeline.current = null;
    flight.current = null;

    const travel = Math.max(base.pos.distanceTo(destPos), base.look.distanceTo(destLook));

    // Initial mount (deep link), StrictMode re-run, reducedMotion toggled, reduced motion,
    // or already there: cut straight to the station, no flight.
    const destFrame = panelFrameFor(station);
    if (!isNewStation || reducedMotion || travel < 0.01) {
      base.pos.copy(destPos);
      base.look.copy(destLook);
      base.frame = destFrame;
      setTransitioning(false);
      return;
    }

    const duration = durationFor(travel);
    const pos = newCurve();
    const look = newCurve();
    pos[0].copy(base.pos);
    pos[3].copy(destPos);
    look[0].copy(base.look);
    look[3].copy(destLook);

    const lift = arcLift(pos[0], pos[3]);
    pos[2].lerpVectors(pos[0], pos[3], 2 / 3);
    pos[2].y += lift;
    look[2].lerpVectors(look[0], look[3], 2 / 3);

    let easeName = EASE_FROM_REST;
    if (hasVelocity) {
      // Velocity handoff: with ease e and Bézier B, v(0) = B'(0) · e'(0) / T = 3(P1 − P0) · e'(0) / T,
      // so P1 = P0 + v · T / (3 · e'(0)). Clamp so a fast camera can't swing through a wall.
      easeName = EASE_INTERRUPT;
      const k = duration / (3 * EASE_INTERRUPT_START_SLOPE);
      const maxReach = Math.min(3, 0.4 * pos[0].distanceTo(pos[3]) + 0.5);
      // No lift on P1: it would add an upward velocity jump. P2 carries the arc.
      pos[1].copy(tmp.velPos).multiplyScalar(k).clampLength(0, maxReach).add(pos[0]);
      const maxLookReach = Math.min(3, 0.4 * look[0].distanceTo(look[3]) + 0.5);
      look[1].copy(tmp.velLook).multiplyScalar(k).clampLength(0, maxLookReach).add(look[0]);
    } else {
      pos[1].lerpVectors(pos[0], pos[3], 1 / 3);
      pos[1].y += lift;
      look[1].lerpVectors(look[0], look[3], 1 / 3);
    }

    const next: Flight = {
      pos,
      look,
      frame: [base.frame, destFrame],
      duration,
      ease: gsap.parseEase(easeName),
      progress: { t: 0 },
    };
    flight.current = next;
    setTransitioning(true);

    const tl = gsap.timeline({
      onComplete: () => {
        base.pos.copy(destPos);
        base.look.copy(destLook);
        base.frame = destFrame;
        flight.current = null;
        timeline.current = null;
        setTransitioning(false);
      },
    });
    // Tween linear progress; the ease is applied when sampling so velocity can be measured.
    tl.to(next.progress, {
      t: 1,
      duration,
      ease: "none",
      onUpdate: () => {
        const s = next.ease(next.progress.t);
        bezier(next.pos, s, base.pos);
        bezier(next.look, s, base.look);
        base.frame = MathUtils.lerp(next.frame[0], next.frame[1], s);
      },
    });
    timeline.current = tl;
  }, [station, reducedMotion, base, setTransitioning, tmp]);

  // ---- Unmount: leave nothing running and the context consistent ----
  useEffect(
    () => () => {
      timeline.current?.kill();
      timeline.current = null;
      flight.current = null;
      setTransitioning(false);
    },
    [setTransitioning],
  );

  // Root font size for the HUD's rem-based layout; re-read on resize (cheap, not per frame).
  const rem = useRef(16);
  useEffect(() => {
    const read = () => {
      rem.current = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  // Leave the shared camera with a normal projection if the rig unmounts.
  useEffect(
    () => () => {
      const cam = camera as PerspectiveCamera;
      cam.clearViewOffset();
      cam.fov = BASE_FOV;
      cam.updateProjectionMatrix();
    },
    [camera],
  );

  const view = useRef({ w: 0, h: 0, x: 0, y: 0 });

  // ---- Per-frame pose ----
  useFrame((state, delta) => {
    const cam = camera as PerspectiveCamera;
    const W = Math.max(1, state.size.width);
    const H = Math.max(1, state.size.height);
    const nav = NAV_REM * rem.current;

    // Free (un-covered) screen area and where the target should land in it.
    let freeW: number;
    let halfFreeH: number;
    let targetX: number;
    let targetY: number;
    if (W >= DESKTOP_MIN_WIDTH) {
      const panel = W >= XL_MIN_WIDTH ? 26 * rem.current : Math.min(24 * rem.current, 0.36 * W);
      const panelEff = panel * MathUtils.lerp(HOME_PANEL_SHARE, 1, base.frame);
      freeW = W - panelEff;
      targetX = freeW / 2;
      targetY = (nav + H) / 2;
      halfFreeH = (H - nav) / 2;
    } else {
      const sheetTop = H * (1 - SHEET_FRACTION);
      freeW = W;
      targetX = W / 2;
      targetY = Math.max(nav + 24, H * MOBILE_TARGET_Y);
      halfFreeH = Math.max(H / 12, Math.min(targetY - nav, sheetTop - targetY));
    }

    // Shift the principal point so the target projects to (targetX, targetY). The camera
    // still aims at the target, so stations.ts coordinates and the flight paths stay valid.
    const offX = W / 2 - targetX;
    const offY = H / 2 - targetY;
    const v = view.current;
    if (v.w !== W || v.h !== H || Math.abs(v.x - offX) > 0.25 || Math.abs(v.y - offY) > 0.25) {
      cam.setViewOffset(W, H, offX, offY, W, H);
      v.w = W;
      v.h = H;
      v.x = offX;
      v.y = offY;
    }

    // Fit: how much more angle the free area must cover than BASE_FOV gives it. Split the
    // correction between pulling back (capped in meters, fog starts at 28 m) and widening FOV.
    tmp.dir.subVectors(base.pos, base.look);
    const dist = tmp.dir.length();
    const availX = (T0 * freeW) / H; // half-tan visible left/right of the target
    const availY = (T0 * 2 * halfFreeH) / H; // half-tan visible above/below the target
    const need = Math.max(1, FIT_HALF_TAN_X / availX, FIT_HALF_TAN_Y / availY);
    let fov = BASE_FOV;
    let distScale = 1;
    if (need > 1.001 && dist > 1e-4) {
      distScale = Math.min(Math.sqrt(need), 1 + MAX_PULLBACK_METERS / dist);
      fov = Math.min(MAX_FIT_FOV, MathUtils.radToDeg(2 * Math.atan(T0 * (need / distScale))));
    }
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    tmp.pos.copy(base.look).addScaledVector(tmp.dir, distScale);
    tmp.look.copy(base.look);

    // Pointer parallax: idle, fine pointer, motion allowed. Eases to zero otherwise.
    const parallaxOn =
      !reducedMotion && finePointer.current && pointer.current.active && flight.current === null;
    if (reducedMotion) {
      parallax.current.set(0, 0, 0);
    } else {
      const amp = MathUtils.clamp(dist * PARALLAX_PER_METER, PARALLAX_MIN, PARALLAX_MAX);
      const tx = parallaxOn ? pointer.current.x * amp : 0;
      const ty = parallaxOn ? pointer.current.y * amp * 0.6 : 0;
      const dt = Math.min(delta, 0.1);
      parallax.current.x = MathUtils.damp(parallax.current.x, tx, PARALLAX_DAMPING, dt);
      parallax.current.y = MathUtils.damp(parallax.current.y, ty, PARALLAX_DAMPING, dt);
    }

    if (parallax.current.x !== 0 || parallax.current.y !== 0) {
      // Camera-space right/up from the un-parallaxed view direction.
      tmp.dir.subVectors(tmp.look, tmp.pos).normalize();
      tmp.right.crossVectors(tmp.dir, cam.up).normalize();
      tmp.up.crossVectors(tmp.right, tmp.dir).normalize();
      tmp.offset
        .copy(tmp.right)
        .multiplyScalar(parallax.current.x)
        .addScaledVector(tmp.up, parallax.current.y);
      tmp.pos.add(tmp.offset);
      tmp.look.addScaledVector(tmp.offset, -PARALLAX_LOOK);
    }

    cam.position.copy(tmp.pos);
    cam.lookAt(tmp.look);
  });

  return null;
};

export default CameraRig;
