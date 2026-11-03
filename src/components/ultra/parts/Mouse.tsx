import { useEffect, useMemo } from "react";
import { BufferAttribute, SphereGeometry, MathUtils } from "three";
import { GeoBuilder, hdr } from "../geo";
import { makeMats, PALETTE } from "../materials";
import { Float } from "../Part";
import { SpecLabel } from "../SpecLabel";

const METAL = "#4a5060";
const METAL_LIGHT = "#8a93a6";

/**
 * Right-hand ergonomic shell: a unit sphere pulled into a hump that peaks toward the palm (rear),
 * narrows and drops toward the buttons (front, -Z), flat on the bottom. Not a lathe: a real mouse
 * is asymmetric, so the hump leans right and the left flank is sculpted for the thumb.
 */
const makeShell = () => {
  const L = 1.1; // length (z)
  const Wd = 0.62; // width (x)
  const H = 0.52; // height
  const g = new SphereGeometry(1, 56, 36);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i);
    let y = p.getY(i);
    let z = p.getZ(i);
    const zn = z; // -1 front .. +1 rear
    const front = MathUtils.clamp((1 - zn) / 2, 0, 1); // 1 at the front
    const widthK = 0.8 + 0.2 * Math.pow(1 - front, 0.7); // narrower toward buttons
    const hump = MathUtils.clamp(1 - Math.pow(front * 1.1, 1.7) * 0.62, 0.3, 1);
    const upper = Math.max(y, 0);
    // lean the hump to the right, scoop the left flank (thumb rest)
    x = x * Wd * widthK;
    if (x < 0) x *= 1 - 0.1 * Math.sin(MathUtils.clamp((zn + 0.2) * 2, 0, Math.PI));
    x += 0.04 * upper * (1 - front);
    y = Math.pow(upper, 0.82) * H * hump;
    z = z * L * 0.5 + 0.0;
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    // matte graphite, a touch lighter on the crown so the form reads against the backlight
    const k = 0.62 + 0.38 * MathUtils.clamp(p.getY(i) / 0.3, 0, 1);
    col[i * 3] = 0.075 * k;
    col[i * 3 + 1] = 0.085 * k;
    col[i * 3 + 2] = 0.115 * k;
  }
  g.setAttribute("color", new BufferAttribute(col, 3));
  return g;
};

export function Mouse({ label }: { label: { category: string; value: string } }) {
  const mats = useMemo(() => ({ shell: makeMats(), base: makeMats(), pcb: makeMats(), wheel: makeMats() }), []);
  const shellGeo = useMemo(makeShell, []);
  const geo = useMemo(() => {
    const P = new GeoBuilder(); // base tray
    const G = new GeoBuilder(); // base glow
    P.rbox(0.62, 0.05, 1.08, 0.06, { color: "#0a0c12" }, 4);
    P.rbox(0.18, 0.05, 0.4, 0.02, { pos: [-0.36, 0.0, -0.1], color: "#0a0c12" });
    // underglow rim, floats just below the shell edge
    const rim = new GeoBuilder();
    rim.rbox(0.64, 0.016, 1.1, 0.07, { pos: [0, -0.03, 0], color: hdr(PALETTE.magenta, 3.2) }, 4);
    const ring = new GeoBuilder();
    ring.torus(0.06, 0.012, { rot: [Math.PI / 2, 0, 0], pos: [0, 0.05, -0.05], color: hdr(PALETTE.cyan, 3) }, 6, 24);
    // PCB layer + sensor
    const PC = new GeoBuilder();
    PC.rbox(0.44, 0.02, 0.86, 0.04, { color: "#0b0f18" });
    PC.rbox(0.1, 0.03, 0.1, 0.01, { pos: [0, 0.02, -0.05], color: "#1a1d27" });
    const PG = new GeoBuilder();
    PG.cyl(0.03, 0.03, 0.016, { pos: [0, 0.03, -0.05], color: hdr(PALETTE.cyan, 3.2) }, 20);
    PG.box(0.34, 0.01, 0.01, { pos: [0, 0.015, 0.35], color: hdr(PALETTE.blue, 2.8) });
    // top shell details: button split + thumb buttons
    const D = new GeoBuilder();
    // left/right button split follows the crown of the shell
    for (let zn = -0.96; zn <= -0.2; zn += 0.08) {
      const front = (1 - zn) / 2;
      const hump = MathUtils.clamp(1 - Math.pow(front * 1.1, 1.7) * 0.62, 0.3, 1);
      const yTop = Math.pow(Math.sqrt(1 - zn * zn), 0.82) * 0.52 * hump;
      D.box(0.022, 0.012, 0.09, { pos: [0.04 * yTop * (1 - front), yTop + 0.002, (zn * 1.1) / 2], color: "#050609" });
    }
    // scroll wheel
    const WH = new GeoBuilder();
    WH.cyl(0.07, 0.07, 0.07, { rot: [0, 0, Math.PI / 2], color: "#1b1e29" }, 28);
    for (let i = 0; i < 6; i++) WH.box(0.074, 0.145, 0.008, { rot: [(i / 6) * Math.PI, 0, 0], color: "#0a0b10" });
    const WG = new GeoBuilder();
    WG.torus(0.07, 0.009, { rot: [0, Math.PI / 2, 0], pos: [0.036, 0, 0], color: hdr(PALETTE.magenta, 3.4) }, 6, 28);
    WG.torus(0.07, 0.009, { rot: [0, Math.PI / 2, 0], pos: [-0.036, 0, 0], color: hdr(PALETTE.magenta, 3.4) }, 6, 28);
    return { base: P.build(), rim: rim.build(), ring: ring.build(), pcb: PC.build(), pcbGlow: PG.build(), detail: D.build(), wheel: WH.build(), wheelGlow: WG.build(), glow: G.build() };
  }, []);

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.all.forEach((x) => x.dispose()));
      shellGeo.dispose();
    },
    [mats, shellGeo],
  );

  return (
    <group rotation={[0, 0.0, 0]} scale={1.25}>
      <mesh geometry={geo.base} material={mats.base.plastic} />
      <mesh geometry={geo.rim} material={mats.base.glow} />
      <Float position={[0, 0.34, 0.02]} amp={0.02} speed={0.62} phase={0.7} drift={0.008}>
        <mesh geometry={geo.pcb} material={mats.pcb.plastic} />
        <mesh geometry={geo.pcbGlow} material={mats.pcb.glow} />
      </Float>
      <Float position={[0, 1.0, -0.02]} amp={0.03} speed={0.58} phase={2.1} drift={0.02}>
        <mesh geometry={shellGeo} material={mats.shell.plastic} />
        <mesh geometry={geo.detail} material={mats.shell.metal} />
      </Float>
      <Float position={[0, 0.7, -0.32]} amp={0.03} speed={0.66} phase={3.6} drift={0.01}>
        <mesh geometry={geo.wheel} material={mats.wheel.plastic} />
        <mesh geometry={geo.wheelGlow} material={mats.wheel.glow} />
      </Float>
      <SpecLabel index={5} id="mouse" category={label.category} value={label.value} anchor={[0.15, 1.2, 0.2]} elbow={[0.75, 1.75, 0.5]} side="right" />
    </group>
  );
}
