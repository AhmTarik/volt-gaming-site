import { CanvasTexture, ClampToEdgeWrapping, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from "three";
import { once } from "./geo";

/**
 * Procedural canvas textures (screens, key grid, glow decals). Drawn once, shared by every
 * instance of a prop. No image downloads.
 */

const CYAN = "#00f0ff";
const MAGENTA = "#ff007f";
const PURPLE = "#8b5cf6";
const BG = "#0d0f17";

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, g: c.getContext("2d")! };
};

const toTexture = (c: HTMLCanvasElement, srgb = true) => {
  const t = new CanvasTexture(c);
  if (srgb) t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = ClampToEdgeWrapping;
  t.minFilter = LinearMipmapLinearFilter;
  t.magFilter = LinearFilter;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
};

// Deterministic pseudo-random so the art never changes between loads.
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

type Ctx = CanvasRenderingContext2D;

/* ---------------------------------------------------------------- PC screens (2x2 atlas) */

const drawSynthwave = (g: Ctx, w: number, h: number) => {
  const horizon = h * 0.58;
  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#0b0220");
  sky.addColorStop(0.6, "#4a0b63");
  sky.addColorStop(1, "#ff2f8e");
  g.fillStyle = sky;
  g.fillRect(0, 0, w, horizon);
  // sun, sliced by shrinking bars
  const sun = g.createLinearGradient(0, horizon - h * 0.36, 0, horizon);
  sun.addColorStop(0, "#ff9ad0");
  sun.addColorStop(1, MAGENTA);
  g.fillStyle = sun;
  g.beginPath();
  g.arc(w / 2, horizon - h * 0.16, h * 0.2, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#4a0b63";
  for (let i = 0; i < 6; i++) g.fillRect(w * 0.25, horizon - h * 0.2 + i * h * 0.035, w * 0.5, 1 + i * 1.4);
  // ridge line
  g.fillStyle = "#12041f";
  g.beginPath();
  g.moveTo(0, horizon);
  const r = rng(7);
  for (let x = 0; x <= w; x += w / 16) g.lineTo(x, horizon - 6 - r() * h * 0.1);
  g.lineTo(w, horizon);
  g.fill();
  // floor + perspective grid
  g.fillStyle = "#07040f";
  g.fillRect(0, horizon, w, h - horizon);
  g.strokeStyle = CYAN;
  g.lineWidth = 2;
  g.globalAlpha = 0.9;
  for (let i = -12; i <= 12; i++) {
    g.beginPath();
    g.moveTo(w / 2 + i * 14, horizon);
    g.lineTo(w / 2 + i * 120, h);
    g.stroke();
  }
  for (let i = 1; i < 8; i++) {
    const y = horizon + Math.pow(i / 8, 2.2) * (h - horizon);
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }
  g.globalAlpha = 1;
};

const drawCityShooter = (g: Ctx, w: number, h: number) => {
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#04050c");
  sky.addColorStop(0.7, "#1a0b3d");
  sky.addColorStop(1, "#3a0a4e");
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  const r = rng(21);
  for (let layer = 0; layer < 3; layer++) {
    const base = h * (0.72 + layer * 0.05);
    g.fillStyle = ["#0d0a22", "#0a0818", "#06050f"][layer];
    for (let x = -10; x < w; ) {
      const bw = 26 + r() * 50;
      const bh = h * (0.18 + r() * (0.5 - layer * 0.1));
      g.fillRect(x, base - bh, bw, bh + h);
      g.fillStyle = r() > 0.5 ? CYAN : MAGENTA;
      for (let k = 0; k < 6; k++) g.fillRect(x + 4 + r() * (bw - 10), base - bh + 8 + r() * bh * 0.8, 3, 5);
      g.fillStyle = ["#0d0a22", "#0a0818", "#06050f"][layer];
      x += bw + 4;
    }
  }
  // neon sign slabs
  g.fillStyle = MAGENTA;
  g.fillRect(w * 0.18, h * 0.3, 8, h * 0.22);
  g.fillStyle = CYAN;
  g.fillRect(w * 0.78, h * 0.24, 8, h * 0.28);
  // crosshair
  g.strokeStyle = CYAN;
  g.lineWidth = 3;
  const cx = w / 2;
  const cy = h * 0.5;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    g.beginPath();
    g.moveTo(cx + dx * 10, cy + dy * 10);
    g.lineTo(cx + dx * 26, cy + dy * 26);
    g.stroke();
  }
  // HUD: health bar, ammo, mini-map frame
  g.fillStyle = "rgba(0,0,0,0.5)";
  g.fillRect(24, h - 44, 190, 16);
  g.fillStyle = MAGENTA;
  g.fillRect(24, h - 44, 140, 16);
  g.fillStyle = "#e8f6ff";
  g.font = "italic 700 34px sans-serif";
  g.textAlign = "right";
  g.fillText("24 / 90", w - 24, h - 28);
  g.strokeStyle = "rgba(0,240,255,0.7)";
  g.lineWidth = 2;
  g.strokeRect(w - 110, 20, 90, 90);
  g.fillStyle = CYAN;
  g.fillRect(w - 68, 62, 6, 6);
  g.textAlign = "left";
};

