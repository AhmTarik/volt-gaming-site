import { ExtrudeGeometry, Path, Shape, ShapeGeometry } from "three";
import { GeoBuilder, once } from "./geo";

/**
 * Unit PC fan (diameter 1, faces +Z, thickness ~0.14). Scale the instance to the real size.
 * Three shared geometries so every fan in the lounge is 3 instanced draw calls total.
 */

/** 9 pitched blades + hub. Spun by rotating the instance about Z. */
export const getFanBlades = once(() => {
  const b = new GeoBuilder();
  const N = 9;
  for (let i = 0; i < N; i++) {
    const s = new Shape();
    s.moveTo(0.07, -0.02);
    s.bezierCurveTo(0.2, -0.1, 0.38, -0.11, 0.47, -0.03);
    s.bezierCurveTo(0.44, 0.06, 0.3, 0.12, 0.07, 0.045);
    s.closePath();
    // pitch about the radial (X) axis, then spread around Z
    const g = new ShapeGeometry(s, 8);
    g.rotateX(0.55);
    g.rotateZ((i / N) * Math.PI * 2);
    b.add(g, { color: "#0b0c13" });
  }
  b.cyl(0.15, 0.15, 0.09, { rot: [Math.PI / 2, 0, 0], color: "#14161f" }, 24);
  b.cyl(0.11, 0.11, 0.02, { rot: [Math.PI / 2, 0, 0], pos: [0, 0, 0.05], color: "#232736" }, 24);
  return b.build();
});

/** Square housing with a round bore. Static. */
export const getFanFrame = once(() => {
  const s = new Shape();
  const h = 0.5;
  const r = 0.07;
  s.moveTo(-h + r, -h);
  s.lineTo(h - r, -h);
  s.quadraticCurveTo(h, -h, h, -h + r);
  s.lineTo(h, h - r);
  s.quadraticCurveTo(h, h, h - r, h);
  s.lineTo(-h + r, h);
  s.quadraticCurveTo(-h, h, -h, h - r);
  s.lineTo(-h, -h + r);
  s.quadraticCurveTo(-h, -h, -h + r, -h);
  const hole = new Path();
  hole.absarc(0, 0, 0.465, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const g = new ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false, curveSegments: 28 });
  g.translate(0, 0, -0.06);
  return g;
});

/** RGB ring + hub ring, MeshBasic with instanceColor. */
export const getFanRing = once(() => {
  const b = new GeoBuilder();
  b.torus(0.455, 0.03, { pos: [0, 0, 0.06] }, 6, 40);
  b.torus(0.17, 0.024, { pos: [0, 0, 0.065] }, 6, 28);
  return b.build();
});
