import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { MathUtils, type Group, type PerspectiveCamera } from "three";
import { Backdrop } from "./Backdrop";
import { SceneContext } from "./context";
import { Part } from "./Part";
import { GpuCard, PcCase } from "./parts/PcCase";
import { Monitor } from "./parts/Monitor";
import { Keyboard } from "./parts/Keyboard";
import { Mouse } from "./parts/Mouse";
import type { PartId, SetupSpecs } from "./types";

/**
 * Live exploded-view of an Ultra Room PC. Everything is procedural (no GLTF, no HDRI): merged
 * vertex-coloured geometry, instanced keys and fans, canvas-generated textures.
 */

const usePrefersReducedMotion = () => {
  const [r, setR] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setR(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return r;
};

/** True while the element is on screen AND the tab is visible: gate for the render loop. */
const useActive = (ref: React.RefObject<Element>) => {
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    const vis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [ref]);
  return inView && tabVisible;
};

interface Input {
  yaw: number;
  pitch: number;
  inside: boolean;
  dragging: boolean;
}

/** Parallax + clamped drag-orbit. Rotates the whole layout under fixed lights; the camera never moves. */
function Rig({ input, reduced, children }: { input: React.MutableRefObject<Input>; reduced: boolean; children: React.ReactNode }) {
  const g = useRef<Group>(null!);
  useFrame((state, dt) => {
    const i = input.current;
    const px = !reduced && i.inside ? state.pointer.x : 0;
    const py = !reduced && i.inside ? state.pointer.y : 0;
    const ty = px * 0.1 + i.yaw;
    const tx = -py * 0.035 + i.pitch;
    const k = i.dragging ? 12 : 3.2; // snappy while held, slow glide back on release
    g.current.rotation.y = MathUtils.damp(g.current.rotation.y, ty, k, dt);
    g.current.rotation.x = MathUtils.damp(g.current.rotation.x, tx, k, dt);
    if (Math.abs(g.current.rotation.y - ty) > 5e-4 || Math.abs(g.current.rotation.x - tx) > 5e-4) state.invalidate();
  });
  return <group ref={g}>{children}</group>;
}

/** Keep the 16:9 framing's horizontal extent when the box is narrower (square on phones): widen the fov, don't crop. */
function AspectFit() {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    const base = Math.tan((26 / 2) * (Math.PI / 180)) * (16 / 9);
    (camera as PerspectiveCamera).fov = aspect < 16 / 9 ? 2 * Math.atan((base * 0.8) / aspect) * (180 / Math.PI) : 26;
    // phones: lift the scene above the legend band
    camera.lookAt(-0.4, aspect < 1.2 ? -1.1 : 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, invalidate]);
  return null;
}

type V3 = [number, number, number];

const HITS: Record<PartId, { size: V3; center?: V3 }[]> = {
  case: [
    { size: [2.5, 2.7, 1.3], center: [0, 0, 0] },
    { size: [2.1, 0.9, 0.5], center: [-0.1, 1.9, 0.1] },
  ],
  gpu: [{ size: [1.6, 0.66, 0.3] }],
  monitor: [
    { size: [3.3, 1.9, 0.5], center: [0, 0, -0.2] },
    { size: [1.5, 1.4, 1], center: [0, -1.9, -0.4] },
  ],
  keyboard: [{ size: [3.5, 1.2, 1.35], center: [0, 0.4, 0] }],
  mouse: [{ size: [0.9, 1.4, 1.5], center: [0, 0.6, 0] }],
};

function Scene({ specs, input, reduced, reflective }: { specs: SetupSpecs; input: React.MutableRefObject<Input>; reduced: boolean; reflective: boolean }) {
  return (
    <>
      <Backdrop reflective={reflective} />
      <Rig input={input} reduced={reduced}>
        <Part id="case" position={[-3.0, 0.2, -0.6]} float={{ amp: 0.05, speed: 0.42, phase: 0 }} hit={HITS.case}>
          <PcCase label={{ category: "CPU \u00b7 RAM", value: `${specs.cpu} \u00b7 ${specs.ram}` }} />
        </Part>
        <Part id="gpu" position={[-3.1, -0.4, 0.9]} float={{ amp: 0.06, speed: 0.55, phase: 1.5 }} hit={HITS.gpu}>
          <GpuCard label={{ category: "GPU", value: specs.gpu }} />
        </Part>
        <Part id="monitor" position={[1.0, 1.7, -2.3]} float={{ amp: 0.05, speed: 0.4, phase: 2.2 }} hit={HITS.monitor}>
          <Monitor label={{ category: "Monitor", value: specs.monitor }} />
        </Part>
        <Part id="keyboard" position={[-0.2, -1.75, 1.9]} rotation={[0, -0.04, 0]} float={{ amp: 0.045, speed: 0.5, phase: 3.1 }} hit={HITS.keyboard}>
          <Keyboard label={{ category: "Keyboard", value: specs.keyboard }} />
        </Part>
        <Part id="mouse" position={[3.1, -1.35, 0.9]} rotation={[0, 0.85, 0]} float={{ amp: 0.06, speed: 0.6, phase: 4.4 }} hit={HITS.mouse}>
          <Mouse label={{ category: "Mouse", value: specs.mouse }} />
        </Part>
      </Rig>
    </>
  );
}

export interface SetupBreakdownProps {
  specs: SetupSpecs;
  className?: string;
}

