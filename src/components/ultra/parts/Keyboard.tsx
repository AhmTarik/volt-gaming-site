import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, Color, InstancedMesh, MeshBasicMaterial, Object3D, PlaneGeometry } from "three";
import { GeoBuilder, hdr } from "../geo";
import { makeMats, PALETTE } from "../materials";
import { Float } from "../Part";
import { SpecLabel } from "../SpecLabel";

/* Tenkeyless layout, in key units. Negative numbers are gaps. */
const ROWS: number[][] = [
  [1, -1, 1, 1, 1, 1, -0.5, 1, 1, 1, 1, -0.5, 1, 1, 1, 1, -0.25, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, -0.25, 1, 1, 1],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, -0.25, 1, 1, 1],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75, -1.25, 1],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25, -0.25, 1, 1, 1],
];

type Accent = "base" | "mod" | "blue" | "magenta";
interface Key {
  x: number;
  z: number;
  w: number;
  accent: Accent;
}

const TOTAL = 18.25; // widest row, in key units
const DEPTH = 6; // z centre-to-centre of the first and last row

/** Resolve the layout once: centred on the origin, X to the right, rows running +Z toward the typist. */
const buildKeys = (): Key[] => {
  const keys: Key[] = [];
  ROWS.forEach((row, r) => {
    let cursor = 0;
    let idx = -1;
    row.forEach((v) => {
      if (v < 0) {
        cursor -= v;
        return;
      }
      idx++;
      const z = (r === 0 ? 0 : r + 0.5) - (DEPTH - 0.5) / 2;
      let accent: Accent = v >= 1.5 ? "mod" : "base";
      if (r === 0 && idx === 0) accent = "magenta"; // Esc
      if (r === 3 && v === 2.25) accent = "magenta"; // Enter
      if ((r === 2 && idx === 2) || (r === 3 && idx >= 1 && idx <= 3)) accent = "blue"; // WASD
      if ((r === 4 && v === 1 && idx === 12) || (r === 5 && v === 1)) accent = "blue"; // arrows
      keys.push({ x: cursor + v / 2 - TOTAL / 2, z, w: v, accent });
      cursor += v;
    });
  });
  return keys;
};

const U = 0.172; // world size of one key unit
const CAP = 0.15; // keycap footprint at 1u

/** Flat-top keycap, tapered like an SA/Cherry profile. Unit width, scaled per instance. */
const makeCap = () => {
  const g = new BoxGeometry(1, 1, 1, 1, 1, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) > 0) {
      p.setX(i, p.getX(i) * 0.78);
      p.setZ(i, p.getZ(i) * 0.7);
    }
  }
  g.computeVertexNormals();
  return g;
};

