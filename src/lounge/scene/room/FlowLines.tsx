import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, Color, ShaderMaterial } from "three";
import { useLounge } from "../../LoungeContext";
import { COLORS } from "../../stations";
import { NEON_GAIN } from "./neon";

type XZ = [number, number];
interface Route {
  color: string;
  points: XZ[];
}

/**
 * Wayfinding bus: four lanes leave the reception desk and peel off to the stations.
 * An outer lane turns first so lanes never cross.
 */
const ROUTES: Route[] = [
  { color: COLORS.cyan, points: [[-1, 4.8], [-1, 3.6], [-2, 2.6], [-7, 2.6]] }, // Our PCs
  { color: COLORS.purple, points: [[-0.5, 4.8], [-0.5, -5.6], [-6.35, -5.6]] }, // VIP rooms door
  { color: "#d9fbff", points: [[0, 4.8], [0, -3.2], [1.5, -4.7], [1.5, -9.4]] }, // Offers wall
  { color: COLORS.magenta, points: [[0.5, 4.8], [0.5, 3.6], [1.5, 2.6], [8, 2.6]] }, // Simulator
];

const WIDTH = 0.075;
const Y = 0.014;

const vertexShader = /* glsl */ `
  attribute float aDist;
  attribute float aSide;
  attribute vec3 aColor;
  varying float vDist;
  varying float vSide;
  varying vec3 vColor;
  void main() {
    vDist = aDist; vSide = aSide; vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  varying float vDist;
  varying float vSide;
  varying vec3 vColor;
  void main() {
    float p = fract(vDist * 0.16 - uTime * 0.55);
    float pulse = smoothstep(0.0, 0.05, p) * (1.0 - smoothstep(0.05, 0.3, p));
    float core = 1.0 - abs(vSide);
    vec3 c = vColor * (0.7 + 0.3 * core) * (1.0 + uPulse * pulse * 1.1);
    c += vec3(1.0) * core * core * 0.25 * uPulse * pulse;
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }
`;

const FlowLines = () => {
  const { reducedMotion } = useLounge();

  const geometry = useMemo(() => {
    const pos: number[] = [];
    const dist: number[] = [];
    const side: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    for (const route of ROUTES) {
      const c = new Color(route.color).multiplyScalar((NEON_GAIN[route.color.toLowerCase()] ?? 2.2) * 0.75);
      let run = 0;
      for (let i = 0; i < route.points.length - 1; i++) {
        const [x0, z0] = route.points[i];
        const [x1, z1] = route.points[i + 1];
        const len = Math.hypot(x1 - x0, z1 - z0);
        const dx = (x1 - x0) / len;
        const dz = (z1 - z0) / len;
        const nx = -dz * (WIDTH / 2);
        const nz = dx * (WIDTH / 2);
        const e = WIDTH / 2;
        const ax = x0 - dx * e, az = z0 - dz * e, bx = x1 + dx * e, bz = z1 + dz * e;
        const base = pos.length / 3;
        pos.push(ax + nx, Y, az + nz, ax - nx, Y, az - nz, bx + nx, Y, bz + nz, bx - nx, Y, bz - nz);
        dist.push(run - e, run - e, run + len + e, run + len + e);
        side.push(1, -1, 1, -1);
        for (let k = 0; k < 4; k++) col.push(c.r, c.g, c.b);
        idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
        run += len;
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute("aDist", new BufferAttribute(new Float32Array(dist), 1));
    g.setAttribute("aSide", new BufferAttribute(new Float32Array(side), 1));
    g.setAttribute("aColor", new BufferAttribute(new Float32Array(col), 3));
    g.setIndex(idx);
    return g;
  }, []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uPulse: { value: 1 } },
        vertexShader,
        fragmentShader,
        toneMapped: false,
        side: 2,
      }),
    [],
  );

  useEffect(() => {
    material.uniforms.uPulse.value = reducedMotion ? 0 : 1;
  }, [reducedMotion, material]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ clock }) => {
    if (!reducedMotion) material.uniforms.uTime.value = clock.elapsedTime;
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
};

export default FlowLines;
