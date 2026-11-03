import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  AdditiveBlending,
  Float32BufferAttribute,
  LineSegments,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Material,
  MeshBasicMaterial,
  TubeGeometry,
  Vector3,
} from "three";
import { GeoBuilder, hdr, once, type V3 } from "../geo";
import { getSheenMap, makeMats, PALETTE } from "../materials";
import { Fans, type FanSpec } from "./Fans";
import { Float } from "../Part";
import { SpecLabel } from "../SpecLabel";

/* ------------------------------------------------------------------ *
 * Case local frame: front = +X, glass side = +Z, up = +Y.
 * Body is 2.3 (x) x 2.5 (y) x 1.1 (z). Parts are exploded outward:
 * front panel +X, glass +Z, board/RAM +Z a little, AIO +Y.
 * ------------------------------------------------------------------ */

const METAL = "#4a5060";
const METAL_LIGHT = "#8a93a6";
const BLACK = "#0c0e14";
const PCB = "#0b0f18";

const blue = (g = 2.6) => hdr(PALETTE.blue, g);
const magenta = (g = 3.4) => hdr(PALETTE.magenta, g);
const cyan = (g = 2.4) => hdr(PALETTE.cyan, g);

const getChassis = once(() => {
  const M = new GeoBuilder();
  const P = new GeoBuilder();
  const G = new GeoBuilder();
  // panels
  M.box(2.3, 2.5, 0.04, { pos: [0, 0, -0.53], color: METAL });
  M.box(2.3, 0.05, 1.1, { pos: [0, -1.225, 0], color: METAL });
  M.box(0.04, 2.5, 1.1, { pos: [-1.13, 0, 0], color: METAL });
  // open-top rim + glass-side posts
  M.box(2.3, 0.05, 0.05, { pos: [0, 1.225, 0.525], color: METAL_LIGHT });
  M.box(2.3, 0.05, 0.05, { pos: [0, 1.225, -0.525], color: METAL_LIGHT });
  M.box(0.05, 0.05, 1.1, { pos: [-1.12, 1.225, 0], color: METAL_LIGHT });
  M.box(0.05, 2.5, 0.05, { pos: [-1.12, 0, 0.525], color: METAL_LIGHT });
  M.box(2.3, 0.05, 0.05, { pos: [0, -1.225, 0.525], color: METAL_LIGHT });
  // PSU shroud
  P.rbox(1.65, 0.5, 1.0, 0.03, { pos: [-0.28, -0.97, 0], color: "#12141c" });
  for (let i = 0; i < 6; i++) M.box(0.012, 0.44, 1.01, { pos: [-0.95 + i * 0.1, -0.97, 0], color: "#1b1e28" });
  // RGB: underglow + vertical edge + shroud slit
  G.box(2.2, 0.014, 0.014, { pos: [0, -1.19, 0.5], color: magenta() });
  G.box(0.014, 2.4, 0.014, { pos: [-1.1, 0, 0.5], color: blue() });
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    G.box(0.1, 0.022, 0.012, { pos: [-0.72 + i * 0.1, -0.97, 0.503], color: new Color().copy(blue(2.4)).lerp(magenta(3), t) });
  }
  return { metal: M.build(), plastic: P.build(), glow: G.build() };
});

