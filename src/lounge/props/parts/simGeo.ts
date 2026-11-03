import { BoxGeometry, PlaneGeometry, type BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GeoBuilder, once, type V3 } from "./geo";
import { GLOW, rampGlow } from "./glow";

/**
 * Racing-simulator geometry. Local frame: floor y = 0 (platform top 0.05), driver sits at +Z and
 * looks toward -Z, so the screens face +Z (toward the simulator camera) and the wheel faces the
 * driver. Built as a few vertex-coloured merges: aluminium, dark hardware, seat, bloom accents.
 */

export const PLATFORM = { w: 2.6, d: 2.9, top: 0.05 };

/** Triple screen wrap: arc centre C (driver's eyes), radius R, panel pitch in radians. */
export const WRAP = { cx: 0, cy: 1.05, cz: 0.8, R: 1.7, pitch: 0.435, w: 0.68, h: 0.38 };

/** Wheel assembly pivot (wheel-base centre) and tilt. The wheel sits 0.22 ahead of it along local +Z. */
export const WHEEL = { pos: [0, 0.845, -0.19] as V3, tilt: -0.22, reach: 0.22 };

const ALU = "#9aa1af";
const DARK = "#12141c";
const MAG = "#c40f62";
const CYN = "#0b9fb0";

/** Bend a flat PlaneGeometry / BoxGeometry onto the cylinder around the driver's eyes. */
const bend = <T extends BufferGeometry>(geo: T, centerAngle: number) => {
  const { cx, cy, cz, R } = WRAP;
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const phi = centerAngle + p.getX(i) / R;
    const r = R - p.getZ(i);
    p.setXYZ(i, cx + r * Math.sin(phi), cy + p.getY(i), cz - r * Math.cos(phi));
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
};

const panelAngles = [-1, 0, 1].map((k) => k * WRAP.pitch);

/** Three concave screens merged into one mesh, UVs split into thirds of the stitched racing scene. */
export const getSimScreenGeo = once(() => {
  const parts = panelAngles.map((a, i) => {
    const g = bend(new PlaneGeometry(WRAP.w, WRAP.h, 14, 1), a);
    const uv = g.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setX(k, (i + uv.getX(k)) / 3);
    return g;
  });
  return mergeGeometries(parts, false)!;
});

const PLATE = "#161922";

/** Aluminium profile frame: base rails, front posts, wheel deck, braces, monitor stands. */
export const getSimAlu = once(() => {
  const b = new GeoBuilder();
  const y0 = PLATFORM.top;
  for (const s of [-1, 1]) {
    b.profile([0.04, 0.08, 1.9], [s * 0.28, y0 + 0.04, 0.2], ALU);
    b.profile([0.04, 0.58, 0.08], [s * 0.28, y0 + 0.08 + 0.29, -0.7], ALU);
    b.profile([0.04, 0.04, 0.7], [s * 0.28, 0.73, -0.35], ALU);
    b.profile([0.22, 0.04, 0.08], [s * 0.41, y0 + 0.04, 0.55], ALU);
    b.strut([s * 0.28, 0.14, 0.15], [s * 0.28, 0.71, -0.58], 0.028, ALU);
  }
  for (const z of [-0.7, 0.15, 1.1]) b.profile([0.52, 0.04, 0.08], [0, y0 + 0.04, z], ALU);
  for (const z of [-0.2, -0.55]) b.profile([0.52, 0.04, 0.08], [0, 0.73, z], ALU);
  // monitor stands: a post behind each panel with a counter-weight foot reaching away from the driver
  const { cx, cz, R } = WRAP;
  for (const a of panelAngles) {
    const r = R + 0.065;
    b.withBase([cx + r * Math.sin(a), 0, cz - r * Math.cos(a)], [0, Math.PI - a, 0], () => {
      b.profile([0.05, 1.0, 0.05], [0, y0 + 0.5, 0], ALU);
      b.profile([0.05, 0.04, 0.45], [0, y0 + 0.02, 0.225], ALU);
    });
  }
  return b.build();
});

