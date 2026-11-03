import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, MathUtils, type Group, type Material, type Mesh } from "three";
import { useScene } from "./context";
import type { PartId } from "./types";
import type { V3 } from "./geo";

/**
 * Idle float: slow bob + a hair of yaw/roll drift. Sine waves, no easing needed: it is ambient,
 * not a response to anything. Offsets are tiny so labels stay readable. Static under reduced motion.
 */
export function Float({
  amp = 0.06,
  speed = 0.55,
  phase = 0,
  drift = 0.03,
  position,
  rotation,
  children,
}: {
  amp?: number;
  speed?: number;
  phase?: number;
  drift?: number;
  position?: V3;
  rotation?: V3;
  children: ReactNode;
}) {
  const { reduced } = useScene();
  const inner = useRef<Group>(null!);
  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    inner.current.position.y = Math.sin(t * speed + phase) * amp;
    inner.current.rotation.y = Math.sin(t * speed * 0.55 + phase * 1.7) * drift;
    inner.current.rotation.z = Math.cos(t * speed * 0.7 + phase) * drift * 0.35;
  });
  return (
    <group position={position} rotation={rotation}>
      <group ref={inner}>{children}</group>
    </group>
  );
}

interface MatRec {
  m: Material & Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  kind: "basic" | "emissive" | "tint";
  base: number;
}

const TINT = new Color("#3fb4ff");

/**
 * An interactive, labelled part: Float + hover brighten + an invisible hit box (so pointer events
 * never raycast thousands of triangles). Hover eases ~150ms with an exponential damp; in demand
 * mode it keeps asking for frames only while the value is still converging.
 */
export function Part({
  id,
  position,
  rotation,
  float,
  hit,
  children,
}: {
  id: PartId;
  position: V3;
  rotation?: V3;
  float?: { amp?: number; speed?: number; phase?: number; drift?: number };
  hit: { size: V3; center?: V3 }[];
  children: ReactNode;
}) {
  const { reduced, hovered, setHovered } = useScene();
  const group = useRef<Group>(null!);
  const lift = useRef<Group>(null!);
  const recs = useRef<MatRec[]>([]);
  const h = useRef(0);
  const target = hovered === id ? 1 : 0;

  useLayoutEffect(() => {
    const seen = new Set<Material>();
    const list: MatRec[] = [];
    group.current.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      if (mesh.userData.hit) return;
      // pointer events go through the hit box only
      mesh.raycast = () => {};
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const m of mats as any[]) {
        if (!m || seen.has(m) || m.userData?.noHover) continue;
        seen.add(m);
        if (m.isMeshBasicMaterial) list.push({ m, kind: "basic", base: 1 });
        else if (m.isMeshStandardMaterial) {
          const lit = m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b > 0);
          if (lit) list.push({ m, kind: "emissive", base: m.emissiveIntensity });
          else {
            m.emissive = TINT.clone();
            m.emissiveIntensity = 0;
            list.push({ m, kind: "tint", base: 0 });
          }
        }
      }
    });
    recs.current = list;
  }, []);

  useFrame((state, dt) => {
    const diff = target - h.current;
    if (Math.abs(diff) < 0.002 && h.current === target) return;
    h.current = Math.abs(diff) < 0.002 ? target : MathUtils.damp(h.current, target, 14, dt);
    const v = h.current;
    for (const r of recs.current) {
      if (r.kind === "basic") r.m.color.setScalar(1 + v * 0.85);
      else if (r.kind === "emissive") r.m.emissiveIntensity = r.base * (1 + v);
      else r.m.emissiveIntensity = v * 0.32;
    }
    lift.current.scale.setScalar(1 + v * 0.025);
    state.invalidate();
  });

  return (
    <group ref={group} position={position} rotation={rotation}>
      <Float {...float}>
        <group ref={lift}>
          {children}
          {hit.map((b, i) => (
            <mesh
              key={i}
              userData={{ hit: true }}
              position={b.center}
              visible={false}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(id);
              }}
              onPointerOut={() => setHovered(null, id)}
            >
              <boxGeometry args={b.size} />
              <meshBasicMaterial />
            </mesh>
          ))}
        </group>
      </Float>
    </group>
  );
}
