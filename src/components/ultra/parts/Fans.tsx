import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Euler, InstancedMesh, Matrix4, Object3D, Path, Quaternion, Shape, ShapeGeometry, ExtrudeGeometry, Vector3 } from "three";
import { GeoBuilder, once, type V3 } from "../geo";
import { makeMats } from "../materials";
import { useScene } from "../context";

/** Unit fan (diameter 1, faces +Z). Blades / frame / RGB ring are three shared geometries. */
const getBlades = once(() => {
  const b = new GeoBuilder();
  const N = 9;
  for (let i = 0; i < N; i++) {
    const s = new Shape();
    s.moveTo(0.07, -0.02);
    s.bezierCurveTo(0.2, -0.1, 0.38, -0.11, 0.47, -0.03);
    s.bezierCurveTo(0.44, 0.06, 0.3, 0.12, 0.07, 0.045);
    s.closePath();
    const g = new ShapeGeometry(s, 8);
    g.rotateX(0.55);
    g.rotateZ((i / N) * Math.PI * 2);
    b.add(g, { color: "#171a24" });
  }
  b.cyl(0.15, 0.15, 0.09, { rot: [Math.PI / 2, 0, 0], color: "#222634" }, 28);
  b.cyl(0.1, 0.1, 0.02, { rot: [Math.PI / 2, 0, 0], pos: [0, 0, 0.05], color: "#3a4054" }, 28);
  return b.build();
});

const getFrame = once(() => {
  const s = new Shape();
  const h = 0.5;
  const r = 0.08;
  s.moveTo(-h + r, -h);
  s.lineTo(h - r, -h);
  s.quadraticCurveTo(h, -h, h, -h + r);
  s.lineTo(h, h - r);
  s.quadraticCurveTo(h, h, h - r, h);
  s.lineTo(-h + r, h);
  s.quadraticCurveTo(-h, h, -h, h - r);
  s.lineTo(-h, -h + r);
  s.quadraticCurveTo(-h, -h, -h + r, -h);
  const hole = new Path();
  hole.absarc(0, 0, 0.47, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const g = new ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false, curveSegments: 32 });
  g.translate(0, 0, -0.06);
  const b = new GeoBuilder();
  b.add(g, { color: "#0c0d12" });
  return b.build();
});

const getRing = once(() => {
  const b = new GeoBuilder();
  b.torus(0.455, 0.03, { pos: [0, 0, 0.062] }, 6, 48);
  b.torus(0.18, 0.022, { pos: [0, 0, 0.068] }, 6, 32);
  return b.build();
});

export interface FanSpec {
  pos: V3;
  /** orientation; fans face +Z at [0,0,0] */
  rot?: V3;
  size: number;
  /** HDR ring colour */
  color: Color;
}

const _o = new Object3D();
const _m = new Matrix4();
const _q = new Quaternion();
const _qs = new Quaternion();
const _z = new Vector3(0, 0, 1);

/** N fans = 3 instanced draw calls. Blades spin; rings carry per-fan HDR colour. */
export function Fans({ fans, rpm = 1 }: { fans: FanSpec[]; rpm?: number }) {
  const { reduced } = useScene();
  const mats = useMemo(() => makeMats(), []);
  const blades = useRef<InstancedMesh>(null!);
  const frames = useRef<InstancedMesh>(null!);
  const rings = useRef<InstancedMesh>(null!);
  const base = useMemo(
    () =>
      fans.map((f) => {
        _o.position.set(...f.pos);
        _o.rotation.set(...(f.rot ?? [0, 0, 0]));
        _o.scale.setScalar(f.size);
        _o.updateMatrix();
        return { m: _o.matrix.clone(), q: new Quaternion().setFromEuler(new Euler(...(f.rot ?? [0, 0, 0]))), p: new Vector3(...f.pos), s: f.size };
      }),
    [fans],
  );

  useLayoutEffect(() => {
    base.forEach((b, i) => {
      frames.current.setMatrixAt(i, b.m);
      rings.current.setMatrixAt(i, b.m);
      blades.current.setMatrixAt(i, b.m);
      rings.current.setColorAt(i, fans[i].color);
    });
    [frames, rings, blades].forEach((r) => {
      r.current.instanceMatrix.needsUpdate = true;
    });
    if (rings.current.instanceColor) rings.current.instanceColor.needsUpdate = true;
  }, [base, fans]);

  useFrame(({ clock }) => {
    if (reduced) return;
    const a = clock.elapsedTime * 3.2 * rpm;
    base.forEach((b, i) => {
      _qs.setFromAxisAngle(_z, i % 2 ? -a : a);
      _q.copy(b.q).multiply(_qs);
      _m.compose(b.p, _q, _o.scale.setScalar(b.s));
      blades.current.setMatrixAt(i, _m);
    });
    blades.current.instanceMatrix.needsUpdate = true;
  });

  const n = fans.length;
  return (
    <group>
      <instancedMesh frustumCulled={false} ref={frames} args={[getFrame(), mats.plastic, n]} />
      <instancedMesh frustumCulled={false} ref={blades} args={[getBlades(), mats.plastic, n]} />
      <instancedMesh frustumCulled={false} ref={rings} args={[getRing(), mats.glow, n]} />
    </group>
  );
}