export default function SetupBreakdown({ specs, className = "" }: SetupBreakdownProps) {
  const box = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const active = useActive(box);
  const [hovered, setHoveredState] = useState<PartId | null>(null);
  const [dpr, setDpr] = useState(2);
  const [touched, setTouched] = useState(false);
  const [compact, setCompact] = useState(false);
  const input = useRef<Input>({ yaw: 0, pitch: 0, inside: false, dragging: false });
  const gl = useRef<RootState | null>(null);
  const start = useRef({ x: 0, y: 0 });

  // Capable = fine pointer + not a small screen; they get the real reflection pass and 4x MSAA.
  const capable = useMemo(() => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches && window.innerWidth >= 900, []);

  const setHovered = useCallback((id: PartId | null, from?: PartId) => {
    setHoveredState((cur) => (from && cur !== from ? cur : id));
  }, []);
  const ctx = useMemo(() => ({ reduced, hovered, compact, setHovered }), [reduced, hovered, compact, setHovered]);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCompact(e.contentRect.width < 560));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const frameloop = !active ? "never" : reduced ? "demand" : "always";
  useEffect(() => {
    if (active) gl.current?.invalidate();
  }, [active, reduced, specs]);

  const poke = () => gl.current?.invalidate();
  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    input.current.dragging = true;
    start.current = { x: e.clientX - input.current.yaw / 0.0045, y: e.clientY + input.current.pitch / 0.0025 };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setTouched(true);
  };
  const onMove = (e: React.PointerEvent) => {
    const i = input.current;
    i.inside = true;
    if (i.dragging) {
      i.yaw = MathUtils.clamp((e.clientX - start.current.x) * 0.0045, -0.34, 0.34);
      i.pitch = MathUtils.clamp((start.current.y - e.clientY) * 0.0025, -0.1, 0.12);
    }
    poke();
  };
  const onUp = () => {
    const i = input.current;
    i.dragging = false;
    i.yaw = 0;
    i.pitch = 0;
    poke();
  };
  const onLeave = () => {
    input.current.inside = false;
    poke();
  };

  const names = [
    ["CPU", specs.cpu],
    ["RAM", specs.ram],
    ["GPU", specs.gpu],
    ["Monitor", specs.monitor],
    ["Keyboard", specs.keyboard],
    ["Mouse", specs.mouse],
  ];

  return (
    <div
      ref={box}
      className={`relative isolate aspect-[4/5] sm:aspect-video w-full overflow-hidden bg-[#05060a] cursor-grab active:cursor-grabbing select-none ${className}`}
      style={{ touchAction: "pan-y" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onLeave}
    >
      <SceneContext.Provider value={ctx}>
        <div className="absolute inset-0" aria-hidden="true">
          <Canvas
            dpr={[1, dpr]}
            frameloop={frameloop}
            camera={{ position: [9.8, 5.8, 12.6], fov: 26, near: 1, far: 70 }}
            gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
            onCreated={(state) => {
              state.camera.lookAt(-0.4, 0, 0);
              gl.current = state;
            }}
            onPointerMissed={() => setHovered(null)}
          >
            <AspectFit />
            <PerformanceMonitor onDecline={() => setDpr(1)} flipflops={2} />
            <Suspense fallback={null}>
              <Scene specs={specs} input={input} reduced={reduced} reflective={capable} />
            </Suspense>
            <EffectComposer multisampling={capable ? 4 : 0}>
              <Bloom mipmapBlur intensity={1.05} luminanceThreshold={0.85} luminanceSmoothing={0.25} radius={0.72} />
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
              <Vignette eskil={false} offset={0.28} darkness={0.7} />
            </EffectComposer>
          </Canvas>
        </div>
      </SceneContext.Provider>

      {/* minimal brand mark + interaction hint (decorative) */}
      <div aria-hidden="true" className="pointer-events-none absolute left-3 top-3 hidden sm:block sm:left-5 sm:top-4 font-heading text-[8px] sm:text-[10px] uppercase tracking-[0.28em] text-white/55">
        Volt <span className="text-neon-cyan">/</span> Ultra Setup
      </div>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute right-3 top-3 hidden sm:block sm:right-5 sm:top-4 font-heading text-[8px] sm:text-[10px] uppercase tracking-[0.22em] text-white/45 transition-opacity duration-300 ${touched ? "opacity-0" : "opacity-100"}`}
      >
        Drag to tilt
      </div>

      {/* compact legend: real, tappable text; tapping a chip highlights its part */}
      {compact && (
        <ul className="absolute inset-x-2 bottom-2 grid grid-cols-2 gap-1.5">
          {[
            ["case", "CPU \u00b7 RAM", `${specs.cpu} \u00b7 ${specs.ram}`],
            ["gpu", "GPU", specs.gpu],
            ["monitor", "Monitor", specs.monitor],
            ["keyboard", "Keyboard", specs.keyboard],
            ["mouse", "Mouse", specs.mouse],
          ].map(([id, cat, val], i) => (
            <li key={id} className={i === 0 ? "col-span-2" : ""}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setHovered(hovered === id ? null : (id as PartId));
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={`flex w-full items-center gap-2 rounded-md border px-2 py-[3px] text-left backdrop-blur-[3px] transition-[border-color,background-color] duration-150 ${
                  hovered === id ? "border-neon-red/80 bg-black/80" : "border-white/15 bg-black/60"
                }`}
              >
                <span className={`flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border font-heading text-[9px] font-bold ${hovered === id ? "border-neon-red bg-neon-red text-white" : "border-secondary text-neon-cyan"}`}>
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block font-heading text-[7px] uppercase leading-none tracking-[0.16em] text-neon-cyan">{cat}</span>
                  <span className="mt-[3px] block font-body text-[12px] font-bold leading-[1.05] text-foreground">{val}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* the same facts as real text for assistive tech; the visual labels are decorative duplicates */}
      <p className="sr-only">
        Exploded view of an Ultra Room gaming setup: {names.map(([k, v]) => `${k} ${v}`).join(", ")}.
      </p>
    </div>
  );
}
