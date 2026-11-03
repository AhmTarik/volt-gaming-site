import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Color } from "three";
import { useLounge } from "../../LoungeContext";
import { neonMaterial } from "./neon";

const Y = 7.6;
const CROSS_Z = [-9, -5.5, -2, 1.5, 5, 8.5, 12];
const LONG_X = [-12, -6, 0, 6, 12];

/**
 * Open ceiling truss (no solid roof, so the overhead overview still sees the floor).
 * Cross-beam strips drift cyan -> violet -> magenta in a slow travelling wave.
 */
const Truss = () => {
  const { reducedMotion } = useLounge();
  const strips = useMemo(() => CROSS_Z.map(() => neonMaterial("#00f0ff", 2.4)), []);
  const tmp = useMemo(() => new Color(), []);
  useEffect(() => () => strips.forEach((m) => m.dispose()), [strips]);

  useFrame(({ clock }) => {
    const t = reducedMotion ? 0 : clock.elapsedTime * 0.35;
    strips.forEach((m, i) => {
      const w = 0.5 + 0.5 * Math.sin(t - i * 0.7);
      // hue 0.51 (cyan) -> 0.92 (magenta) through blue/violet; magenta end needs more gain to bloom
      tmp.setHSL(0.51 + 0.41 * (reducedMotion ? (i % 2 ? 1 : 0) : w), 1, 0.5);
      m.color.copy(tmp).multiplyScalar(2.2 + 2.2 * (reducedMotion ? (i % 2 ? 1 : 0) : w));
    });
  });

  return (
    <group position={[0, Y, 0]}>
      {LONG_X.map((x) => (
        <mesh key={x} position={[x, 0, 1.1]}>
          <boxGeometry args={[0.14, 0.2, 21.8]} />
          <meshStandardMaterial color="#12141c" roughness={0.45} metalness={0.8} envMapIntensity={0.6} />
        </mesh>
      ))}
      {CROSS_Z.map((z, i) => (
        <group key={z} position={[0, 0, z]}>
          <mesh>
            <boxGeometry args={[28, 0.26, 0.18]} />
            <meshStandardMaterial color="#14161f" roughness={0.45} metalness={0.8} envMapIntensity={0.6} />
          </mesh>
          <mesh position={[0, -0.16, 0]} material={strips[i]}>
            <boxGeometry args={[27.6, 0.04, 0.05]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default Truss;