const getBoard = once(() => {
  const M = new GeoBuilder();
  const P = new GeoBuilder();
  const G = new GeoBuilder();
  P.box(1.22, 1.52, 0.03, { color: PCB });
  // VRM + IO armour (L shape), CPU, chipset, M.2
  M.rbox(0.2, 0.84, 0.1, 0.02, { pos: [-0.46, 0.3, 0.065], color: METAL });
  M.rbox(0.66, 0.2, 0.1, 0.02, { pos: [-0.12, 0.62, 0.065], color: METAL });
  for (let i = 0; i < 6; i++) M.box(0.62, 0.01, 0.104, { pos: [-0.12, 0.55 + i * 0.027, 0.065], color: "#222633" });
  P.box(0.44, 0.44, 0.02, { pos: [-0.1, 0.18, 0.025], color: "#08090e" });
  M.rbox(0.32, 0.32, 0.05, 0.02, { pos: [-0.1, 0.18, 0.055], color: METAL_LIGHT });
  M.rbox(0.5, 0.12, 0.04, 0.015, { pos: [-0.08, -0.22, 0.04], color: METAL });
  M.rbox(0.36, 0.34, 0.06, 0.02, { pos: [0.05, -0.55, 0.05], color: METAL });
  G.box(0.22, 0.014, 0.01, { pos: [0.05, -0.55, 0.082], color: cyan(2.2) });
  G.box(0.014, 0.2, 0.01, { pos: [0.05, -0.55, 0.082], color: magenta(2.8) });
  // DIMM slots
  for (let i = 0; i < 4; i++) P.box(0.04, 0.66, 0.04, { pos: [0.3 + i * 0.085, 0.3, 0.035], color: "#161922" });
  // right-hand edge accent glow on the PCB
  G.box(0.01, 1.4, 0.008, { pos: [0.6, 0, 0.02], color: blue(1.8) });
  return { metal: M.build(), plastic: P.build(), glow: G.build() };
});

const getRam = once(() => {
  const M = new GeoBuilder();
  const G = new GeoBuilder();
  M.rbox(0.05, 0.62, 0.14, 0.012, { pos: [0, 0, 0.0], color: "#2a2e3a" });
  const N = 8;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    G.box(0.052, 0.62 / N - 0.004, 0.026, {
      pos: [0, -0.31 + (i + 0.5) * (0.62 / N), 0.078],
      color: new Color().copy(blue(2.6)).lerp(magenta(3.4), t),
    });
  }
  return { metal: M.build(), glow: G.build() };
});

const getAio = once(() => {
  const M = new GeoBuilder();
  const P = new GeoBuilder();
  const G = new GeoBuilder();
  // radiator slab (fins read as dark slits on the long edges)
  M.rbox(1.92, 0.64, 0.14, 0.025, { color: "#2a2f3b" });
  for (let i = 0; i < 40; i++) P.box(0.012, 0.6, 0.15, { pos: [-0.9 + i * 0.047, 0, 0], color: "#0a0c12" });
  // end tanks
  M.rbox(0.1, 0.66, 0.16, 0.02, { pos: [-0.99, 0, 0], color: METAL_LIGHT });
  M.rbox(0.1, 0.66, 0.16, 0.02, { pos: [0.99, 0, 0], color: METAL_LIGHT });
  return { metal: M.build(), plastic: P.build(), glow: G.build() };
});

const getPump = once(() => {
  const M = new GeoBuilder();
  const P = new GeoBuilder();
  const G = new GeoBuilder();
  const R90: V3 = [Math.PI / 2, 0, 0];
  P.cyl(0.22, 0.22, 0.14, { rot: R90, color: "#10121a" });
  M.cyl(0.185, 0.185, 0.02, { rot: R90, pos: [0, 0, 0.08], color: METAL_LIGHT });
  G.torus(0.14, 0.014, { pos: [0, 0, 0.095], color: magenta(3.4) }, 6, 48);
  G.torus(0.075, 0.01, { pos: [0, 0, 0.095], color: blue(3) }, 6, 36);
  return { metal: M.build(), plastic: P.build(), glow: G.build() };
});

const getFront = once(() => {
  const P = new GeoBuilder();
  const M = new GeoBuilder();
  const G = new GeoBuilder();
  P.rbox(0.06, 0.08, 1.1, 0.02, { pos: [0, 1.21, 0], color: BLACK });
  P.rbox(0.06, 0.08, 1.1, 0.02, { pos: [0, -1.21, 0], color: BLACK });
  P.rbox(0.06, 2.5, 0.08, 0.02, { pos: [0, 0, 0.51], color: BLACK });
  P.rbox(0.06, 2.5, 0.08, 0.02, { pos: [0, 0, -0.51], color: BLACK });
  for (let i = 0; i < 14; i++) M.box(0.02, 0.016, 0.96, { pos: [0.02, -1.14 + i * 0.176, 0], color: "#1d212b" });
  G.box(0.016, 2.3, 0.014, { pos: [0.036, 0, 0.51], color: blue(2.8) });
  return { plastic: P.build(), metal: M.build(), glow: G.build() };
});

