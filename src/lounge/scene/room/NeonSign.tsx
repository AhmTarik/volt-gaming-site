import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import type { Material, MeshBasicMaterial } from "three";
import { useLounge } from "../../LoungeContext";
import { buildNeonLetters } from "./glyphs";

interface Props {
  text: string;
  height: number;
  /** Shared neon material (so a prop's hover boost reaches its signs). */
  material: MeshBasicMaterial;
  tracking?: number;
  /** Index of one letter that stutters like a tired tube. Ignored under reduced motion. */
  flicker?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/** Hand-built glass-tube lettering (no font fetch). */
const NeonSign = ({ text, height, material, tracking, flicker, position, rotation }: Props) => {
  const { reducedMotion } = useLounge();
  const { letters } = useMemo(() => buildNeonLetters(text, height, tracking), [text, height, tracking]);
  const flickerMat = useMemo(() => (flicker === undefined ? null : (material.clone() as MeshBasicMaterial)), [flicker, material]);
  const seed = useMemo(() => Math.random() * 9, []);

  useEffect(() => () => letters.forEach((g) => g.dispose()), [letters]);
  useEffect(() => () => flickerMat?.dispose(), [flickerMat]);

  useFrame(({ clock }) => {
    if (!flickerMat || flicker === undefined) return;
    let f = 1;
    if (!reducedMotion) {
      const ph = (clock.elapsedTime + seed) % 11;
      if (ph < 0.18) f = Math.sin(ph * 110) > 0 ? 1 : 0.12;
      else if (ph > 0.4 && ph < 0.55) f = Math.sin((ph - 0.4) * 80) > 0.2 ? 1 : 0.25;
    }
    flickerMat.color.copy(material.color).multiplyScalar(f);
  });

  return (
    <group position={position} rotation={rotation}>
      {letters.map((g, i) => (
        <mesh
          key={i}
          geometry={g}
          material={(i === flicker && flickerMat ? flickerMat : material) as Material}
        />
      ))}
    </group>
  );
};

export default NeonSign;
