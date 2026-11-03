import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useLounge } from "../LoungeContext";
import { COLORS, STATIONS } from "../stations";
import { BODY_FONT, HEADING_FONT, loadBrandFonts, makeCanvasTexture, wrapLines } from "../scene/room/canvasTexture";
import { createScreenMaterial } from "../scene/room/ScreenMaterial";
import { neonMaterial } from "../scene/room/neon";
import { useStationInteraction } from "../scene/room/interaction";
import GlowPlane from "../scene/room/GlowPlane";

/* Current offers, mirrored from src/components/OffersSection.tsx (copy is verbatim). `hero` is
   lifted from each description's own numbers; it adds no new claim. */
const OFFERS = [
  {
    title: "Happy Hour",
    description: "50% off on all setups every weekday from 10 AM to 1 PM.",
    badge: "Mon–Fri",
    hero: "50%",
    heroSub: "OFF",
    accent: COLORS.magenta,
    tint: "#ff5fae",
  },
  {
    title: "Group Discount",
    description: "Book 4+ stations together and get 20% off for the whole squad.",
    badge: "4+ Players",
    hero: "20%",
    heroSub: "OFF",
    accent: COLORS.cyan,
    tint: "#00f0ff",
  },
  {
    title: "Weekend Tournament",
    description: "Join our weekly tournaments every Saturday. Prizes for top 3 players!",
    badge: "Saturdays",
    hero: "TOP 3",
    heroSub: "WIN PRIZES",
    accent: COLORS.purple,
    tint: "#b79cff",
  },
] as const;

const TW = 2048;
const TH = 1152;
const SCREEN_W = 8;
const SCREEN_H = 4.5;
const HOLD = 5; // seconds per offer
const TRANS = 0.9;

type Ctx = CanvasRenderingContext2D & { letterSpacing?: string };
const spacing = (ctx: Ctx, px: number) => {
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
};

const drawBase = (ctx: Ctx, accent: string, label: string) => {
  ctx.fillStyle = "#06070d";
  ctx.fillRect(0, 0, TW, TH);
  const g = ctx.createLinearGradient(0, 0, TW * 0.6, TH);
  g.addColorStop(0, accent + "2e");
  g.addColorStop(0.55, "#06070d00");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TW, TH);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = `700 34px ${HEADING_FONT}`;
  spacing(ctx, 10);
  ctx.fillStyle = "#e9edf8";
  ctx.fillText("VOLT GAMING CENTER", 96, 104);
  ctx.fillStyle = accent === COLORS.purple ? "#b79cff" : accent;
  ctx.fillText(label, TW - 96 - ctx.measureText(label).width, 104);
  spacing(ctx, 0);
  ctx.fillStyle = "#ffffff1f";
  ctx.fillRect(96, 132, TW - 192, 3);
};

const fitFont = (ctx: Ctx, text: string, weight: number, family: string, maxW: number, maxSize: number) => {
  let size = maxSize;
  ctx.font = `${weight} ${size}px ${family}`;
  const w = ctx.measureText(text).width;
  if (w > maxW) size = Math.floor((size * maxW) / w);
  ctx.font = `${weight} ${size}px ${family}`;
  return size;
};

const drawBadge = (ctx: Ctx, text: string, x: number, y: number, accent: string, tint: string) => {
  ctx.font = `700 46px ${HEADING_FONT}`;
  const padX = 36;
  const label = text.toUpperCase();
  const w = ctx.measureText(label).width + padX * 2;
  const h = 88;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.stroke();
  ctx.fillStyle = tint;
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + padX, y + h / 2 + 2);
  ctx.textBaseline = "alphabetic";
};

const drawOffer = (ctx: Ctx, o: (typeof OFFERS)[number]) => {
  drawBase(ctx, o.accent, "OFFERS");
  ctx.textAlign = "left";
  ctx.fillStyle = o.accent;
  const size = fitFont(ctx, o.hero, 900, HEADING_FONT, 740, 430);
  ctx.fillText(o.hero, 96, 640);
  ctx.fillStyle = "#e9edf8";
  ctx.font = `700 70px ${HEADING_FONT}`;
  spacing(ctx, 16);
  ctx.fillText(o.heroSub, 106, 640 + Math.max(110, size * 0.28));
  spacing(ctx, 0);

  const x = 960;
  ctx.fillStyle = "#ffffff";
  const title = o.title.toUpperCase();
  const ts = fitFont(ctx, title, 800, HEADING_FONT, TW - x - 96, 92);
  ctx.fillText(title, x, 360 + ts * 0.2);
  ctx.fillStyle = "#cfd5e6";
  ctx.font = `600 66px ${BODY_FONT}`;
  const lines = wrapLines(ctx, o.description, TW - x - 120);
  lines.forEach((l, i) => ctx.fillText(l, x, 480 + i * 84));
  drawBadge(ctx, o.badge, x, 480 + lines.length * 84 + 60, o.accent, o.tint);
};