const getGlassFrame = once(() => {
  const P = new GeoBuilder();
  const M = new GeoBuilder();
  const W = 2.3;
  const H = 2.5;
  P.rbox(W, 0.06, 0.04, 0.012, { pos: [0, H / 2 - 0.03, 0], color: BLACK });
  P.rbox(W, 0.06, 0.04, 0.012, { pos: [0, -H / 2 + 0.03, 0], color: BLACK });
  P.rbox(0.06, H, 0.04, 0.012, { pos: [W / 2 - 0.03, 0, 0], color: BLACK });
  P.rbox(0.06, H, 0.04, 0.012, { pos: [-W / 2 + 0.03, 0, 0], color: BLACK });
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) M.cyl(0.035, 0.035, 0.06, { rot: [Math.PI / 2, 0, 0], pos: [sx * (W / 2 - 0.1), sy * (H / 2 - 0.1), 0.03], color: METAL_LIGHT }, 16);
  return { plastic: P.build(), metal: M.build() };
});

function Baked({ geo, mat }: { geo: BufferGeometry; mat: Material }) {
  return <mesh geometry={geo} material={mat} />;
}

/** Dashed assembly guides: the "exploded diagram" connective tissue. */
function Guides({ segments }: { segments: [V3, V3][] }) {
  const ref = useRef<LineSegments>(null!);
  const geo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(segments.flat(2), 3));
    return g;
  }, [segments]);
  useLayoutEffect(() => {
    ref.current.computeLineDistances();
  }, [geo]);
  return (
    <lineSegments ref={ref} geometry={geo} raycast={() => null}>
      <lineDashedMaterial color="#5fc9ff" dashSize={0.07} gapSize={0.09} transparent opacity={0.4} depthWrite={false} />
    </lineSegments>
  );
}

const GUIDES: [V3, V3][] = [
  // glass-side corners -> glass
  [[-1.15, 1.25, 0.58], [-1.15, 1.25, 1.9]],
  [[-1.15, -1.25, 0.58], [-1.15, -1.25, 1.9]],
  [[1.15, 1.25, 0.58], [1.15, 1.25, 1.9]],
  [[1.15, -1.25, 0.58], [1.15, -1.25, 1.9]],
  // front panel
  [[1.18, 1.25, -0.55], [1.78, 1.25, -0.55]],
  [[1.18, -1.25, -0.55], [1.78, -1.25, -0.55]],
  [[1.18, 1.25, 0.55], [1.78, 1.25, 0.55]],
  [[1.18, -1.25, 0.55], [1.78, -1.25, 0.55]],
  // AIO radiator lifts straight up
  [[-1.1, 1.27, 0], [-1.1, 1.78, 0]],
  [[1.0, 1.27, 0], [1.0, 1.78, 0]],
  // pump -> CPU
  [[-0.52, 0.36, 0.0], [-0.52, 0.36, 0.42]],
];

const FRONT_FANS: FanSpec[] = [-0.78, 0, 0.78].map((y, i) => ({
  pos: [-0.12, y, 0] as V3,
  rot: [0, Math.PI / 2, 0] as V3,
  size: 0.72,
  color: new Color().copy(blue(2.6)).lerp(magenta(3.2), i / 2),
}));

const RAD_FANS: FanSpec[] = [-0.64, 0, 0.64].map((x, i) => ({
  pos: [x, 0, 0.13] as V3,
  size: 0.62,
  color: new Color().copy(magenta(3.2)).lerp(blue(2.6), i / 2),
}));

