import { Html, Line } from "@react-three/drei";
import { Color } from "three";
import { useScene } from "./context";
import type { PartId } from "./types";
import type { V3 } from "./geo";

const BLUE = new Color("#00b4ff").multiplyScalar(1.6);
const MAGENTA = new Color("#ff1f8f").multiplyScalar(2.2);

/**
 * Leader-line callout. The diagonal leader is a 3D line (so it tracks the floating part); the
 * horizontal rule + tag are real DOM text positioned at the elbow, so type stays crisp and
 * legible at any canvas size and is selectable/findable.
 */
export function SpecLabel({
  id,
  category,
  value,
  anchor,
  elbow,
  side = "right",
  index,
}: {
  id: PartId;
  category: string;
  value: string;
  anchor: V3;
  elbow: V3;
  side?: "left" | "right";
  /** 1-based marker number used in compact mode */
  index: number;
}) {
  const { hovered, compact } = useScene();
  const on = hovered === id;
  const left = side === "left";
  if (compact) {
    return (
      <group>
        <mesh position={anchor} raycast={() => null}>
          <sphereGeometry args={[on ? 0.07 : 0.05, 12, 8]} />
          <meshBasicMaterial color={on ? MAGENTA : BLUE} toneMapped={false} />
        </mesh>
        <Html position={anchor} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }} wrapperClass="!pointer-events-none">
          <span
            data-spec-label={id}
            data-active={on}
            className={`-translate-y-[130%] flex h-[18px] w-[18px] items-center justify-center rounded-full border font-heading text-[9px] font-bold leading-none transition-[border-color,background-color,color] duration-150 ${
              on ? "border-neon-red bg-neon-red text-white" : "border-secondary bg-black/70 text-neon-cyan"
            }`}
          >
            {index}
          </span>
        </Html>
      </group>
    );
  }
  return (
    <group>
      <Line
        points={[anchor, elbow]}
        color={on ? MAGENTA : BLUE}
        lineWidth={on ? 1.6 : 1.1}
        transparent
        opacity={on ? 1 : 0.75}
        toneMapped={false}
        raycast={() => null}
      />
      <mesh position={anchor} raycast={() => null}>
        <sphereGeometry args={[on ? 0.06 : 0.045, 12, 8]} />
        <meshBasicMaterial color={on ? MAGENTA : BLUE} toneMapped={false} />
      </mesh>
      <Html position={elbow} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }} wrapperClass="!pointer-events-none">
        <div
          data-spec-label={id}
          data-active={on}
          className={`group flex items-center select-none ${left ? "-translate-x-full flex-row-reverse" : ""} -translate-y-1/2`}
        >
          <span
            className={`block h-px w-3 sm:w-5 transition-colors duration-150 ${on ? "bg-neon-red" : "bg-secondary/80"}`}
          />
          <span
            className={`block whitespace-nowrap rounded-[5px] border px-1.5 py-[3px] sm:px-2.5 sm:py-1 backdrop-blur-[3px] transition-[border-color,background-color,box-shadow] duration-150 ease-out ${
              on
                ? "border-neon-red/80 bg-black/80 shadow-[0_0_14px_hsl(340_80%_55%/0.55)]"
                : "border-white/15 bg-black/60 shadow-[0_0_10px_hsl(220_70%_55%/0.25)]"
            }`}
          >
            <span
              className={`block font-heading text-[8px] sm:text-[10px] leading-none uppercase tracking-[0.16em] transition-colors duration-150 ${
                on ? "text-neon-red" : "text-neon-cyan"
              }`}
            >
              {category}
            </span>
            <span
              className={`mt-[3px] block font-body text-[12px] sm:text-[16px] font-bold leading-none tracking-wide transition-colors duration-150 ${
                on ? "text-white" : "text-foreground"
              }`}
            >
              {value}
            </span>
          </span>
        </div>
      </Html>
    </group>
  );
}