const drawVoltUi = (g: Ctx, w: number, h: number) => {
  g.fillStyle = BG;
  g.fillRect(0, 0, w, h);
  const glow = g.createRadialGradient(w * 0.2, h * 0.3, 10, w * 0.2, h * 0.3, w * 0.7);
  glow.addColorStop(0, "rgba(139,92,246,0.35)");
  glow.addColorStop(1, "rgba(13,15,23,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, w, h);
  g.fillStyle = CYAN;
  g.font = "italic 800 22px sans-serif";
  g.fillText("VOLT GAMING CENTER", 36, 52);
  g.fillStyle = "#f2f6ff";
  g.font = "italic 800 92px sans-serif";
  g.fillText("ULTRA PC", 32, 168);
  const bar = g.createLinearGradient(36, 0, w - 36, 0);
  bar.addColorStop(0, CYAN);
  bar.addColorStop(1, MAGENTA);
  g.fillStyle = bar;
  g.fillRect(36, 190, w - 72, 4);
  const chips = ["RTX 4060", "240Hz", "i5 12th Gen"];
  let x = 36;
  g.font = "700 26px sans-serif";
  chips.forEach((t, i) => {
    const cw = g.measureText(t).width + 36;
    g.fillStyle = i === 0 ? "rgba(255,0,127,0.22)" : "rgba(0,240,255,0.14)";
    g.strokeStyle = i === 0 ? MAGENTA : CYAN;
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect(x, 232, cw, 52, 10);
    g.fill();
    g.stroke();
    g.fillStyle = "#f2f6ff";
    g.fillText(t, x + 18, 267);
    x += cw + 14;
  });
  g.fillStyle = "rgba(242,246,255,0.55)";
  g.font = "600 22px sans-serif";
  g.fillText("Press any key to start", 36, h - 34);
};

const drawTunnel = (g: Ctx, w: number, h: number) => {
  g.fillStyle = "#05060d";
  g.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h * 0.5;
  // speed rays
  g.lineWidth = 2;
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    g.strokeStyle = i % 2 ? "rgba(0,240,255,0.5)" : "rgba(255,0,127,0.5)";
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 28);
    g.lineTo(cx + Math.cos(a) * w, cy + Math.sin(a) * w);
    g.stroke();
  }
  // gate rings
  for (let i = 12; i >= 1; i--) {
    const s = Math.pow(i / 12, 1.7);
    const rw = 40 + s * w * 0.9;
    const rh = 28 + s * h * 0.9;
    g.strokeStyle = i % 2 ? CYAN : MAGENTA;
    g.lineWidth = 2 + s * 5;
    g.globalAlpha = 0.35 + (1 - s) * 0.65;
    g.strokeRect(cx - rw / 2, cy - rh / 2, rw, rh);
  }
  g.globalAlpha = 1;
  const core = g.createRadialGradient(cx, cy, 2, cx, cy, 80);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.3, "rgba(139,92,246,0.9)");
  core.addColorStop(1, "rgba(139,92,246,0)");
  g.fillStyle = core;
  g.fillRect(cx - 90, cy - 90, 180, 180);
};

/** 1280x720 atlas, 2x2 cells of 640x360. Cell i = station i (col = i%2, row = floor(i/2)). */
export const getPcScreenAtlas = once(() => {
  const { c, g } = canvas(1280, 720);
  const scenes = [drawSynthwave, drawCityShooter, drawVoltUi, drawTunnel];
  scenes.forEach((draw, i) => {
    g.save();
    g.translate((i % 2) * 640, Math.floor(i / 2) * 360);
    g.beginPath();
    g.rect(0, 0, 640, 360);
    g.clip();
    draw(g, 640, 360);
    g.restore();
  });
  // subtle scan lines so screens read as pixels, not flat colour
  g.fillStyle = "rgba(0,0,0,0.16)";
  for (let y = 0; y < 720; y += 3) g.fillRect(0, y, 1280, 1);
  return toTexture(c);
});