export function PcCase({ label }: { label: { category: string; value: string } }) {
  const mats = useMemo(() => ({ chassis: makeMats(), board: makeMats(), ram: makeMats(), aio: makeMats(), pump: makeMats(), front: makeMats(), glassFrame: makeMats() }), []);
  const chassis = getChassis();
  const board = getBoard();
  const ram = getRam();
  const aio = getAio();
  const pump = getPump();
  const front = getFront();
  const gframe = getGlassFrame();

  const glass = useMemo(() => {
    const m = new MeshPhysicalMaterial({
      color: new Color("#a7dcff"),
      metalness: 0,
      roughness: 0.05,
      transparent: true,
      opacity: 0.045,
      envMapIntensity: 2.2,
      side: DoubleSide,
      depthWrite: false,
    });
    m.userData.noHover = true;
    return m;
  }, []);
  const sheen = useMemo(() => {
    const m = new MeshBasicMaterial({ map: getSheenMap(), transparent: true, opacity: 0.12, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
    m.userData.noHover = true;
    return m;
  }, []);
  const tubeGeo = useMemo(() => {
    // pump-local frame (pump Float sits at [-0.52, 0.4, 0.5]); rad end tank is at [-0.57, 1.48, -0.45] from there
    const mk = (dx: number, dy: number) =>
      new TubeGeometry(
        new CatmullRomCurve3([
          new Vector3(-0.17, 0.05 + dy, 0),
          new Vector3(-0.42 + dx, 0.34 + dy, 0.12),
          new Vector3(-0.62 + dx, 0.95, -0.12),
          new Vector3(-0.56 + dx, 1.4, -0.42),
        ]),
        40,
        0.032,
        8,
      );
    return [mk(0, 0.07), mk(0.09, -0.07)];
  }, []);
  const tubeMat = useMemo(() => new MeshStandardMaterial({ color: "#2a3040", metalness: 0.35, roughness: 0.38, envMapIntensity: 1.6 }), []);

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.all.forEach((x) => x.dispose()));
      glass.dispose();
      sheen.dispose();
      tubeMat.dispose();
      tubeGeo.forEach((g) => g.dispose());
    },
    [mats, glass, sheen, tubeGeo, tubeMat],
  );

  return (
    <group>
      {/* chassis shell */}
      <Baked geo={chassis.metal} mat={mats.chassis.metal} />
      <Baked geo={chassis.plastic} mat={mats.chassis.plastic} />
      <Baked geo={chassis.glow} mat={mats.chassis.glow} />

      <Guides segments={GUIDES} />
      <pointLight position={[-0.5, 0.3, 1.1]} intensity={9} distance={4.5} color={PALETTE.blue} />
      <pointLight position={[0.4, -0.5, 1.2]} intensity={7} distance={4} color={PALETTE.magenta} />

      {/* motherboard + CPU: lifted off the back panel */}
      <Float position={[-0.42, 0.18, -0.08]} amp={0.025} speed={0.5} phase={1.1} drift={0.012}>
        <Baked geo={board.metal} mat={mats.board.metal} />
        <Baked geo={board.plastic} mat={mats.board.plastic} />
        <Baked geo={board.glow} mat={mats.board.glow} />
        <SpecLabel
          id="case"
          index={1}
          category={label.category}
          value={label.value}
          anchor={[-0.1, 0.18, 0.085]}
          elbow={[-1.6, 0.9, 0.7]}
          side="left"
        />
      </Float>

      {/* RAM sticks: further out on the same axis */}
      <Float position={[-0.42, 0.48, 0.5]} amp={0.03} speed={0.62} phase={2.4} drift={0.012}>
        {[0.3, 0.47].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <Baked geo={ram.metal} mat={mats.ram.metal} />
            <Baked geo={ram.glow} mat={mats.ram.glow} />
          </group>
        ))}
      </Float>

      {/* AIO: radiator + 3 RGB fans float above, pump hovers in front of the CPU */}
      <Float position={[-0.1, 1.88, 0.05]} amp={0.045} speed={0.48} phase={3.3} drift={0.02}>
        <Baked geo={aio.metal} mat={mats.aio.metal} />
        <Baked geo={aio.plastic} mat={mats.aio.plastic} />
        <Fans fans={RAD_FANS} rpm={0.9} />
      </Float>
      <Float position={[-0.52, 0.4, 0.5]} amp={0.03} speed={0.58} phase={4.2} drift={0.015}>
        <Baked geo={pump.plastic} mat={mats.pump.plastic} />
        <Baked geo={pump.metal} mat={mats.pump.metal} />
        <Baked geo={pump.glow} mat={mats.pump.glow} />
        {tubeGeo.map((g, i) => (
          <mesh key={i} geometry={g} material={tubeMat} />
        ))}
      </Float>

      {/* front panel with intake fans, slid out along +X */}
      <Float position={[1.72, 0, 0]} amp={0.03} speed={0.5} phase={5.1} drift={0.015}>
        <Baked geo={front.plastic} mat={mats.front.plastic} />
        <Baked geo={front.metal} mat={mats.front.metal} />
        <Baked geo={front.glow} mat={mats.front.glow} />
        <Fans fans={FRONT_FANS} rpm={0.8} />
      </Float>

      {/* tempered glass side panel, slid out along +Z */}
      <Float position={[0, 0, 1.95]} amp={0.04} speed={0.45} phase={0.4} drift={0.02}>
        <mesh material={glass}>
          <planeGeometry args={[2.3, 2.5]} />
        </mesh>
        <mesh material={sheen} position={[0, 0, 0.006]}>
          <planeGeometry args={[2.3, 2.5]} />
        </mesh>
        <Baked geo={gframe.plastic} mat={mats.glassFrame.plastic} />
        <Baked geo={gframe.metal} mat={mats.glassFrame.metal} />
      </Float>
    </group>
  );
}

