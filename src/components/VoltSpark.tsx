import { useEffect, useRef } from "react";
import { drawBolt, makeBolt, prefersReducedMotion, type Seg } from "@/lib/lightning";

const SPARK_MS = 320;
const MIN_GAP_MS = 700; // hover re-triggers at most ~1.4/s

/**
 * Brief electric arc over the logo. Canvas overlay sized to its parent (the logo link).
 * Fires once on load and on fine-pointer hover; nothing under prefers-reduced-motion.
 */
const VoltSpark = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host || prefersReducedMotion()) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = host.clientWidth + 24;
      h = host.clientHeight + 24;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let raf = 0;
    let last = -Infinity;
    let segs: Seg[] = [];
    let start = 0;

    const frame = (now: number) => {
      const t = (now - start) / SPARK_MS;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (t >= 1) {
        raf = 0;
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // two quick flickers then fade
      const a = t < 0.25 ? 1 : t < 0.4 ? 0.3 : t < 0.5 ? 0.9 : Math.max(0, 0.9 * (1 - (t - 0.5) / 0.5));
      drawBolt(ctx, segs, a, 0.55);
      raf = requestAnimationFrame(frame);
    };

    const spark = () => {
      const now = performance.now();
      if (document.hidden || now - last < MIN_GAP_MS) return;
      last = now;
      // arc across the wordmark, from near one end to near the other, with small forks
      const y0 = 4 + Math.random() * (h - 8);
      const y1 = 4 + Math.random() * (h - 8);
      segs = makeBolt({ x: 2, y: y0 }, { x: w - 2, y: y1 }, { depth: 6, rough: 0.12, forks: 3 });
      start = now;
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onEnter = () => spark();
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) host.addEventListener("mouseenter", onEnter);
    const loadTimer = window.setTimeout(spark, 1400);

    return () => {
      window.clearTimeout(loadTimer);
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute -left-3 -top-3"
      style={{ width: "calc(100% + 24px)", height: "calc(100% + 24px)" }}
    />
  );
};

export default VoltSpark;
