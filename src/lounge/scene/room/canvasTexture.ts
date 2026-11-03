import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from "three";

export const makeCanvasTexture = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  return { tex, canvas, ctx };
};

/** Greedy word wrap using the context's current font. */
export const wrapLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
};

export const HEADING_FONT = 'Orbitron, "Arial Black", sans-serif';
export const BODY_FONT = 'Rajdhani, "Arial Narrow", sans-serif';

/** Ask the browser to load the site's brand faces (declared in index.css) so canvases can redraw with them. */
export const loadBrandFonts = () => {
  if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
  return Promise.all([
    document.fonts.load("900 100px Orbitron"),
    document.fonts.load("700 40px Orbitron"),
    document.fonts.load("600 40px Rajdhani"),
    document.fonts.load("700 40px Rajdhani"),
  ]).then(
    () => undefined,
    () => undefined,
  );
};
