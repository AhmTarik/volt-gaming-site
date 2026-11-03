import { GeoBuilder, once } from "./geo";

/**
 * Gaming chair, modelled facing +Z (front toward the camera), floor at y = 0, ~1.3 m tall.
 * Split by material so all chairs render as 4 instanced draw calls:
 *   base (nylon star + gas lift), body (dark synthetic leather), accent (tinted per instance),
 *   led (bloomed piping, colour per instance).
 */

const BODY = "#15171f";
const BODY_LIGHT = "#1d2030";

export const getChairBase = once(() => {
  const b = new GeoBuilder();
  b.cyl(0.028, 0.034, 0.3, { pos: [0, 0.27, 0], color: "#2b2f3d" }, 14);
  b.cyl(0.07, 0.09, 0.06, { pos: [0, 0.12, 0], color: "#0e1017" }, 16);
  b.cyl(0.05, 0.05, 0.05, { pos: [0, 0.405, 0], color: "#0e1017" }, 14);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    const x = Math.sin(a);
    const z = Math.cos(a);
    b.rbox(0.05, 0.035, 0.32, 0.012, { pos: [x * 0.16, 0.085, z * 0.16], rot: [0, a, 0], color: "#0e1017" }, 1);
    b.sphere(0.03, { pos: [x * 0.31, 0.03, z * 0.31], color: "#050609" });
    b.cyl(0.012, 0.012, 0.03, { pos: [x * 0.31, 0.062, z * 0.31], color: "#2b2f3d" }, 8);
  }
  return b.build();
});

export const getChairBody = once(() => {
  const b = new GeoBuilder();
  // seat pan + raised bolsters
  b.rbox(0.52, 0.1, 0.5, 0.04, { pos: [0, 0.47, 0.02], color: BODY });
  for (const s of [-1, 1]) {
    b.rbox(0.09, 0.12, 0.48, 0.04, { pos: [s * 0.26, 0.5, 0.01], rot: [0, 0, s * -0.12], color: BODY_LIGHT });
    // armrest post + pad
    b.rbox(0.045, 0.2, 0.05, 0.015, { pos: [s * 0.33, 0.63, -0.02], color: "#0e1017" }, 1);
    b.rbox(0.085, 0.035, 0.28, 0.015, { pos: [s * 0.33, 0.75, 0.04], color: "#0e1017" });
  }
  // back: tilted slab, shoulder wings, head support
  b.withBase([0, 0.52, -0.2], [-0.16, 0, 0], () => {
    b.rbox(0.46, 0.64, 0.11, 0.04, { pos: [0, 0.32, 0], color: BODY });
    for (const s of [-1, 1]) {
      b.rbox(0.1, 0.52, 0.17, 0.045, { pos: [s * 0.265, 0.3, 0.03], rot: [0, s * -0.22, s * -0.06], color: BODY_LIGHT });
    }
    b.rbox(0.36, 0.22, 0.1, 0.04, { pos: [0, 0.7, 0], color: BODY });
    for (const s of [-1, 1]) b.rbox(0.07, 0.2, 0.12, 0.03, { pos: [s * 0.2, 0.71, 0.03], rot: [0, s * -0.3, 0], color: BODY_LIGHT });
  });
  // recline mechanism
  b.rbox(0.2, 0.06, 0.2, 0.02, { pos: [0, 0.39, -0.04], color: "#0e1017" }, 1);
  return b.build();
});

export const getChairAccent = once(() => {
  const b = new GeoBuilder();
  b.withBase([0, 0.52, -0.2], [-0.16, 0, 0], () => {
    // centre racing stripe down the backrest front
    b.rbox(0.09, 0.6, 0.014, 0.006, { pos: [0, 0.32, 0.062] }, 1);
    // head pillow + lumbar pillow
    b.rbox(0.26, 0.12, 0.07, 0.03, { pos: [0, 0.72, 0.085] });
    b.rbox(0.3, 0.12, 0.06, 0.03, { pos: [0, 0.2, 0.09] });
  });
  // seat centre stripe
  b.rbox(0.09, 0.012, 0.44, 0.005, { pos: [0, 0.524, 0.03] }, 1);
  return b.build();
});

export const getChairLed = once(() => {
  const b = new GeoBuilder();
  b.withBase([0, 0.52, -0.2], [-0.16, 0, 0], () => {
    for (const s of [-1, 1]) {
      // thin light piping along each shoulder wing's inner edge
      b.box(0.008, 0.46, 0.008, { pos: [s * 0.2, 0.3, 0.062] });
    }
  });
  return b.build();
});
