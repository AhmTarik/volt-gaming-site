import { useEffect, useMemo } from "react";
import { MeshReflectorMaterial } from "@react-three/drei";
import { RepeatWrapping } from "three";
import { makeCanvasTexture } from "./canvasTexture";

/** 2m tile: dark polished slab with a fine lit seam. Repeats across the floor. */
const useTileTexture = (repeatX: number, repeatY: number) => {
  const tex = useMemo(() => {
    const { tex } = makeCanvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = "#0d0f17";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 700; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 2);
      }
      ctx.strokeStyle = "#04050a";
      ctx.lineWidth = 6;
      ctx.strokeRect(0, 0, w, h);
      ctx.strokeStyle = "#1d2130";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(5, 5, w - 10, h - 10);
    });
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    return tex;
  }, [repeatX, repeatY]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
};

/** Dark gradient laid over the front of the floor: the room goes dim toward the open +z side. */
const useFrontFade = () => {
  const tex = useMemo(() => {
    const { tex } = makeCanvasTexture(8, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#000");
      g.addColorStop(1, "#fff");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    return tex;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
};

const Floor = () => {
  const tiles = useTileTexture(14, 13);
  const fade = useFrontFade();
  return (
    <group>
      {/* reflective slab: x [-14,14], z [-10,16] */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 3]} receiveShadow>
        <planeGeometry args={[28, 26]} />
        <MeshReflectorMaterial
          map={tiles}
          color="#ffffff"
          metalness={0.6}
          roughness={0.82}
          resolution={512}
          blur={[260, 80]}
          mixBlur={1.2}
          mixStrength={38}
          mixContrast={1}
          mirror={0}
          depthScale={0.9}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          envMapIntensity={0.5}
        />
      </mesh>
      {/* matte apron so the slab edge never reads as a cliff */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#080a10" roughness={1} metalness={0} />
      </mesh>
      {/* front fade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 12.2]} renderOrder={1}>
        <planeGeometry args={[28, 8.6]} />
        <meshBasicMaterial color="#05060a" alphaMap={fade} transparent opacity={0.94} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
};

export default Floor;
