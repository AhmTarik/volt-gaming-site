import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import type { SetupSpecs } from "./types";

/**
 * Light entry point for the page: owns the lazy boundary so three.js (the heavy chunk) is only
 * fetched when the viewer is near the screen and WebGL actually exists. No layout shift: every
 * state renders into the same 16:9 box.
 */
const SetupBreakdown = lazy(() => import("./SetupBreakdown"));

const hasWebGL = () => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
};

const FRAME = "relative aspect-[4/5] sm:aspect-video w-full overflow-hidden bg-[#05060a]";

const ROWS: { key: keyof SetupSpecs; label: string }[] = [
  { key: "cpu", label: "CPU" },
  { key: "ram", label: "RAM" },
  { key: "gpu", label: "GPU" },
  { key: "monitor", label: "Monitor" },
  { key: "keyboard", label: "Keyboard" },
  { key: "mouse", label: "Mouse" },
];

/** No WebGL (or the context failed): same dark frame, the specs as styled text. */
function StaticSetup({ specs }: { specs: SetupSpecs }) {
  return (
    <div className={`${FRAME} flex items-center justify-center`}>
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 70% at 18% 30%, hsl(195 100% 50% / 0.16), transparent 70%), radial-gradient(55% 65% at 85% 25%, hsl(330 100% 56% / 0.16), transparent 70%)",
        }}
      />
      <ul className="relative grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 px-4 sm:px-8">
        {ROWS.map(({ key, label }) => (
          <li key={key} className="rounded-md border border-white/10 bg-black/50 px-3 py-2">
            <span className="block font-heading text-[9px] sm:text-[10px] uppercase tracking-[0.16em] text-neon-cyan">{label}</span>
            <span className="mt-1 block font-body text-sm sm:text-base font-bold text-foreground">{specs[key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function LazySetupBreakdown({ specs }: { specs: SetupSpecs }) {
  const slot = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [gl, setGl] = useState<boolean | null>(null);

  useEffect(() => {
    setGl(hasWebGL());
  }, []);

  useEffect(() => {
    const el = slot.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  const placeholder = <div className={FRAME} aria-hidden="true" />;

  return (
    <div ref={slot}>
      {gl === false ? (
        <StaticSetup specs={specs} />
      ) : near && gl ? (
        <Boundary fallback={<StaticSetup specs={specs} />}>
          <Suspense fallback={placeholder}>
            <SetupBreakdown specs={specs} />
          </Suspense>
        </Boundary>
      ) : (
        placeholder
      )}
    </div>
  );
}
