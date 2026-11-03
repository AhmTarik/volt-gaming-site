import { useMemo } from "react";
import { AdditiveBlending, Color, type Texture } from "three";
import { makeCanvasTexture } from "./canvasTexture";

let shared: Texture | null = null;
const glowTexture = () => {
  if (!shared) {
    shared = makeCanvasTexture(128, 128, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.35, "rgba(255,255,255,0.35)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }).tex;
  }
  return shared;
};

interface Props {
  color: string;
  size: [number, number];
  opacity?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/** Cheap additive light-pool decal: fakes neon spill on a surface without a real light. */
const GlowPlane = ({ color, size, opacity = 0.4, position, rotation }: Props) => {
  const c = useMemo(() => new Color(color), [color]);
  return (
    <mesh position={position} rotation={rotation} renderOrder={2} raycast={() => null}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        map={glowTexture()}
        color={c}
        transparent
        opacity={opacity}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  );
};

export default GlowPlane;
