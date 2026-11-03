import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, DirectionalLight, Object3D, PointLight } from "three";
import { useLounge } from "../LoungeContext";
import { COLORS, type Vec3 } from "../stations";

/**
 * Dark, moody base + one soft shadow caster + breathing RGB neon washes.
 *
 * Budget: 1 shadow-casting directional light, 1 hemisphere light, 7 non-shadow point lights.
 * Point lights are forward-shaded per fragment, so props should get their glow from emissive
 * materials (toneMapped={false}) rather than adding more lights.
 *
 * Intensities are physical (three r155+, decay 2): diffuse ≈ I / d² · albedo / π. Values are
 * tuned so lit, non-emissive surfaces stay under the bloom threshold (see Effects.tsx).
 */

interface NeonLight {
  position: Vec3;
  color: string;
  /** Color the light drifts toward and back. */
  drift: string;
  /** Max fraction of the drift color mixed in. */
  driftAmount: number;
  intensity: number;
  distance: number;
  /** Breathing period in seconds. Kept ≥ 9s (well below ~0.2 Hz) and shallow. */
  period: number;
  phase: number;
}

const NEON: NeonLight[] = [
  // PC row (anchor -7, 0, 0): cyan key from the front-top, magenta kicker from the back-left.
  { position: [-6.5, 3.4, 1.8], color: COLORS.cyan, drift: COLORS.purple, driftAmount: 0.25, intensity: 18, distance: 11, period: 11, phase: 0 },
  { position: [-10.5, 2.2, -1.4], color: COLORS.magenta, drift: COLORS.purple, driftAmount: 0.35, intensity: 12, distance: 9, period: 13, phase: 1.7 },
  // Sim rig (anchor 8, 0, -1): magenta key, cyan rim behind-right.
  { position: [8.4, 3.2, 1.0], color: COLORS.magenta, drift: COLORS.purple, driftAmount: 0.3, intensity: 16, distance: 10, period: 10, phase: 3.1 },
  { position: [10.8, 1.6, -3.2], color: COLORS.cyan, drift: COLORS.purple, driftAmount: 0.2, intensity: 9, distance: 8, period: 12, phase: 4.4 },
  // VIP glass room (anchor -10, 0, -7): purple inside, cyan spill at the entrance side.
  { position: [-10, 2.6, -7], color: COLORS.purple, drift: COLORS.magenta, driftAmount: 0.3, intensity: 14, distance: 9, period: 14, phase: 2.2 },
  { position: [-7.4, 1.3, -5.0], color: COLORS.cyan, drift: COLORS.purple, driftAmount: 0.2, intensity: 7, distance: 7, period: 9.5, phase: 5.0 },
  // Wall display (1.5, 4, -9.9): screen spill onto the floor and nearby walls.
  { position: [1.5, 3.4, -8.4], color: COLORS.cyan, drift: COLORS.purple, driftAmount: 0.3, intensity: 12, distance: 10, period: 12.5, phase: 0.9 },
];

/** ±14% intensity swing: noticeable as "alive", never a flicker. */
const BREATH_DEPTH = 0.14;

/** Main light bounds cover the whole room (x ∈ [-14, 14], z ∈ [-10, 12]) in light space, with margin. */
const SHADOW_EXTENT = 19;

const Lighting = () => {
  const { reducedMotion } = useLounge();
  const lights = useRef<(PointLight | null)[]>([]);
  const sun = useRef<DirectionalLight>(null);
  const sunTarget = useMemo(() => {
    const o = new Object3D();
    o.position.set(0, 0, -1);
    return o;
  }, []);

  const palette = useMemo(
    () => NEON.map((n) => ({ base: new Color(n.color), drift: new Color(n.drift) })),
    [],
  );

  // Shadow config is set imperatively so the shadow camera's projection is actually rebuilt.
  useLayoutEffect(() => {
    const light = sun.current;
    if (!light) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const size = coarse ? 1024 : 2048;
    light.target = sunTarget;
    light.shadow.mapSize.set(size, size);
    light.shadow.bias = -0.0004;
    light.shadow.normalBias = 0.04;
    const cam = light.shadow.camera;
    cam.left = -SHADOW_EXTENT;
    cam.right = SHADOW_EXTENT;
    cam.top = SHADOW_EXTENT;
    cam.bottom = -SHADOW_EXTENT;
    cam.near = 1;
    cam.far = 50;
    cam.updateProjectionMatrix();
    light.shadow.map?.dispose();
    light.shadow.map = null; // reallocate at the new size
    light.shadow.needsUpdate = true;
  }, [sunTarget]);

  // Reduced motion: static neon at base color/intensity.
  useLayoutEffect(() => {
    if (!reducedMotion) return;
    lights.current.forEach((light, i) => {
      if (!light) return;
      light.intensity = NEON[i].intensity;
      light.color.copy(palette[i].base);
    });
  }, [reducedMotion, palette]);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < NEON.length; i++) {
      const light = lights.current[i];
      if (!light) continue;
      const n = NEON[i];
      const w = (2 * Math.PI) / n.period;
      light.intensity = n.intensity * (1 + BREATH_DEPTH * Math.sin(t * w + n.phase));
      // Color drift runs at ~1/1.7 the breathing rate so the two never lock in step.
      const mix = n.driftAmount * 0.5 * (1 - Math.cos((t * w) / 1.7 + n.phase * 0.5));
      light.color.lerpColors(palette[i].base, palette[i].drift, mix);
    }
  });

  return (
    <>
      {/* Base: cool, low, enough to read silhouettes in the dark. */}
      <hemisphereLight args={["#3a4680", "#07080d", 1.1]} />
      <ambientLight color={COLORS.metal} intensity={0.25} />

      {/* The only shadow caster: cool overhead key from front-right. PCFSoft via <Canvas shadows>. */}
      <directionalLight
        ref={sun}
        position={[6, 15, 9]}
        color="#c9d4ff"
        intensity={1.4}
        castShadow
      />
      <primitive object={sunTarget} />

      {NEON.map((n, i) => (
        <pointLight
          key={i}
          ref={(el) => {
            lights.current[i] = el;
          }}
          position={n.position}
          color={n.color}
          intensity={n.intensity}
          distance={n.distance}
          decay={2}
        />
      ))}
    </>
  );
};

export default Lighting;