export function GpuCard({ label }: { label: { category: string; value: string } }) {
  const mats = useMemo(() => makeMats(), []);
  const geo = useMemo(() => {
    const M = new GeoBuilder();
    const P = new GeoBuilder();
    const G = new GeoBuilder();
    P.rbox(1.5, 0.58, 0.1, 0.045, { color: "#0d0f16" });
    M.rbox(1.46, 0.54, 0.022, 0.02, { pos: [0, 0, -0.07], color: METAL });
    M.rbox(1.5, 0.05, 0.115, 0.02, { pos: [0, 0.27, 0], color: METAL_LIGHT });
    M.rbox(1.5, 0.04, 0.115, 0.02, { pos: [0, -0.27, 0], color: METAL });
    M.box(0.03, 0.62, 0.24, { pos: [-0.78, 0, -0.03], color: METAL_LIGHT });
    for (let i = 0; i < 3; i++) P.box(0.034, 0.1, 0.1, { pos: [-0.78, -0.18 + i * 0.18, 0.0], color: "#06070a" });
    P.box(0.2, 0.05, 0.08, { pos: [0.5, 0.31, -0.0], color: "#06070a" });
    G.box(1.2, 0.014, 0.012, { pos: [0.04, 0.27, 0.062], color: magenta(3.4) });
    G.box(0.014, 0.46, 0.012, { pos: [0.745, 0, 0.056], color: blue(3) });
    return { metal: M.build(), plastic: P.build(), glow: G.build() };
  }, []);
  const fans = useMemo<FanSpec[]>(
    () => [
      { pos: [-0.37, 0, 0.055], size: 0.5, color: blue(2.8) },
      { pos: [0.3, 0, 0.055], size: 0.5, color: magenta(3.4) },
    ],
    [],
  );
  useEffect(() => () => mats.all.forEach((m) => m.dispose()), [mats]);
  return (
    <group>
      <Baked geo={geo.metal} mat={mats.metal} />
      <Baked geo={geo.plastic} mat={mats.plastic} />
      <Baked geo={geo.glow} mat={mats.glow} />
      <Fans fans={fans} rpm={1.1} />
      <SpecLabel index={2} id="gpu" category={label.category} value={label.value} anchor={[-0.6, -0.3, 0.06]} elbow={[-1.9, -1.35, 0.3]} side="left" />
    </group>
  );
}
