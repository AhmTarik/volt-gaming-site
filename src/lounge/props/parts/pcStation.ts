import { BoxGeometry, PlaneGeometry, type Color } from "three";
import { GeoBuilder, once, type V3 } from "./geo";

/**
 * One gaming station in local coordinates: x = 0 is the station centre, floor y = 0, the
 * monitor/glass face +Z (toward the pcs camera), the desk sits behind the chair at z ~ -0.25.
 * Everything is baked into a handful of shared geometries; UltraPcs instances them per station.
 */

export const DESK_W = 1.46;
export const MON_X = -0.26;
export const MON_Y = 1.215;
export const MON_Z = -0.45;

export const TOWER = { c: [0.46, 1.05, -0.3] as V3, w: 0.5, h: 0.54, d: 0.24 };

const T = TOWER.c;
const at = (x: number, y: number, z: number): V3 => [T[0] + x, T[1] + y, T[2] + z];

/** Case-fan layout in tower-local space: [x, y, z, size, hasFrame]. */
export const FAN_SLOTS: Array<[number, number, number, number, boolean]> = [
  [0.158, 0.165, 0.045, 0.15, true],
  [0.158, 0.0, 0.045, 0.15, true],
  [0.158, -0.165, 0.045, 0.15, true],
  [-0.12, -0.12, 0.046, 0.1, false],
  [-0.02, -0.12, 0.046, 0.1, false],
];

/** Everything dark and solid: desk, monitor, keyboard, mouse, pad, tower shell and internals. */
export const getStationStatic = once(() => {
  const b = new GeoBuilder();
  // desk
  b.rbox(DESK_W, 0.04, 0.72, 0.012, { pos: [0, 0.74, -0.25], color: "#1c1f2d" });
  for (const s of [-1, 1]) b.rbox(0.05, 0.72, 0.62, 0.01, { pos: [s * 0.66, 0.36, -0.25], color: "#0f1119" }, 1);
  b.box(1.26, 0.3, 0.018, { pos: [0, 0.54, -0.57], color: "#0f1119" });
  // monitor: foot, neck, body, rear hump
  b.rbox(0.26, 0.012, 0.18, 0.005, { pos: [MON_X, 0.766, -0.4], color: "#232736" }, 1);
  b.box(0.045, 0.34, 0.025, { pos: [MON_X, 0.93, -0.475], color: "#232736" });
  b.rbox(0.7, 0.41, 0.035, 0.012, { pos: [MON_X, MON_Y, MON_Z], color: "#0b0c12" });
  b.rbox(0.22, 0.22, 0.045, 0.02, { pos: [MON_X, MON_Y - 0.02, MON_Z - 0.036], color: "#14161f" });
  // desk mat, keyboard, mouse
  b.rbox(0.72, 0.006, 0.3, 0.003, { pos: [-0.16, 0.763, 0.0], color: "#0a0b11" }, 1);
  b.rbox(0.44, 0.022, 0.15, 0.008, { pos: [MON_X, 0.777, 0.0], color: "#10121a" });
  b.rbox(0.066, 0.034, 0.116, 0.016, { pos: [0.1, 0.785, 0.0], color: "#171a26" });

  // tower shell
  const { w, h, d } = TOWER;
  const shell = "#0c0d13";
  b.box(w, h, 0.01, { pos: at(0, 0, -0.115), color: shell });
  b.box(w, 0.014, d, { pos: at(0, h / 2 - 0.007, 0), color: shell });
  b.box(w, 0.014, d, { pos: at(0, -h / 2 + 0.007, 0), color: shell });
  b.box(0.014, h, d, { pos: at(-w / 2 + 0.007, 0, 0), color: "#10121a" });
  b.box(0.014, h, d, { pos: at(w / 2 - 0.007, 0, 0), color: shell });
  for (const s of [-1, 1]) b.box(0.06, 0.018, 0.18, { pos: at(s * 0.18, -h / 2 - 0.009, 0), color: "#05060a" });
  // glass retaining frame (thin lip around the panel)
  b.box(w, 0.012, 0.01, { pos: at(0, h / 2 - 0.006, d / 2 - 0.005), color: "#1a1d29" });
  b.box(w, 0.012, 0.01, { pos: at(0, -h / 2 + 0.006, d / 2 - 0.005), color: "#1a1d29" });
  // PSU shroud, motherboard tray, VRM heatsink, radiator, AIO pump + hoses, RAM
  b.rbox(0.3, 0.065, 0.2, 0.01, { pos: at(-0.09, -0.225, -0.01), color: "#171a26" }, 1);
  b.box(0.3, 0.4, 0.008, { pos: at(-0.085, 0.03, -0.095), color: "#0f1118" });
  b.rbox(0.05, 0.14, 0.03, 0.008, { pos: at(-0.2, 0.12, -0.075), color: "#2a2e3d" }, 1);
  b.rbox(0.26, 0.026, 0.11, 0.006, { pos: at(-0.1, 0.238, -0.04), color: "#14161f" }, 1);
  b.cyl(0.04, 0.04, 0.03, { pos: at(-0.12, 0.1, -0.055), rot: [Math.PI / 2, 0, 0], color: "#232736" }, 20);
  b.strut(at(-0.13, 0.115, -0.055), at(-0.2, 0.225, -0.04), 0.012, "#08090d");
  b.strut(at(-0.108, 0.118, -0.055), at(-0.165, 0.226, -0.04), 0.012, "#08090d");
  for (let k = 0; k < 4; k++) b.box(0.008, 0.14, 0.03, { pos: at(-0.012 + k * 0.017, 0.1, -0.07), color: "#0d0e14" });
  // vertical-mounted GPU
  b.rbox(0.25, 0.125, 0.035, 0.01, { pos: at(-0.07, -0.12, 0.02), color: "#151824" }, 1);
  return b.build();
});