/** Dark hardware: platform, wheel base + wheel, pedals, shifter, handbrake, monitor bezels. */
export const getSimDark = once(() => {
  const b = new GeoBuilder();
  b.rbox(PLATFORM.w, PLATFORM.top, PLATFORM.d, 0.02, { pos: [0, PLATFORM.top / 2, 0], color: "#14161f" });
  // seat brackets
  for (const s of [-1, 1]) b.rbox(0.1, 0.09, 0.42, 0.015, { pos: [s * 0.26, 0.175, 0.6], color: PLATE });
  // wheel deck plate
  b.rbox(0.3, 0.014, 0.3, 0.005, { pos: [0, 0.755, -0.2], color: PLATE }, 1);

  // wheel base + wheel on a shared tilt
  b.withBase(WHEEL.pos, [WHEEL.tilt, 0, 0], () => {
    b.rbox(0.15, 0.15, 0.2, 0.025, { color: "#0e1017" });
    b.rbox(0.158, 0.03, 0.12, 0.01, { pos: [0, 0.06, -0.02], color: "#1d2030" }, 1);
    b.cyl(0.032, 0.032, 0.08, { pos: [0, 0, 0.14], rot: [Math.PI / 2, 0, 0], color: "#2b2f3d" }, 18);
    b.withBase([0, 0, WHEEL.reach], [0, 0, 0], () => {
      b.torus(0.135, 0.016, { color: "#0c0d12" }, 10, 44);
      b.box(0.012, 0.034, 0.012, { pos: [0, 0.135, 0], color: MAG });
      b.box(0.24, 0.034, 0.014, { pos: [0, -0.005, -0.006], color: "#14161f" });
      b.box(0.04, 0.1, 0.014, { pos: [0, -0.08, -0.006], color: "#14161f" });
      b.rbox(0.12, 0.12, 0.04, 0.02, { color: "#181b27" });
      b.rbox(0.17, 0.032, 0.016, 0.008, { pos: [0, 0.104, 0.012], color: "#0a0b10" }, 1);
      for (const sx of [-1, 1]) {
        b.cyl(0.009, 0.009, 0.01, { pos: [sx * 0.03, 0.026, 0.023], rot: [Math.PI / 2, 0, 0], color: sx < 0 ? CYN : MAG }, 10);
        b.cyl(0.009, 0.009, 0.01, { pos: [sx * 0.03, -0.022, 0.023], rot: [Math.PI / 2, 0, 0], color: sx < 0 ? MAG : "#e8f0ff" }, 10);
      }
      b.cyl(0.02, 0.02, 0.012, { pos: [0, 0, 0.026], rot: [Math.PI / 2, 0, 0], color: "#2b2f3d" }, 16);
    });
  });

  // pedals: tilted plate, three pads on arms, brake load cell
  for (const s of [-1, 1]) {
    b.box(0.02, 0.2, 0.02, { pos: [s * 0.2, 0.15, -0.59], color: "#0a0b10" });
    b.box(0.02, 0.04, 0.02, { pos: [s * 0.2, 0.07, -0.255], color: "#0a0b10" });
  }
  b.withBase([0, 0.17, -0.42], [0.45, 0, 0], () => {
    b.rbox(0.46, 0.015, 0.38, 0.006, { color: "#2a2e3b" }, 1);
    [-0.14, 0, 0.14].forEach((x, i) => {
      const wdt = i === 1 ? 0.095 : 0.078;
      b.box(0.03, 0.04, 0.03, { pos: [x, 0.027, -0.13], color: "#0a0b10" });
      b.strut([x, 0.04, -0.13], [x, 0.11, -0.03], 0.016, "#8f95a3");
      b.withBase([x, 0.115, 0.0], [0.7, 0, 0], () => {
        b.rbox(wdt, 0.014, 0.15, 0.006, { color: i === 2 ? "#1d2030" : "#3a3f4e" }, 1);
        for (let k = -2; k <= 2; k++) b.box(wdt - 0.014, 0.004, 0.006, { pos: [0, 0.009, k * 0.026], color: "#0a0b10" });
      });
    });
    b.cyl(0.018, 0.018, 0.07, { pos: [0, 0.06, -0.1], rot: [Math.PI / 2, 0, 0], color: "#8f95a3" }, 14);
  });

  // handbrake (right) and sequential shifter (left)
  b.rbox(0.07, 0.09, 0.2, 0.012, { pos: [0.455, 0.155, 0.55], color: "#0e1017" }, 1);
  b.strut([0.455, 0.2, 0.6], [0.455, 0.44, 0.5], 0.022, "#8f95a3");
  b.strut([0.455, 0.42, 0.51], [0.455, 0.5, 0.48], 0.036, "#171a26");
  b.rbox(0.07, 0.07, 0.12, 0.012, { pos: [-0.455, 0.145, 0.5], color: "#0e1017" }, 1);
  b.strut([-0.455, 0.18, 0.5], [-0.455, 0.33, 0.46], 0.014, "#8f95a3");
  b.sphere(0.024, { pos: [-0.455, 0.345, 0.457], color: "#14161f" });

  // curved bezels, slightly behind the glass of each panel
  panelAngles.forEach((a) => {
    const slab = new BoxGeometry(WRAP.w + 0.04, WRAP.h + 0.04, 0.038, 14, 1, 1).translate(0, 0, -0.022);
    b.add(bend(slab, a), { color: "#0b0c12" });
    const hump = new BoxGeometry(0.3, 0.22, 0.05, 6, 1, 1).translate(0, -0.02, -0.065);
    b.add(bend(hump, a), { color: "#14161f" });
  });
  return b.build();
});