/** Static all-offers board for reduced motion. */
const drawList = (ctx: Ctx) => {
  drawBase(ctx, COLORS.cyan, "CURRENT OFFERS");
  const rowH = 290;
  OFFERS.forEach((o, i) => {
    const y = 180 + i * (rowH + 24);
    ctx.fillStyle = "#ffffff0d";
    ctx.beginPath();
    ctx.roundRect(96, y, TW - 192, rowH, 20);
    ctx.fill();
    ctx.fillStyle = o.accent;
    ctx.fillRect(96, y + 24, 6, rowH - 48);
    ctx.textAlign = "left";
    fitFont(ctx, o.hero, 900, HEADING_FONT, 400, 150);
    ctx.fillText(o.hero, 150, y + rowH / 2 + 52);
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 54px ${HEADING_FONT}`;
    ctx.fillText(o.title.toUpperCase(), 620, y + 92);
    ctx.fillStyle = "#cfd5e6";
    ctx.font = `600 44px ${BODY_FONT}`;
    wrapLines(ctx, o.description, 960).forEach((l, k) => ctx.fillText(l, 620, y + 160 + k * 54));
    ctx.fillStyle = o.tint;
    ctx.font = `700 34px ${HEADING_FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(o.badge.toUpperCase(), TW - 96 - 40, y + rowH / 2 + 12);
    ctx.textAlign = "left";
  });
};

const ease = (p: number) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));

