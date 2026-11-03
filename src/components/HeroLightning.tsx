import { useEffect, useRef, useState } from "react";
import { drawBolt, makeBolt, prefersReducedMotion, type Pt, type Seg } from "@/lib/lightning";

// Strike timeline (ms). One bright peak, a small restrike shoulder, then a fade.
// Max 2 luminance peaks per 700ms strike, then >= 1.2s gap (so >= 1.9s per strike), flash confined
// to the slogan area => well under 3 flashes/second (WCAG 2.3.1).
const STRIKE_MS = 700;
const FLASH_PEAK = 0.2; // tinted (purple/cyan) overlay opacity, never white, never full-screen opaque
const envelope = (t: number) => {
  if (t < 0.06) return t / 0.06; // 40ms rise
  if (t < 0.18) return 1 - ((t - 0.06) / 0.12) * 0.55; // fall to 0.45
  if (t < 0.26) return 0.45 + ((t - 0.18) / 0.08) * 0.3; // soft restrike to 0.75
  return Math.max(0, 0.75 * (1 - (t - 0.26) / 0.74) ** 2); // ease out tail
};

// Neon sign colours (see .neon-tube in index.css).
const PINK_GLOW = "hsl(312 100% 58%)";
const BLUE_MID = "hsl(205 100% 62%)";
const CORE = "hsl(300 100% 97%)";

/**
 * Occasional procedural lightning that discharges out of the hero slogan: bolts arc out of
 * its left/right ends (sometimes both), small sparks jump off its top and bottom edges, the
 * slogan brightens and a glow flashes around it only.
 * Everything per-frame happens on a canvas and refs: no React re-renders.
 */
const HeroLightning = ({
  hostRef,
  targetRef,
}: {
  hostRef: React.RefObject<HTMLElement>;
  /** The element the lightning comes out of (the slogan). */
  targetRef: React.RefObject<HTMLElement>;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const [reduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    const flash = flashRef.current;
    const host = hostRef.current;
    const target = targetRef.current;
    if (!canvas || !flash || !host || !target) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dev-only: ?strike freezes a strike at peak for screenshots.
    const hold = import.meta.env.DEV && new URLSearchParams(location.search).has("strike");

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      const r = host.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let raf = 0;
    let timer = 0;
    let visible = true;
    let segs: Seg[] = [];
    let start = 0;

    const clear = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const frame = (now: number) => {
      const t = hold ? 0.1 : (now - start) / STRIKE_MS;
      clear();
      if (t >= 1) {
        flash.style.opacity = "0";
        target.style.filter = "";
        raf = 0;
        schedule();
        return;
      }
      const e = envelope(t);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawBolt(ctx, segs, e, Math.min(1.6, Math.max(1, w / 1000)), PINK_GLOW, BLUE_MID, CORE);
      flash.style.opacity = String(e * FLASH_PEAK);
      target.style.filter = `brightness(${(1 + e * 0.7).toFixed(3)})`;
      if (!hold) raf = requestAnimationFrame(frame);
    };

    const strike = () => {
      timer = 0;
      if (!visible || document.hidden) return;
      // Slogan box in host coordinates.
      const hr = host.getBoundingClientRect();
      // Measure the glyphs, not the (full-width) block, so bolts leave the first/last letter.
      const range = document.createRange();
      range.selectNodeContents(target);
      const tr = range.getBoundingClientRect();
      const box = { l: tr.left - hr.left, r: tr.right - hr.left, t: tr.top - hr.top, b: tr.bottom - hr.top };
      const cx = (box.l + box.r) / 2;
      const cy = (box.t + box.b) / 2;
      const reach = Math.min(w * 0.32, 380);

      // Main discharge out of one end, or both.
      const sides = Math.random() < 0.35 ? [-1, 1] : [Math.random() < 0.5 ? -1 : 1];
      segs = [];
      for (const dir of sides) {
        const from: Pt = { x: dir < 0 ? box.l - 6 : box.r + 6, y: box.t + (box.b - box.t) * (0.3 + Math.random() * 0.4) };
        const to: Pt = {
          x: from.x + dir * reach * (0.55 + Math.random() * 0.45),
          y: from.y + (Math.random() - 0.5) * reach * 0.7,
        };
        segs.push(...makeBolt(from, to, { depth: 6, rough: 0.2, forks: 3 }));
      }
      // Small sparks jumping off the letters' top and bottom edges.
      const sparks = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < sparks; i++) {
        const up = Math.random() < 0.5;
        const from: Pt = { x: box.l + (box.r - box.l) * (0.08 + Math.random() * 0.84), y: up ? box.t + 2 : box.b - 2 };
        const len = 18 + Math.random() * 40;
        const to: Pt = { x: from.x + (Math.random() - 0.5) * len, y: from.y + (up ? -len : len) };
        for (const seg of makeBolt(from, to, { depth: 4, rough: 0.3, forks: 0, forkDepth: 0 })) {
          segs.push({ ...seg, width: seg.width * 0.45 });
        }
      }

      // Glow only around the slogan, not the whole screen.
      const gx = (cx / w) * 100;
      const gy = (cy / h) * 100;
      flash.style.background = `radial-gradient(ellipse ${Math.max(18, ((box.r - box.l) / w) * 70)}% 22% at ${gx}% ${gy}%, hsl(312 100% 58% / 0.9), hsl(205 100% 60% / 0.35) 45%, transparent 75%)`;
      start = performance.now();
      raf = requestAnimationFrame(frame);
    };

    function schedule(first = false) {
      window.clearTimeout(timer);
      if (!visible || document.hidden) return;
      timer = window.setTimeout(strike, first ? (hold ? 300 : 1000) : 1200 + Math.random() * 1300);
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        window.clearTimeout(timer);
        timer = 0;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        clear();
        flash.style.opacity = "0";
        target.style.filter = "";
      } else if (!timer && !raf) schedule();
    });
    io.observe(host);

    const onVis = () => {
      if (document.hidden) {
        window.clearTimeout(timer);
        timer = 0;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        clear();
        flash.style.opacity = "0";
        target.style.filter = "";
      } else if (visible && !timer && !raf) schedule();
    };
    document.addEventListener("visibilitychange", onVis);

    schedule(true);
    return () => {
      window.clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduced, hostRef, targetRef]);

  if (reduced) {
    // Static faint glow, no strikes.
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 60% at 50% 15%, hsl(263 70% 58% / 0.12), transparent 70%)" }}
      />
    );
  }

  return (
    <>
      <div ref={flashRef} aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-0" />
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" />
    </>
  );
};

export default HeroLightning;