/** Bucket seat (carbon shell, dark synthetic leather, magenta / cyan trim). */
export const getSimSeat = once(() => {
  const b = new GeoBuilder();
  const body = "#15171f";
  const light = "#1d2030";
  b.rbox(0.46, 0.1, 0.5, 0.04, { pos: [0, 0.25, 0.6], color: body });
  b.rbox(0.08, 0.012, 0.44, 0.005, { pos: [0, 0.305, 0.6], color: MAG }, 1);
  for (const s of [-1, 1]) {
    b.rbox(0.1, 0.15, 0.46, 0.04, { pos: [s * 0.27, 0.29, 0.6], rot: [0, 0, s * -0.1], color: light });
    b.box(0.01, 0.012, 0.42, { pos: [s * 0.24, 0.358, 0.6], color: CYN });
  }
  b.withBase([0, 0.3, 0.86], [0.2, 0, 0], () => {
    b.rbox(0.5, 0.78, 0.045, 0.03, { pos: [0, 0.37, 0.06], color: "#0a0b10" }); // carbon shell
    b.rbox(0.46, 0.62, 0.1, 0.04, { pos: [0, 0.31, 0], color: body });
    b.rbox(0.08, 0.55, 0.012, 0.005, { pos: [0, 0.31, -0.055], color: MAG }, 1);
    for (const s of [-1, 1]) {
      b.rbox(0.1, 0.5, 0.17, 0.045, { pos: [s * 0.26, 0.28, -0.04], rot: [0, s * 0.2, 0], color: light });
      b.rbox(0.07, 0.18, 0.12, 0.03, { pos: [s * 0.19, 0.74, -0.03], rot: [0, s * 0.3, 0], color: light });
      b.box(0.012, 0.3, 0.012, { pos: [s * 0.1, 0.5, -0.058], color: "#05060a" }); // harness slots
    }
    b.rbox(0.34, 0.2, 0.1, 0.04, { pos: [0, 0.72, 0], color: body });
  });
  return b.build();
});

/** Static bloom accents: wheel-base ring, pedal edge, handbrake LED, platform edge, seat-back lines. */
export const getSimGlow = once(() => {
  const b = new GeoBuilder();
  b.withBase(WHEEL.pos, [WHEEL.tilt, 0, 0], () => {
    b.torus(0.052, 0.0035, { pos: [0, 0, 0.1015], color: GLOW.cyan }, 6, 36);
  });
  b.withBase([0, 0.17, -0.42], [0.45, 0, 0], () => {
    b.box(0.42, 0.004, 0.004, { pos: [0, 0.01, 0.185], color: GLOW.cyan });
  });
  b.box(0.012, 0.012, 0.012, { pos: [0.455, 0.505, 0.478], color: GLOW.magenta });
  // seat back piping on the carbon shell (this is what the camera sees from behind)
  b.withBase([0, 0.3, 0.86], [0.2, 0, 0], () => {
    b.box(0.007, 0.62, 0.005, { pos: [0, 0.38, 0.0865], color: GLOW.magenta });
    for (const s of [-1, 1]) b.box(0.005, 0.5, 0.005, { pos: [s * 0.2, 0.36, 0.0865], color: GLOW.cyan });
  });
  // platform edge: gradient along the front, magenta on the sides, purple at the back
  const { w, d, top } = PLATFORM;
  const SEG = 20;
  for (let s = 0; s < SEG; s++) {
    const x = -w / 2 + (w / SEG) * (s + 0.5);
    b.box(w / SEG, 0.012, 0.012, { pos: [x, top * 0.6, d / 2 + 0.004], color: rampGlow(1 - s / (SEG - 1)) });
  }
  for (const s of [-1, 1]) b.box(0.012, 0.012, d, { pos: [s * (w / 2 + 0.004), top * 0.6, 0], color: GLOW.magenta });
  b.box(w, 0.012, 0.012, { pos: [0, top * 0.6, -d / 2 - 0.004], color: GLOW.purple });
  return b.build();
});

/** Rev-light LED positions in the wheel-face frame. */
export const REV_LEDS: V3[] = Array.from({ length: 9 }, (_, i) => {
  const x = (i - 4) * 0.0165;
  return [x, 0.108 - Math.pow(x / 0.07, 2) * 0.012, 0.024] as V3;
});