const WallDisplay = () => {
  const { reducedMotion } = useLounge();
  const [ax, ay, az] = STATIONS.offers.anchor;

  const cards = useMemo(() => OFFERS.map(() => makeCanvasTexture(TW, TH, () => undefined)), []);
  const list = useMemo(() => makeCanvasTexture(TW, TH, () => undefined), []);

  useEffect(() => {
    const redraw = () => {
      cards.forEach((c, i) => {
        drawOffer(c.ctx, OFFERS[i]);
        c.tex.needsUpdate = true;
      });
      drawList(list.ctx);
      list.tex.needsUpdate = true;
    };
    redraw(); // fallback faces first; brand faces swap in as soon as they load
    let live = true;
    loadBrandFonts().then(() => live && redraw());
    return () => {
      live = false;
    };
  }, [cards, list]);
  useEffect(
    () => () => {
      cards.forEach((c) => c.tex.dispose());
      list.tex.dispose();
    },
    [cards, list],
  );

  const screenMat = useMemo(() => createScreenMaterial(cards[0].tex, cards[1].tex), [cards]);
  useEffect(() => () => screenMat.dispose(), [screenMat]);

  const mats = useMemo(
    () => ({
      edge: neonMaterial(COLORS.cyan),
      bracket: neonMaterial(COLORS.magenta),
      progress: neonMaterial(COLORS.cyan),
      pips: OFFERS.map((o) => neonMaterial(o.accent)),
    }),
    [],
  );
  const hoverMats = useMemo(() => [mats.edge, mats.bracket], [mats]);
  useEffect(
    () => () => {
      mats.edge.dispose();
      mats.bracket.dispose();
      mats.progress.dispose();
      mats.pips.forEach((m) => m.dispose());
    },
    [mats],
  );
  const handlers = useStationInteraction("offers", hoverMats);

  const bar = useRef<Group>(null);
  const state = useRef({ idx: 0, t: 0, phase: "hold" as "hold" | "trans" });

  // (re)initialise whenever the motion preference changes
  useEffect(() => {
    const u = screenMat.uniforms;
    const s = state.current;
    s.idx = 0;
    s.t = 0;
    s.phase = "hold";
    u.uMix.value = 0;
    u.uA.value = reducedMotion ? list.tex : cards[0].tex;
    u.uB.value = cards[1].tex;
    u.uScan.value = reducedMotion ? 0 : 1;
    mats.pips.forEach((m, i) => {
      m.userData.k = i === 0 ? 1 : 0;
      m.color.copy(m.userData.unit).multiplyScalar(m.userData.intensity * (0.35 + 0.65 * m.userData.k));
    });
  }, [reducedMotion, screenMat, cards, list, mats]);

  useFrame((_, dtRaw) => {
    if (reducedMotion) return;
    const dt = Math.min(dtRaw, 0.1);
    const s = state.current;
    const u = screenMat.uniforms;
    u.uTime.value += dt;
    s.t += dt;
    if (s.phase === "hold") {
      if (s.t >= HOLD) {
        s.phase = "trans";
        s.t = 0;
        u.uB.value = cards[(s.idx + 1) % OFFERS.length].tex;
      }
    } else {
      const p = Math.min(1, s.t / TRANS);
      u.uMix.value = ease(p);
      if (p >= 1) {
        s.idx = (s.idx + 1) % OFFERS.length;
        s.phase = "hold";
        s.t = 0;
        u.uA.value = cards[s.idx].tex;
        u.uMix.value = 0;
      }
    }
    const shown = s.phase === "trans" && s.t / TRANS > 0.5 ? (s.idx + 1) % OFFERS.length : s.idx;
    mats.pips.forEach((m, i) => {
      const target = i === shown ? 1 : 0;
      const cur = m.userData.k ?? 0;
      const k = cur + (target - cur) * Math.min(1, dt * 8);
      m.userData.k = k;
      m.color.copy(m.userData.unit).multiplyScalar(m.userData.intensity * (0.35 + 0.65 * k));
    });
    if (bar.current) bar.current.scale.x = Math.max(0.0001, s.phase === "hold" ? s.t / HOLD : 1);
  });

  const FW = SCREEN_W + 0.5;
  const FH = SCREEN_H + 0.5;
  const t = 0.05;

  return (
    <group position={[ax, ay, az]} {...handlers}>
      {/* soft wall wash around the screen */}
      <GlowPlane color={COLORS.cyan} size={[14, 8.4]} opacity={0.14} position={[0, 0.2, -0.06]} />
      <GlowPlane color={COLORS.magenta} size={[10, 6]} opacity={0.12} position={[0, -0.2, -0.05]} />

      {/* housing */}
      <mesh position={[0, -0.1, -0.04]} castShadow receiveShadow>
        <boxGeometry args={[FW + 0.2, FH + 0.5, 0.12]} />
        <meshStandardMaterial color="#0b0c12" roughness={0.35} metalness={0.85} envMapIntensity={0.8} />
      </mesh>

      {/* screen */}
      <mesh position={[0, 0, 0.03]} material={screenMat}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
      </mesh>

      {/* neon edge: cyan tube, magenta corner brackets */}
      <mesh position={[0, FH / 2 - 0.1, 0.05]} material={mats.edge}>
        <boxGeometry args={[FW - 0.1, t, t]} />
      </mesh>
      <mesh position={[0, -FH / 2 + 0.1, 0.05]} material={mats.edge}>
        <boxGeometry args={[FW - 0.1, t, t]} />
      </mesh>
      <mesh position={[-FW / 2 + 0.1, 0, 0.05]} material={mats.edge}>
        <boxGeometry args={[t, FH - 0.1, t]} />
      </mesh>
      <mesh position={[FW / 2 - 0.1, 0, 0.05]} material={mats.edge}>
        <boxGeometry args={[t, FH - 0.1, t]} />
      </mesh>
      {([-1, 1] as const).flatMap((sx) =>
        ([-1, 1] as const).map((sy) => (
          <group key={`${sx}${sy}`} position={[sx * (FW / 2 + 0.06), sy * (FH / 2 + 0.06), 0.06]}>
            <mesh position={[-sx * 0.35, 0, 0]} material={mats.bracket}>
              <boxGeometry args={[0.7, 0.09, 0.07]} />
            </mesh>
            <mesh position={[0, -sy * 0.35, 0]} material={mats.bracket}>
              <boxGeometry args={[0.09, 0.7, 0.07]} />
            </mesh>
          </group>
        )),
      )}

      {/* control strip: one pip per offer + hold-time progress (cycling only) */}
      {!reducedMotion && (
        <group position={[0, -FH / 2 - 0.2, 0.05]}>
          {mats.pips.map((m, i) => (
            <mesh key={i} position={[(i - 1) * 0.55, 0, 0]} material={m}>
              <boxGeometry args={[0.4, 0.07, 0.04]} />
            </mesh>
          ))}
          <group ref={bar} position={[-1.6, -0.12, 0]} scale={[0.0001, 1, 1]}>
            <mesh position={[1.6, 0, 0]} material={mats.progress}>
              <boxGeometry args={[3.2, 0.025, 0.03]} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
};

export default WallDisplay;
