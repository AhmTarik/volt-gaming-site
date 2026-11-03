import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  DoubleSide,
  InstancedMesh,
  MathUtils,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  type MeshBasicMaterialParameters,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { COLORS, STATIONS } from "../stations";
import { once } from "./parts/geo";
import { GLOW, rampGlow, sampleGlow } from "./parts/glow";
import { useStationInteraction } from "./parts/interact";
import Instanced from "./parts/Instanced";
import { getFanBlades, getFanFrame, getFanRing } from "./parts/fan";
import { getChairAccent, getChairBase, getChairBody, getChairLed } from "./parts/chair";
import {
  FAN_SLOTS,
  TOWER,
  buildFrameWork,
  buildNeon,
  buildScreens,
  getDeskLed,
  getGlassPanel,
  getGlassSheenQuad,
  getGlowA,
  getGlowB,
  getKeysQuad,
  getStationStatic,
} from "./parts/pcStation";
import { getBackdrop, getGlassSheen, getGlowPool, getKeyGrid, getPcScreenAtlas } from "./parts/textures";

/**
 * Ultra PCs area: a row of four gaming stations (desk, monitor, keyboard, glass-panelled tower
 * with GPU / RAM / AIO / spinning RGB fans, gaming chair) framed by booth dividers and a portal
 * gantry on a low dais, with an equaliser-slit wall behind.
 *
 * Draw-call budget for the whole row is ~20: every repeated part is an InstancedMesh and every
 * static part of a station is baked into one vertex-coloured geometry.
 */

const COUNT = 4;
const PITCH = 1.5;
const XS = Array.from({ length: COUNT }, (_, i) => (i - (COUNT - 1) / 2) * PITCH);

const DAIS = { w: 6.9, d: 3.2, h: 0.06, cz: 0.6 };
const CHAIR_YAW = [0.42, -0.34, 0.22, -0.5];
const CHAIR_DX = -0.3;
const CHAIR_Z = 1.35;

/* ----------------------------------------------------------------- shared materials */

const mats = once(() => {
  const basicGlow = (extra: MeshBasicMaterialParameters = {}) =>
    new MeshBasicMaterial({ color: "#ffffff", toneMapped: false, ...extra });
  return {
    solid: new MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.55 }),
    shell: new MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.35 }),
    leather: new MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.08 }),
    accent: new MeshStandardMaterial({ color: "#ffffff", roughness: 0.55, metalness: 0.05 }),
    chairBase: new MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.5 }),
    glass: new MeshPhysicalMaterial({
      color: "#9cc3df",
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity: 0.13,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.6,
      depthWrite: false,
    }),
    sheen: basicGlow({
      map: getGlassSheen(),
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      opacity: 0.85,
    }),
    // screens sit around 0.9: bright cores bloom a little, mid-tones don't
    screen: basicGlow({ map: getPcScreenAtlas(), color: new Color(0.9, 0.9, 0.9) }),
    keys: basicGlow({ map: getKeyGrid() }),
    glow: basicGlow(),
    fanBlade: new MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.3, side: DoubleSide }),
    fanFrame: new MeshStandardMaterial({ color: "#12141c", roughness: 0.55, metalness: 0.5 }),
    neon: basicGlow({ vertexColors: true }),
    dais: new MeshStandardMaterial({ color: COLORS.metal, roughness: 0.5, metalness: 0.55 }),
    pool: basicGlow({
      map: getGlowPool(),
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    backdrop: basicGlow({ map: getBackdrop(), color: new Color(1.15, 1.15, 1.15) }),
  };
});

const geos = once(() => {
  const screens = mergeGeometries(buildScreens(XS), false)!;
  return {
    stat: getStationStatic(),
    glass: getGlassPanel(),
    sheen: getGlassSheenQuad(),
    glowA: getGlowA(),
    glowB: getGlowB(),
    deskLed: getDeskLed(),
    keys: getKeysQuad(),
    screens,
    blades: getFanBlades(),
    frame: getFanFrame(),
    ring: getFanRing(),
    chairBase: getChairBase(),
    chairBody: getChairBody(),
    chairAccent: getChairAccent(),
    chairLed: getChairLed(),
    work: buildFrameWork(XS, PITCH),
    neon: buildNeon(XS, PITCH, rampGlow),
    dais: new BoxGeometry(DAIS.w, DAIS.h, DAIS.d),
    pool: new PlaneGeometry(1.9, 2.3).rotateX(-Math.PI / 2),
    backdrop: new PlaneGeometry(6.9, 2.7),
  };
});