export function Keyboard({ label }: { label: { category: string; value: string } }) {
  const mats = useMemo(() => ({ case: makeMats(), cap: makeMats(), sw: makeMats(), led: new MeshBasicMaterial({ toneMapped: false }), stem: makeMats() }), []);
  const keys = useMemo(buildKeys, []);
  const total = TOTAL;
  const W = TOTAL * U + 0.28;
  const D = (DEPTH + 0.5) * U + 0.26;

  const caps = useRef<InstancedMesh>(null!);
  const housings = useRef<InstancedMesh>(null!);
  const stems = useRef<InstancedMesh>(null!);
  const leds = useRef<InstancedMesh>(null!);

  const geo = useMemo(() => {
    const M = new GeoBuilder();
    const P = new GeoBuilder();
    const G = new GeoBuilder();
    // case tray + plate
    P.rbox(W, 0.1, D, 0.05, { pos: [0, -0.02, 0], color: "#0b0d13" });
    M.rbox(W - 0.1, 0.16, 0.04, 0.02, { pos: [0, 0.02, -D / 2 + 0.05], color: "#2f3441" });
    const plate = new GeoBuilder();
    plate.rbox(W - 0.1, 0.03, D - 0.1, 0.012, { color: "#5a6172" });
    // glow rim + front lip
    G.box(W - 0.06, 0.012, 0.012, { pos: [0, -0.04, D / 2 - 0.02], color: hdr(PALETTE.magenta, 3.4) });
    G.box(0.012, 0.012, D - 0.06, { pos: [-W / 2 + 0.02, -0.04, 0], color: hdr(PALETTE.blue, 2.8) });
    G.box(0.012, 0.012, D - 0.06, { pos: [W / 2 - 0.02, -0.04, 0], color: hdr(PALETTE.blue, 2.8) });
    return { tray: P.build(), trayM: M.build(), trayGlow: G.build(), plate: plate.build() };
  }, [W, D]);

  const capGeo = useMemo(makeCap, []);
  const swGeo = useMemo(() => new BoxGeometry(0.115, 0.11, 0.115), []);
  const stemGeo = useMemo(() => new BoxGeometry(0.045, 0.1, 0.045), []);
  const ledGeo = useMemo(() => {
    const g = new PlaneGeometry(0.09, 0.05);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  useLayoutEffect(() => {
    const o = new Object3D();
    const c = new Color();
    const tone: Record<Accent, Color> = {
      base: new Color("#1a1d27"),
      mod: new Color("#0f1118"),
      blue: new Color(PALETTE.blue).multiplyScalar(0.42),
      magenta: new Color(PALETTE.magenta).multiplyScalar(0.5),
    };
    const magenta = new Color(PALETTE.magenta);
    keys.forEach((k, i) => {
      const x = k.x * U;
      const z = k.z * U;
      // keycaps: top layer
      o.position.set(x, 0, z);
      o.scale.set(k.w * U - (U - CAP), 0.095, CAP);
      o.updateMatrix();
      caps.current.setMatrixAt(i, o.matrix);
      caps.current.setColorAt(i, tone[k.accent]);
      // switch housing + red stem
      o.position.set(x, 0.07, z);
      o.scale.set(1, 1, 1);
      o.updateMatrix();
      housings.current.setMatrixAt(i, o.matrix);
      o.position.set(x, 0.17, z);
      o.updateMatrix();
      stems.current.setMatrixAt(i, o.matrix);
      // per-key LED on the PCB, blue -> magenta sweep across X
      o.position.set(x, 0.022, z + 0.055);
      o.scale.set(Math.min(k.w, 1.4), 1, 1);
      o.updateMatrix();
      leds.current.setMatrixAt(i, o.matrix);
      const t = (k.x + total / 2) / total;
      c.set(PALETTE.blue).lerp(magenta, Math.pow(t, 1.15)).multiplyScalar(3.1);
      leds.current.setColorAt(i, c);
    });
    for (const r of [caps, housings, stems, leds]) {
      r.current.instanceMatrix.needsUpdate = true;
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
    }
  }, [keys, total]);

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => ('all' in m ? m.all.forEach((x) => x.dispose()) : m.dispose()));
    },
    [mats],
  );
  // stem + housing colours
  const stemMat = useMemo(() => {
    const m = mats.stem.plastic.clone();
    m.vertexColors = false;
    m.color = new Color("#e5143c");
    m.roughness = 0.5;
    m.emissive = new Color("#ff0030");
    m.emissiveIntensity = 0.25;
    return m;
  }, [mats]);
  const capMat = useMemo(() => {
    const m = mats.cap.plastic.clone();
    m.vertexColors = false;
    m.color = new Color("#ffffff");
    m.roughness = 0.62;
    return m;
  }, [mats]);
  const smoke = mats.sw.smoke;

  const n = keys.length;
  return (
    <group>
      {/* layer 0: case tray with RGB rim */}
      <mesh geometry={geo.tray} material={mats.case.plastic} />
      <mesh geometry={geo.trayM} material={mats.case.metal} />
      <mesh geometry={geo.trayGlow} material={mats.case.glow} />
      {/* layer 1: plate, switches and per-key LEDs */}
      <Float position={[0, 0.3, 0]} amp={0.02} speed={0.6} phase={1.3} drift={0.008}>
        <mesh geometry={geo.plate} material={mats.case.metal} />
        <instancedMesh frustumCulled={false} ref={leds} args={[ledGeo, mats.led, n]} />
        <instancedMesh frustumCulled={false} ref={housings} args={[swGeo, smoke, n]} />
        <instancedMesh frustumCulled={false} ref={stems} args={[stemGeo, stemMat, n]} />
      </Float>
      {/* layer 2: keycaps */}
      <Float position={[0, 0.64, 0]} amp={0.03} speed={0.55} phase={2.9} drift={0.01}>
        <instancedMesh frustumCulled={false} ref={caps} args={[capGeo, capMat, n]} />
      </Float>

      <SpecLabel index={4} id="keyboard" category={label.category} value={label.value} anchor={[-W / 2 + 0.5, 0.35, D / 2 - 0.05]} elbow={[-W / 2 - 0.3, -0.25, D / 2 + 0.7]} side="left" />
    </group>
  );
}