/* ---------------------------------------------------------------- sim triple screen */

/** 1920x352: left | centre | right panel (640 each) stitched as one continuous racing scene. */
export const getSimScreens = once(() => {
  const W = 1920;
  const H = 352;
  const { c, g } = canvas(W, H);
  const hz = H * 0.5;
  const sky = g.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, "#05060d");
  sky.addColorStop(0.65, "#2a0b4a");
  sky.addColorStop(1, "#ff2f8e");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, hz);
  const r = rng(99);
  // skyline, both flanks
  for (let x = 0; x < W; ) {
    const bw = 18 + r() * 40;
    const dist = Math.abs(x - W / 2) / (W / 2);
    const bh = (8 + r() * 70) * (0.35 + dist);
    g.fillStyle = "#0b0818";
    g.fillRect(x, hz - bh, bw, bh);
    g.fillStyle = r() > 0.5 ? CYAN : MAGENTA;
    for (let k = 0; k < 3; k++) g.fillRect(x + 3 + r() * (bw - 8), hz - bh + 4 + r() * bh * 0.8, 2, 3);
    x += bw + 2;
  }
  // ground
  g.fillStyle = "#07060d";
  g.fillRect(0, hz, W, H - hz);
  // road trapezoid + kerbs
  const vx = W / 2;
  const roadHalf = W * 0.95;
  const road = g.createLinearGradient(0, hz, 0, H);
  road.addColorStop(0, "#1a1d29");
  road.addColorStop(1, "#262a3a");
  g.fillStyle = road;
  g.beginPath();
  g.moveTo(vx - 30, hz);
  g.lineTo(vx + 30, hz);
  g.lineTo(vx + roadHalf, H);
  g.lineTo(vx - roadHalf, H);
  g.fill();
  for (let i = 0; i < 14; i++) {
    const t0 = Math.pow(i / 14, 2.1);
    const t1 = Math.pow((i + 1) / 14, 2.1);
    const y0 = hz + t0 * (H - hz);
    const y1 = hz + t1 * (H - hz);
    g.fillStyle = i % 2 ? "#f2f6ff" : MAGENTA;
    for (const s of [-1, 1]) {
      const x0 = vx + s * (30 + t0 * (roadHalf - 30));
      const x1 = vx + s * (30 + t1 * (roadHalf - 30));
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x0 + s * (4 + t0 * 36), y0);
      g.lineTo(x1 + s * (4 + t1 * 36), y1);
      g.lineTo(x1, y1);
      g.fill();
    }
    if (i % 2) {
      g.fillStyle = "rgba(242,246,255,0.85)";
      g.beginPath();
      g.moveTo(vx - 1 - t0 * 4, y0);
      g.lineTo(vx + 1 + t0 * 4, y0);
      g.lineTo(vx + 1 + t1 * 4, y1);
      g.lineTo(vx - 1 - t1 * 4, y1);
      g.fill();
    }
  }
  // lead car tail-lights
  g.fillStyle = "#14161f";
  g.fillRect(vx - 26, hz + 6, 52, 16);
  g.fillStyle = "#ff3a7c";
  g.fillRect(vx - 24, hz + 10, 12, 5);
  g.fillRect(vx + 12, hz + 10, 12, 5);
  // speed streaks
  g.lineWidth = 1.5;
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2;
    const d0 = 120 + r() * 300;
    const d1 = d0 + 40 + r() * 140;
    g.strokeStyle = r() > 0.5 ? "rgba(0,240,255,0.35)" : "rgba(255,0,127,0.3)";
    g.beginPath();
    g.moveTo(vx + Math.cos(a) * d0 * 2, hz + Math.sin(a) * d0 * 0.5);
    g.lineTo(vx + Math.cos(a) * d1 * 2, hz + Math.sin(a) * d1 * 0.5);
    g.stroke();
  }
  // HUD: rev bar, speed, gear
  g.fillStyle = "rgba(0,0,0,0.45)";
  g.fillRect(vx - 190, H - 92, 380, 14);
  for (let i = 0; i < 30; i++) {
    g.fillStyle = i < 22 ? (i < 14 ? CYAN : PURPLE) : MAGENTA;
    g.globalAlpha = i < 26 ? 1 : 0.25;
    g.fillRect(vx - 188 + i * 12.6, H - 90, 10, 10);
  }
  g.globalAlpha = 1;
  g.textAlign = "center";
  g.fillStyle = "#f2f6ff";
  g.font = "italic 800 66px sans-serif";
  g.fillText("287", vx - 60, H - 22);
  g.font = "italic 700 22px sans-serif";
  g.fillStyle = CYAN;
  g.fillText("KM/H", vx + 30, H - 28);
  g.fillStyle = "#f2f6ff";
  g.font = "italic 800 56px sans-serif";
  g.fillText("6", vx + 120, H - 22);
  // side panels: timing + position
  g.textAlign = "left";
  g.fillStyle = "rgba(0,0,0,0.45)";
  g.fillRect(36, 28, 230, 92);
  g.fillStyle = MAGENTA;
  g.font = "italic 800 38px sans-serif";
  g.fillText("P1", 52, 72);
  g.fillStyle = "#f2f6ff";
  g.font = "700 26px sans-serif";
  g.fillText("1:42.318", 52, 108);
  g.fillStyle = "rgba(0,0,0,0.45)";
  g.fillRect(W - 236, 28, 200, 92);
  g.fillStyle = CYAN;
  g.font = "700 22px sans-serif";
  g.fillText("LAP 3 / 5", W - 220, 66);
  g.fillStyle = "#f2f6ff";
  g.fillText("-0.412", W - 220, 102);
  // panel seams
  g.fillStyle = "rgba(0,0,0,0.9)";
  g.fillRect(639, 0, 2, H);
  g.fillRect(1279, 0, 2, H);
  return toTexture(c);
});

