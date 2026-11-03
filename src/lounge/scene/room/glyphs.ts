import { BufferGeometry, CylinderGeometry, SphereGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type P = [number, number];
interface Glyph {
  w: number;
  strokes: P[][];
}

const D = Math.PI / 180;
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n = 8): P[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as P;
  });

const bowl = (): P[] => [[0, 0], [0, 1], ...arc(0.35, 0.725, 0.275, 90 * D, -90 * D), [0, 0.45]];

const O: P[] = [
  ...arc(0.3, 0.3, 0.3, 270 * D, 180 * D),
  ...arc(0.3, 0.7, 0.3, 180 * D, 90 * D),
  ...arc(0.4, 0.7, 0.3, 90 * D, 0),
  ...arc(0.4, 0.3, 0.3, 0, -90 * D),
  [0.3, 0],
];

/** Single-stroke tube alphabet (unit height). Only the letters the lounge signs need. */
const GLYPHS: Record<string, Glyph> = {
  V: { w: 0.7, strokes: [[[0, 1], [0.35, 0], [0.7, 1]]] },
  O: { w: 0.7, strokes: [O] },
  L: { w: 0.55, strokes: [[[0, 1], [0, 0], [0.55, 0]]] },
  T: { w: 0.7, strokes: [[[0, 1], [0.7, 1]], [[0.35, 1], [0.35, 0]]] },
  I: { w: 0, strokes: [[[0, 1], [0, 0]]] },
  U: { w: 0.7, strokes: [[[0, 1], [0, 0.35], ...arc(0.35, 0.35, 0.35, Math.PI, 2 * Math.PI).slice(1), [0.7, 1]]] },
  P: { w: 0.625, strokes: [bowl()] },
  R: { w: 0.625, strokes: [bowl(), [[0.3, 0.45], [0.625, 0]]] },
  A: { w: 0.74, strokes: [[[0, 0], [0.37, 1], [0.74, 0]], [[0.14, 0.38], [0.6, 0.38]]] },
  // lightning bolt
  "*": { w: 0.55, strokes: [[[0.55, 1], [0.05, 0.4], [0.5, 0.48], [0, 0]]] },
};

const GAP = 0.32;

export const measureNeon = (text: string, height: number, tracking = GAP) => {
  let w = 0;
  [...text].forEach((ch, i) => {
    const g = GLYPHS[ch];
    if (g) w += g.w + (i < text.length - 1 ? tracking : 0);
  });
  return w * height;
};

const tube = (pts: P[], r: number): BufferGeometry[] => {
  const out: BufferGeometry[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 1e-5) continue;
    const g = new CylinderGeometry(r, r, len, 8, 1, true);
    g.rotateZ(Math.atan2(y1 - y0, x1 - x0) - Math.PI / 2);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, 0);
    out.push(g);
  }
  for (const [x, y] of pts) {
    const s = new SphereGeometry(r, 8, 6);
    s.translate(x, y, 0);
    out.push(s);
  }
  return out;
};

/** One merged geometry per letter, laid out centred on the origin in the XY plane. */
export const buildNeonLetters = (text: string, height: number, tracking = GAP) => {
  const total = measureNeon(text, height, tracking);
  const r = height * 0.05;
  const letters: BufferGeometry[] = [];
  let x = 0;
  [...text].forEach((ch, i) => {
    const g = GLYPHS[ch];
    if (!g) return;
    const parts = g.strokes.flatMap((s) =>
      tube(
        s.map(([px, py]) => [px * height, py * height] as P),
        r,
      ),
    );
    const merged = mergeGeometries(parts, false);
    parts.forEach((p) => p.dispose());
    if (merged) {
      merged.translate(x * height - total / 2, -height / 2, 0);
      letters.push(merged);
    }
    x += g.w + (i < text.length - 1 ? tracking : 0);
  });
  return { letters, width: total };
};