/* ----------------------------------------------------------------- layout data */

const tmpObj = new Object3D();
const compose = (x: number, y: number, z: number, ry = 0, s = 1) => {
  tmpObj.position.set(x, y, z);
  tmpObj.rotation.set(0, ry, 0);
  tmpObj.scale.setScalar(s);
  tmpObj.updateMatrix();
  return tmpObj.matrix.clone();
};

interface Fan {
  x: number;
  y: number;
  z: number;
  size: number;
  station: number;
  framed: boolean;
}

const FANS: Fan[] = XS.flatMap((sx, station) =>
  FAN_SLOTS.map(([x, y, z, size, framed]) => ({
    x: sx + TOWER.c[0] + x,
    y: TOWER.c[1] + y,
    z: TOWER.c[2] + z,
    size,
    station,
    framed,
  })),
);
const FRAMED = FANS.filter((f) => f.framed);

const UltraPcs = () => {
  const { handlers, hovered, active, reduced } = useStationInteraction("pcs");
  const g = geos();
  const m = mats();

  const stationMx = useMemo(() => XS.map((x) => compose(x, 0, 0)), []);
  const chairMx = useMemo(() => XS.map((x, i) => compose(x + CHAIR_DX, 0, CHAIR_Z, CHAIR_YAW[i])), []);
  const poolMx = useMemo(() => XS.map((x) => compose(x, DAIS.h + 0.004, 0.45)), []);
  const frameMx = useMemo(() => FRAMED.map((f) => compose(f.x, f.y, f.z, 0, f.size)), []);
  const ringMx = useMemo(() => FANS.map((f) => compose(f.x, f.y, f.z, 0, f.size)), []);
  const bladeMx = useMemo(() => FANS.map((f) => compose(f.x, f.y, f.z, 0, f.size)), []);

  // accent tints are static; chairs alternate cyan / magenta against the stations' own cycle
  const chairAccent = useMemo(() => XS.map((_, i) => new Color(i % 2 ? "#c40f62" : "#0b9fb0")), []);
  const chairLedColor = useMemo(() => XS.map((_, i) => (i % 2 ? GLOW.magenta : GLOW.cyan).clone()), []);
  const poolColor = useMemo(() => XS.map((_, i) => new Color(i % 2 ? "#ff007f" : "#00f0ff").multiplyScalar(0.4)), []);
  // placeholders so instanceColor exists; useFrame repaints these every frame
  const dynColors = useMemo(() => XS.map(() => GLOW.cyan.clone()), []);
  const ringColors = useMemo(() => FANS.map(() => GLOW.cyan.clone()), []);

  const refs = {
    glowA: useRef<InstancedMesh>(null),
    glowB: useRef<InstancedMesh>(null),
    keys: useRef<InstancedMesh>(null),
    desk: useRef<InstancedMesh>(null),
    blades: useRef<InstancedMesh>(null),
    ring: useRef<InstancedMesh>(null),
  };
  const angles = useRef(new Float32Array(FANS.length).map((_, i) => i * 0.7));
  const energy = useRef(0);
  const col = useMemo(() => new Color(), []);

  const paint = (t: number, boost: number) => {
    const set = (mesh: InstancedMesh | null, i: number, c: Color) => {
      if (!mesh) return;
      mesh.setColorAt(i, c);
    };
    for (let i = 0; i < COUNT; i++) {
      const phase = i * 0.19;
      set(refs.glowA.current, i, sampleGlow(t * 0.07 + phase, col).multiplyScalar(boost));
      set(refs.glowB.current, i, sampleGlow(t * 0.07 + phase + 0.5, col).multiplyScalar(boost));
      set(refs.desk.current, i, sampleGlow(t * 0.07 + phase + 0.25, col).multiplyScalar(boost));
      set(refs.keys.current, i, sampleGlow(t * 0.07 + phase + 0.75, col).multiplyScalar(0.5 * boost));
    }
    FANS.forEach((f, k) => {
      const slot = k % FAN_SLOTS.length;
      set(refs.ring.current, k, sampleGlow(t * 0.07 + f.station * 0.19 + slot * 0.06, col).multiplyScalar(boost));
    });
    for (const r of Object.values(refs)) if (r.current?.instanceColor) r.current.instanceColor.needsUpdate = true;
  };

  useLayoutEffect(() => {
    paint(0, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, dt) => {
    const target = (hovered.current ? 1 : 0) + (active.current ? 0.35 : 0);
    energy.current = MathUtils.damp(energy.current, target, 5, dt);
    const boost = 1 + energy.current * 0.4;
    m.neon.color.setScalar(boost);
    m.glow.color.setScalar(boost);
    const still = reduced.current;
    const t = still ? 0 : state.clock.elapsedTime;
    paint(t, boost);

    const blades = refs.blades.current;
    if (blades) {
      const speed = still ? 0 : 1.4 + energy.current * 5;
      for (let k = 0; k < FANS.length; k++) {
        const f = FANS[k];
        angles.current[k] += dt * speed * (f.framed ? 1 : 1.5);
        tmpObj.position.set(f.x, f.y, f.z);
        tmpObj.rotation.set(0, 0, angles.current[k]);
        tmpObj.scale.setScalar(f.size);
        tmpObj.updateMatrix();
        blades.setMatrixAt(k, tmpObj.matrix);
      }
      blades.instanceMatrix.needsUpdate = true;
    }
  });

  // the whole row is a single click / hover target
  return (
    <group position={STATIONS.pcs.anchor} {...handlers}>
      {/* dais, backdrop, floor light pools: decorative and non-interactive */}
      <mesh geometry={g.dais} material={m.dais} position={[0, DAIS.h / 2, DAIS.cz]} receiveShadow raycast={() => null} />
      <mesh geometry={g.backdrop} material={m.backdrop} position={[0, 1.38, -1.0]} />
      <Instanced geometry={g.pool} material={m.pool} matrices={poolMx} colors={poolColor} interactive={false} renderOrder={1} />

      {/* booth dividers + gantry, and their neon edges */}
      <mesh geometry={g.work} material={m.shell} castShadow receiveShadow />
      <mesh geometry={g.neon} material={m.neon} raycast={() => null} />

      {/* stations */}
      <Instanced geometry={g.stat} material={m.solid} matrices={stationMx} castShadow receiveShadow />
      <mesh geometry={g.screens} material={m.screen} />
      <Instanced ref={refs.desk} geometry={g.deskLed} material={m.glow} matrices={stationMx} colors={dynColors} interactive={false} />
      <Instanced ref={refs.keys} geometry={g.keys} material={m.keys} matrices={stationMx} colors={dynColors} interactive={false} />
      <Instanced ref={refs.glowA} geometry={g.glowA} material={m.glow} matrices={stationMx} colors={dynColors} interactive={false} />
      <Instanced ref={refs.glowB} geometry={g.glowB} material={m.glow} matrices={stationMx} colors={dynColors} interactive={false} />

      {/* fans: static housing, spinning blades, RGB rings */}
      <Instanced geometry={g.frame} material={m.fanFrame} matrices={frameMx} interactive={false} />
      <Instanced ref={refs.blades} geometry={g.blades} material={m.fanBlade} matrices={bladeMx} interactive={false} />
      <Instanced ref={refs.ring} geometry={g.ring} material={m.glow} matrices={ringMx} colors={ringColors} interactive={false} />

      {/* tempered glass over everything inside the towers (drawn last so it blends over the internals) */}
      <Instanced geometry={g.glass} material={m.glass} matrices={stationMx} renderOrder={3} />
      <Instanced geometry={g.sheen} material={m.sheen} matrices={stationMx} interactive={false} renderOrder={4} />

      {/* chairs */}
      <Instanced geometry={g.chairBase} material={m.chairBase} matrices={chairMx} castShadow />
      <Instanced geometry={g.chairBody} material={m.leather} matrices={chairMx} castShadow receiveShadow />
      <Instanced geometry={g.chairAccent} material={m.accent} matrices={chairMx} colors={chairAccent} />
      <Instanced geometry={g.chairLed} material={m.glow} matrices={chairMx} colors={chairLedColor} interactive={false} />
    </group>
  );
};

export default UltraPcs;
