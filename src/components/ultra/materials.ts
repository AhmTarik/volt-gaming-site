import {
  CanvasTexture,
  Color,
  LinearFilter,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import { once } from "./geo";

/** Brief palette: electric blue + sharp magenta on obsidian. */
export const PALETTE = {
  blue: "#00b4ff",
  magenta: "#ff1f8f",
  cyan: "#19e6ff",
  obsidian: "#05060a",
};

const mulberry = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Horizontal anisotropic streaks -> reads as brushed aluminium through roughness. */
export const getBrushedMap = once(() => {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#8a8a8a";
  g.fillRect(0, 0, 256, 256);
  const r = mulberry(7);
  for (let i = 0; i < 900; i++) {
    const y = r() * 256;
    const len = 40 + r() * 216;
    const x = r() * 256;
    const v = 90 + Math.floor(r() * 120);
    g.strokeStyle = `rgba(${v},${v},${v},${0.1 + r() * 0.22})`;
    g.lineWidth = 0.5 + r() * 1.1;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + len, y + (r() - 0.5) * 0.6);
    g.stroke();
    // wrap so the tile is seamless
    if (x + len > 256) {
      g.beginPath();
      g.moveTo(x - 256, y);
      g.lineTo(x + len - 256, y + (r() - 0.5) * 0.6);
      g.stroke();
    }
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(1.5, 1.5);
  t.anisotropy = 4;
  return t;
});

/** Fine speckle for matte plastic (sandblasted look). */
export const getGrainMap = once(() => {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#c8c8c8";
  g.fillRect(0, 0, 128, 128);
  const r = mulberry(21);
  for (let i = 0; i < 2600; i++) {
    const v = 150 + Math.floor(r() * 105);
    g.fillStyle = `rgba(${v},${v},${v},0.5)`;
    g.fillRect(r() * 128, r() * 128, 1, 1);
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
});

/** Soft round falloff, used for light pools, halos and contact blobs. */
export const getRadialMap = once(() => {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.42)");
  grd.addColorStop(0.7, "rgba(255,255,255,0.09)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new CanvasTexture(c);
  t.minFilter = LinearFilter;
  return t;
});

/** Diagonal specular sheen painted onto the tempered-glass side panel. */
export const getSheenMap = once(() => {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 256, 256);
  const band = (x: number, w: number, a: number) => {
    const grd = g.createLinearGradient(x - w, 0, x + w, 256);
    grd.addColorStop(0, "rgba(255,255,255,0)");
    grd.addColorStop(0.5, `rgba(255,255,255,${a})`);
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
  };
  band(70, 38, 0.55);
  band(150, 12, 0.35);
  band(205, 30, 0.28);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
});

/** Abstract neon arena for the monitor: perspective grid, horizon bloom, HUD slabs. No game IP, no text. */
export const getScreenMap = once(() => {
  const W = 1024;
  const H = 576;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const sky = g.createLinearGradient(0, 0, 0, H * 0.58);
  sky.addColorStop(0, "#04050f");
  sky.addColorStop(0.7, "#150a33");
  sky.addColorStop(1, "#4a0d52");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  // horizon sun
  const hz = H * 0.58;
  const sun = g.createRadialGradient(W * 0.5, hz, 0, W * 0.5, hz, 230);
  sun.addColorStop(0, "rgba(255,40,150,0.95)");
  sun.addColorStop(0.45, "rgba(255,31,143,0.35)");
  sun.addColorStop(1, "rgba(255,31,143,0)");
  g.fillStyle = sun;
  g.fillRect(0, 0, W, hz);
  g.fillStyle = "#ff3aa0";
  g.beginPath();
  g.arc(W * 0.5, hz, 92, Math.PI, 0);
  g.fill();
  g.fillStyle = "#150a33";
  for (let i = 0; i < 6; i++) g.fillRect(W * 0.5 - 100, hz - 14 - i * 13, 200, 2 + i * 1.4);
  // floor
  const fl = g.createLinearGradient(0, hz, 0, H);
  fl.addColorStop(0, "#0a0720");
  fl.addColorStop(1, "#020309");
  g.fillStyle = fl;
  g.fillRect(0, hz, W, H - hz);
  g.strokeStyle = "rgba(0,180,255,0.9)";
  g.lineWidth = 2;
  for (let i = -16; i <= 16; i++) {
    g.beginPath();
    g.moveTo(W * 0.5 + i * 12, hz);
    g.lineTo(W * 0.5 + i * 150, H);
    g.stroke();
  }
  for (let i = 0; i < 12; i++) {
    const t = Math.pow(i / 12, 2.1);
    const y = hz + t * (H - hz);
    g.globalAlpha = 0.25 + t * 0.75;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  g.globalAlpha = 1;
  // horizon line glow
  g.fillStyle = "rgba(25,230,255,0.95)";
  g.fillRect(0, hz - 1.5, W, 3);
  // distant towers
  g.fillStyle = "#07061a";
  const r = mulberry(5);
  for (let i = 0; i < 26; i++) {
    const x = (i / 26) * W + r() * 12;
    const h = 24 + r() * 90;
    g.fillRect(x, hz - h, 24 + r() * 18, h);
  }
  // HUD slabs
  g.fillStyle = "rgba(0,180,255,0.9)";
  g.fillRect(36, H - 54, 210, 12);
  g.fillStyle = "rgba(255,31,143,0.95)";
  g.fillRect(36, H - 34, 130, 8);
  g.strokeStyle = "rgba(25,230,255,0.9)";
  g.lineWidth = 3;
  g.strokeRect(W - 150, 34, 112, 112);
  g.beginPath();
  g.moveTo(W - 94, 52);
  g.lineTo(W - 94, 128);
  g.moveTo(W - 132, 90);
  g.lineTo(W - 56, 90);
  g.stroke();
  // crosshair
  g.strokeStyle = "rgba(255,255,255,0.95)";
  g.lineWidth = 3;
  g.beginPath();
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    g.moveTo(W * 0.5 + dx * 12, H * 0.36 + dy * 12);
    g.lineTo(W * 0.5 + dx * 30, H * 0.36 + dy * 30);
  }
  g.stroke();
  // scanline sheen
  g.fillStyle = "rgba(0,0,0,0.12)";
  for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
});

export interface SetupMats {
  /** brushed gunmetal, vertex-coloured */
  metal: MeshStandardMaterial;
  /** matte sandblasted plastic, vertex-coloured */
  plastic: MeshStandardMaterial;
  /** HDR emissive, vertex-coloured (blooms) */
  glow: MeshBasicMaterial;
  /** smoked translucent plastic (switch housings) */
  smoke: MeshPhysicalMaterial;
  all: Array<MeshStandardMaterial | MeshBasicMaterial | MeshPhysicalMaterial>;
}

/** Fresh materials per part, so hover brightening never bleeds across parts. */
export const makeMats = (): SetupMats => {
  const metal = new MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.92,
    roughness: 0.62,
    roughnessMap: getBrushedMap(),
    envMapIntensity: 2.0,
  });
  const plastic = new MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.04,
    roughness: 0.86,
    roughnessMap: getGrainMap(),
    envMapIntensity: 0.4,
  });
  const glow = new MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const smoke = new MeshPhysicalMaterial({
    color: new Color("#10131a"),
    metalness: 0,
    roughness: 0.25,
    transparent: true,
    opacity: 0.72,
    envMapIntensity: 1,
  });
  return { metal, plastic, glow, smoke, all: [metal, plastic, glow, smoke] };
};
