import { Color } from "three";

/**
 * Emissive palette gains tuned for Effects.tsx (Bloom on luminance, threshold 0.6):
 * cyan blooms from ~1, magenta needs >=3, purple >=3.5. Anything stronger than the gains below
 * is a hover/active boost on top.
 */
export const GLOW = {
  cyan: new Color("#00f0ff").multiplyScalar(2.1),
  magenta: new Color("#ff007f").multiplyScalar(3.9),
  purple: new Color("#8b5cf6").multiplyScalar(4.6),
};

const _a = new Color();

/** cyan -> purple -> magenta -> (loops back) sample, t in [0,1). Writes into `out`. */
export const sampleGlow = (t: number, out: Color) => {
  const u = ((t % 1) + 1) % 1;
  // triangle wave 0..1..0 so the cycle is seamless
  const k = u < 0.5 ? u * 2 : (1 - u) * 2;
  if (k < 0.5) return out.copy(GLOW.cyan).lerp(_a.copy(GLOW.purple), k * 2);
  return out.copy(GLOW.purple).lerp(_a.copy(GLOW.magenta), (k - 0.5) * 2);
};

/** HDR cyan -> purple -> magenta ramp for static gradients (neon edges). */
export const rampGlow = (t: number) => {
  const k = Math.min(1, Math.max(0, t));
  const c = new Color();
  if (k < 0.5) return c.copy(GLOW.cyan).lerp(new Color().copy(GLOW.purple), k * 2);
  return c.copy(GLOW.purple).lerp(new Color().copy(GLOW.magenta), (k - 0.5) * 2);
};
