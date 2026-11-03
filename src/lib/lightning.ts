// Procedural lightning: midpoint displacement + branching. Pure geometry/drawing,
// no React. Used by the hero strike and the navbar logo spark.

export interface Pt {
  x: number;
  y: number;
}
export interface Seg {
  pts: Pt[];
  width: number; // relative 0..1 (1 = main trunk)
}

/** Midpoint displacement between a and b. `rough` is the initial offset as a fraction of length. */
export function displace(a: Pt, b: Pt, rough: number, depth: number): Pt[] {
  let pts: Pt[] = [a, b];
  let offset = Math.hypot(b.x - a.x, b.y - a.y) * rough;
  for (let d = 0; d < depth; d++) {
    const next: Pt[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i];
      const q = pts[i + 1];
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      const o = (Math.random() - 0.5) * 2 * offset;
      next.push({ x: (p.x + q.x) / 2 + (-dy / len) * o, y: (p.y + q.y) / 2 + (dx / len) * o });
      next.push(q);
    }
    pts = next;
    offset *= 0.55;
  }
  return pts;
}

/** A trunk from a to b with recursive forks that drift away from it. */
export function makeBolt(a: Pt, b: Pt, opts: { depth?: number; rough?: number; forks?: number; forkDepth?: number } = {}): Seg[] {
  const { depth = 7, rough = 0.18, forks = 5, forkDepth = 1 } = opts;
  const segs: Seg[] = [];
  const build = (from: Pt, to: Pt, width: number, level: number) => {
    const pts = displace(from, to, rough, depth - level * 2);
    segs.push({ pts, width });
    if (level >= forkDepth) return;
    const n = Math.max(1, Math.round(forks * (level === 0 ? 1 : 0.4)));
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(pts.length * (0.15 + Math.random() * 0.7));
      const p = pts[idx];
      const dir = { x: to.x - from.x, y: to.y - from.y };
      const ang = Math.atan2(dir.y, dir.x) + (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.6);
      const len = Math.hypot(dir.x, dir.y) * (0.18 + Math.random() * 0.22) * (level === 0 ? 1 : 0.6);
      build(p, { x: p.x + Math.cos(ang) * len, y: p.y + Math.sin(ang) * len }, width * 0.5, level + 1);
    }
  };
  build(a, b, 1, 0);
  return segs;
}

/** Draw bolt as layered strokes: wide soft glow, mid colour, thin bright core. */
export function drawBolt(
  ctx: CanvasRenderingContext2D,
  segs: Seg[],
  alpha: number,
  scale: number,
  glow = "hsl(263 70% 58%)",
  mid = "hsl(185 80% 50%)",
  core = "hsl(270 100% 96%)",
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "lighter";
  const layers: [string, number, number][] = [
    [glow, 9, 0.22],
    [mid, 3.5, 0.55],
    [core, 1.4, 1],
  ];
  for (const [color, w, a] of layers) {
    ctx.strokeStyle = color;
    for (const s of segs) {
      ctx.globalAlpha = Math.min(1, alpha * a);
      ctx.lineWidth = Math.max(0.6, w * s.width * scale);
      ctx.beginPath();
      ctx.moveTo(s.pts[0].x, s.pts[0].y);
      for (let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i].x, s.pts[i].y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
