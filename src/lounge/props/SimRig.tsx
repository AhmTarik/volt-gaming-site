import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  InstancedMesh,
  MathUtils,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  BoxGeometry,
  type MeshBasicMaterialParameters,
} from "three";
import { STATIONS } from "../stations";
import { once } from "./parts/geo";
import { GLOW } from "./parts/glow";
import { useStationInteraction } from "./parts/interact";
import {
  PLATFORM,
  REV_LEDS,
  WHEEL,
  getSimAlu,
  getSimDark,
  getSimGlow,
  getSimScreenGeo,
  getSimSeat,
} from "./parts/simGeo";
import { getGlowPool, getSimScreens } from "./parts/textures";

/**
 * Pro racing-simulator rig: aluminium-profile cockpit, bucket seat, direct-drive wheel base with a
 * rev-light wheel, tilted pedal set, handbrake + shifter (matching the site's Moza R5 / Meca Evo /
 * ESR kit), and a concave triple-screen wrap showing a night race.
 *
 * ~8 draw calls: alu, dark hardware, seat, glow accents, screens, rev LEDs, floor pool + a shadow
 * pass for the three casters. Screens and accents are emissive, everything else stays < 1.
 */

/** Slight turn so the camera (almost dead ahead) sees the seat in profile, not just its back. */
const YAW = -0.34;

const mats = once(() => {
  const basic = (extra: MeshBasicMaterialParameters = {}) =>
    new MeshBasicMaterial({ color: "#ffffff", toneMapped: false, ...extra });
  return {
    alu: new MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.85 }),
    dark: new MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.45 }),
    seat: new MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.12 }),
    glow: basic({ vertexColors: true }),
    screen: basic({ map: getSimScreens(), color: new Color(0.95, 0.95, 0.95) }),
    led: basic(),
    pool: basic({ color: new Color("#ff007f").multiplyScalar(0.5), map: getGlowPool(), transparent: true, blending: AdditiveBlending, depthWrite: false }),
  };
});

const geos = once(() => ({
  alu: getSimAlu(),
  dark: getSimDark(),
  seat: getSimSeat(),
  glow: getSimGlow(),
  screens: getSimScreenGeo(),
  led: new BoxGeometry(0.0125, 0.012, 0.008),
  pool: new PlaneGeometry(3.4, 3.7).rotateX(-Math.PI / 2),
}));

const LED_BASE = [
  GLOW.cyan, GLOW.cyan, GLOW.cyan, GLOW.purple, GLOW.purple, GLOW.purple, GLOW.magenta, GLOW.magenta, GLOW.magenta,
];

const SimRig = () => {
  const { handlers, hovered, active, reduced } = useStationInteraction("simulator");
  const g = geos();
  const m = mats();

  const ledRef = useRef<InstancedMesh>(null);
  const energy = useRef(0);
  const tmp = useMemo(() => new Color(), []);
  const o = useMemo(() => new Object3D(), []);

  const setLeds = (lit: number, boost: number) => {
    const mesh = ledRef.current;
    if (!mesh) return;
    for (let i = 0; i < REV_LEDS.length; i++) {
      // unlit LEDs keep a faint ember so the bar still reads as hardware
      const k = i < lit ? boost : 0.05;
      mesh.setColorAt(i, tmp.copy(LED_BASE[i]).multiplyScalar(k));
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  useLayoutEffect(() => {
    const mesh = ledRef.current;
    if (!mesh) return;
    REV_LEDS.forEach((p, i) => {
      o.position.set(...p);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    setLeds(6, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, dt) => {
    const target = (hovered.current ? 1 : 0) + (active.current ? 0.35 : 0);
    energy.current = MathUtils.damp(energy.current, target, 5, dt);
    const boost = 1 + energy.current * 0.4;
    m.glow.color.setScalar(boost);
    // rev sweep: climbs, holds near the limiter, drops; calmer when idle, still when reduced motion
    const t = state.clock.elapsedTime;
    const sweepSpeed = 0.9 + energy.current * 1.6;
    const phase = (t * sweepSpeed) % 4;
    const rpm = reduced.current ? 0.66 : phase < 3 ? Math.min(1, phase / 2.6) : Math.max(0.12, 1 - (phase - 3) * 1.2);
    setLeds(Math.round(rpm * REV_LEDS.length), boost);
  });

  return (
    <group position={STATIONS.simulator.anchor} rotation={[0, YAW, 0]} {...handlers}>
      <mesh geometry={g.alu} material={m.alu} castShadow receiveShadow />
      <mesh geometry={g.dark} material={m.dark} castShadow receiveShadow />
      <mesh geometry={g.seat} material={m.seat} castShadow receiveShadow />
      <mesh geometry={g.glow} material={m.glow} raycast={() => null} />
      <mesh geometry={g.screens} material={m.screen} />

      {/* rev lights ride on the wheel face */}
      <group position={WHEEL.pos} rotation={[WHEEL.tilt, 0, 0]}>
        <group position={[0, 0, WHEEL.reach]}>
          <instancedMesh
            ref={ledRef}
            args={[g.led, m.led, REV_LEDS.length]}
            frustumCulled={false}
            raycast={() => null}
          />
        </group>
      </group>

      <mesh
        geometry={g.pool}
        material={m.pool}
        position={[0, PLATFORM.top + 0.004, 0]}
        raycast={() => null}
        renderOrder={1}
      />
    </group>
  );
};

export default SimRig;