/** Tempered-glass side panel (shared by all four towers). */
export const getGlassPanel = once(
  () => new BoxGeometry(TOWER.w - 0.012, TOWER.h - 0.014, 0.005).translate(T[0], T[1], T[2] + TOWER.d / 2 - 0.0025),
);

/** Additive reflection quad that sits just in front of the glass. */
export const getGlassSheenQuad = once(() =>
  new PlaneGeometry(TOWER.w - 0.016, TOWER.h - 0.018).translate(T[0], T[1], T[2] + TOWER.d / 2 + 0.0015),
);

/** RAM diffusers, CPU pump ring, VRM accent: colour channel A. */
export const getGlowA = once(() => {
  const b = new GeoBuilder();
  for (let k = 0; k < 4; k++) b.box(0.0055, 0.134, 0.004, { pos: at(-0.012 + k * 0.017, 0.1, -0.053) });
  b.torus(0.034, 0.004, { pos: at(-0.12, 0.1, -0.038) }, 6, 28);
  b.box(0.004, 0.1, 0.003, { pos: at(-0.2, 0.12, -0.058) });
  return b.build();
});

/** GPU edge lights, PSU line, chassis edge lines: colour channel B (phase-shifted vs A). */
export const getGlowB = once(() => {
  const b = new GeoBuilder();
  b.box(0.25, 0.004, 0.004, { pos: at(-0.07, -0.0575, 0.039) });
  b.box(0.004, 0.1, 0.003, { pos: at(-0.192, -0.12, 0.039) });
  b.box(0.28, 0.004, 0.003, { pos: at(-0.09, -0.195, 0.092) });
  b.box(0.46, 0.004, 0.004, { pos: at(0, -0.255, 0.114) });
  b.box(0.46, 0.004, 0.004, { pos: at(0, 0.255, 0.114) });
  return b.build();
});

export const getDeskLed = once(() => new BoxGeometry(DESK_W - 0.02, 0.008, 0.006).translate(0, 0.74, 0.113));

export const getKeysQuad = once(() =>
  new PlaneGeometry(0.42, 0.125).rotateX(-Math.PI / 2).translate(MON_X, 0.7895, 0.0),
);

/** Four monitor faces (merged by the caller into one mesh); UVs remapped into the 2x2 screen atlas. */
export const buildScreens = (xs: number[]) => {
  const geos = xs.map((x, i) => {
    const g = new PlaneGeometry(0.664, 0.374);
    const uv = g.attributes.uv;
    const col = i % 2;
    const row = Math.floor(i / 2);
    for (let k = 0; k < uv.count; k++) {
      uv.setXY(k, (col + uv.getX(k)) / 2, (1 - row + uv.getY(k)) / 2);
    }
    g.translate(x + MON_X, MON_Y, MON_Z + 0.0175 + 0.0015);
    return g;
  });
  return geos;
};

/** Booth dividers + portal gantry that frame the row. `xs` are station centres. */
export const buildFrameWork = (xs: number[], pitch: number) => {
  const b = new GeoBuilder();
  const left = xs[0] - pitch / 2;
  const right = xs[xs.length - 1] + pitch / 2;
  const span = right - left;
  // dividers between and around stations
  for (let i = 0; i <= xs.length; i++) {
    const x = left + i * pitch;
    b.rbox(0.03, 1.72, 0.9, 0.008, { pos: [x, 0.86, -0.2], color: "#12141d" }, 1);
  }
  // portal gantry: two posts and a header beam
  for (const x of [left - 0.12, right + 0.12]) {
    b.rbox(0.12, 2.18, 0.16, 0.02, { pos: [x, 1.09, 0.3], color: "#10121a" }, 1);
  }
  b.rbox(span + 0.5, 0.1, 0.16, 0.02, { pos: [(left + right) / 2, 2.18, 0.3], color: "#10121a" }, 1);
  return b.build();
};

/** Neon edges for the row: vertical divider lines, the gantry's under-lip, the dais lip. Gradient cyan -> magenta in x. */
export const buildNeon = (xs: number[], pitch: number, colorAt: (t: number) => Color) => {
  const b = new GeoBuilder();
  const left = xs[0] - pitch / 2;
  const right = xs[xs.length - 1] + pitch / 2;
  const span = right - left;
  const t = (x: number) => (x - (left - 0.2)) / (span + 0.4);
  for (let i = 0; i <= xs.length; i++) {
    const x = left + i * pitch;
    b.box(0.012, 1.5, 0.012, { pos: [x, 0.85, 0.255], color: colorAt(t(x)) });
  }
  const SEG = 28;
  const segW = (span + 0.5) / SEG;
  for (let s = 0; s < SEG; s++) {
    const x = left - 0.25 + segW * (s + 0.5);
    const c = colorAt(t(x));
    b.box(segW, 0.014, 0.014, { pos: [x, 2.12, 0.385], color: c });
    b.box(segW, 0.012, 0.012, { pos: [x, 0.035, 2.205], color: c });
  }
  return b.build();
};