/* ---------------------------------------------------------------- misc */

/** Mechanical keyboard key grid: white keycaps on black, tinted per instance. */
export const getKeyGrid = once(() => {
  const { c, g } = canvas(512, 160);
  g.fillStyle = "#000";
  g.fillRect(0, 0, 512, 160);
  const rows = [14, 14, 13, 13, 11];
  rows.forEach((n, ri) => {
    const kw = 512 / 14.6;
    const x0 = (512 - n * kw) / 2;
    for (let i = 0; i < n; i++) {
      g.fillStyle = `rgba(255,255,255,${0.78 + 0.22 * Math.sin(i * 1.7 + ri)})`;
      g.beginPath();
      g.roundRect(x0 + i * kw + 2, 8 + ri * 29, kw - 4, 23, 4);
      g.fill();
    }
  });
  return toTexture(c);
});

/** Soft radial pool of light for floor under-glow decals. */
export const getGlowPool = once(() => {
  const { c, g } = canvas(256, 256);
  const grad = g.createRadialGradient(128, 128, 4, 128, 128, 128);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.45, "rgba(255,255,255,0.4)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return toTexture(c, false);
});

/** Diagonal highlight band that fakes a reflection on tempered glass. */
export const getGlassSheen = once(() => {
  const { c, g } = canvas(128, 256);
  g.fillStyle = "#000";
  g.fillRect(0, 0, 128, 256);
  g.save();
  g.translate(64, 128);
  g.rotate(-0.55);
  for (const [off, wd, a] of [[-22, 22, 0.5], [18, 8, 0.28]] as const) {
    const grad = g.createLinearGradient(off - wd, 0, off + wd, 0);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.5, `rgba(255,255,255,${a})`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(off - wd, -300, wd * 2, 600);
  }
  g.restore();
  return toTexture(c, false);
});

/** Equaliser-style slit wall that backs the PC row: cyan on the left fading to magenta on the right. */
export const getBackdrop = once(() => {
  const { c, g } = canvas(1024, 400);
  g.fillStyle = "#07080e";
  g.fillRect(0, 0, 1024, 400);
  const r = rng(5);
  const cols = 96;
  for (let i = 0; i < cols; i++) {
    const t = i / (cols - 1);
    const hgt = 70 + (0.5 + 0.5 * Math.sin(i * 0.37) * Math.cos(i * 0.11)) * 190 + r() * 40;
    const grad = g.createLinearGradient(0, 400, 0, 400 - hgt);
    const col = t < 0.5 ? mix(CYAN, PURPLE, t * 2) : mix(PURPLE, MAGENTA, (t - 0.5) * 2);
    grad.addColorStop(0, col);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(i * (1024 / cols) + 2, 400 - hgt, 1024 / cols - 5, hgt);
  }
  return toTexture(c);
});

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const p = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${p[0]},${p[1]},${p[2]})`;
};
