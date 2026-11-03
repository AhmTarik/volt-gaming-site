import { Color, MeshBasicMaterial } from "three";

/**
 * Emissive "neon" surface. Colour is multiplied above 1 and tone mapping is off,
 * so only these surfaces cross the bloom threshold.
 */
/** Bloom is luminance-based (threshold 0.6): magenta and purple are darker, so they need more gain to glow like cyan. */
export const NEON_GAIN: Record<string, number> = {
  "#00f0ff": 2.2,
  "#ff007f": 4.2,
  "#8b5cf6": 4.8,
};

export const neonMaterial = (hex: string, intensity = NEON_GAIN[hex.toLowerCase()] ?? 3) => {
  const unit = new Color(hex);
  const m = new MeshBasicMaterial({ color: unit.clone().multiplyScalar(intensity), toneMapped: false });
  m.userData.unit = unit;
  m.userData.intensity = intensity;
  return m;
};

/** Re-tint a neon material while keeping its intensity (used by animated strips). */
export const setNeon = (m: MeshBasicMaterial, boost = 1) => {
  m.color.copy(m.userData.unit).multiplyScalar(m.userData.intensity * boost);
};
