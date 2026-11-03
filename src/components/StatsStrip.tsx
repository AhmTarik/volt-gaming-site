import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import Reveal from "@/components/Reveal";

const stats = [
  { value: 6, suffix: "", label: "Rooms", box: "neon-glow-purple border-primary/30" },
  { value: 51, suffix: "", label: "Gaming PCs", box: "neon-glow-blue border-secondary/30" },
  { value: 2, suffix: "", label: "Racing Simulators", box: "neon-glow-red border-accent/30" },
  { value: 240, suffix: "Hz", label: "Ultra Monitors", box: "neon-glow-cyan border-neon-cyan/30" },
];

// Writes straight to the DOM node: no React re-render per frame.
const CountUp = ({ value, suffix }: { value: number; suffix: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView || reduce || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => {
        node.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  // Final value is always rendered as the (invisible) sizer so width never changes while counting.
  const initial = reduce ? String(value) : "0";
  return (
    <span className="inline-grid tabular-nums [font-variant-numeric:tabular-nums]">
      <span className="invisible col-start-1 row-start-1" aria-hidden="true">
        {value}
        {suffix}
      </span>
      <span className="col-start-1 row-start-1" aria-label={`${value}${suffix}`}>
        <span ref={ref} aria-hidden="true">
          {initial}
        </span>
        {suffix}
      </span>
    </span>
  );
};

const StatsStrip = () => (
  <section aria-label="Volt at a glance" className="px-4 pb-8 pt-4 md:pb-12">
    <Reveal stagger={0.06} className="container mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {stats.map((s) => (
        <Reveal key={s.label}>
          <div className={`glass-card rounded-xl border px-4 py-6 text-center ${s.box}`}>
            <p className="font-heading text-4xl md:text-5xl font-black gradient-text">
              <CountUp value={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-2 font-body text-sm md:text-base uppercase tracking-widest text-muted-foreground">
              {s.label}
            </p>
          </div>
        </Reveal>
      ))}
    </Reveal>
  </section>
);

export default StatsStrip;
