import { useMemo } from "react";
import { Environment, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import { AdditiveBlending, Color, DoubleSide, MeshBasicMaterial, PlaneGeometry, Quaternion, ShaderMaterial, Vector3 } from "three";
import { getRadialMap, PALETTE } from "./materials";
import { hdr, type V3 } from "./geo";

export const FLOOR_Y = -2.75;

/* ------------------------------------------------------------------ *
 * Fake volumetrics: open additive cones whose alpha falls off along the
 * axis and toward the silhouette (view-dependent), so they read as haze
 * lit from behind rather than as geometry. Two cheap draw calls.
 * ------------------------------------------------------------------ */
const beamVert = /* glsl */ `
  varying vec3 vN; varying vec3 vV; varying float vT;
  void main() {
    vT = uv.y;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const beamFrag = /* glsl */ `
  uniform vec3 uColor; uniform float uI;
  varying vec3 vN; varying vec3 vV; varying float vT;
  void main() {
    float f = pow(abs(dot(normalize(vN), normalize(vV))), 1.7);
    float a = uI * f * pow(vT, 1.25);
    gl_FragColor = vec4(uColor, a);
  }
`;

function Beam({ from, to, radius, color, intensity }: { from: V3; to: V3; radius: number; color: string; intensity: number }) {
  const { len, pos, quat, mat } = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const quat = new Quaternion().setFromUnitVectors(new Vector3(0, -1, 0), dir.normalize());
    const mat = new ShaderMaterial({
      vertexShader: beamVert,
      fragmentShader: beamFrag,
      uniforms: { uColor: { value: new Color(color) }, uI: { value: intensity } },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
    });
    return { len, pos: a.clone().add(b).multiplyScalar(0.5), quat, mat };
  }, [from, to, color, intensity]);
  return (
    <mesh position={pos} quaternion={quat} material={mat} renderOrder={-2} raycast={() => null}>
      <cylinderGeometry args={[0.05, radius, len, 28, 1, true]} />
    </mesh>
  );
}

const BEAMS = {
  blue: { from: [-6.2, 6.4, -4.2] as V3, to: [-2.4, -2.4, -0.6] as V3, radius: 2.1, color: PALETTE.blue, intensity: 0.6 },
  magenta: { from: [6.4, 6.0, -4.6] as V3, to: [2.6, -2.2, -0.8] as V3, radius: 2.0, color: PALETTE.magenta, intensity: 0.6 },
  cyan: { from: [0.4, 7.2, -5.5] as V3, to: [0.2, -2.8, -0.5] as V3, radius: 1.4, color: PALETTE.cyan, intensity: 0.12 },
};

function Glow({ position, size, color, opacity, rotation }: { position: V3; size: [number, number]; color: Color; opacity: number; rotation?: V3 }) {
  const mat = useMemo(
    () => new MeshBasicMaterial({ map: getRadialMap(), color, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
    [color, opacity],
  );
  const geo = useMemo(() => new PlaneGeometry(size[0], size[1]), [size]);
  return <mesh position={position} rotation={rotation} material={mat} geometry={geo} renderOrder={-1} raycast={() => null} />;
}

/** Soft dark ellipse on the floor under each floating part: the cheapest levitation cue. */
function Contact({ x, z, w, d, o = 0.7 }: { x: number; z: number; w: number; d: number; o?: number }) {
  const mat = useMemo(
    () => new MeshBasicMaterial({ map: getRadialMap(), color: "#000000", transparent: true, opacity: o, depthWrite: false }),
    [o],
  );
  return (
    <mesh position={[x, FLOOR_Y + 0.004, z]} rotation={[-Math.PI / 2, 0, 0]} material={mat} renderOrder={-1} raycast={() => null}>
      <planeGeometry args={[w, d]} />
    </mesh>
  );
}

const BLUE = new Color(PALETTE.blue);
const MAGENTA = new Color(PALETTE.magenta);
const BLUE_GLOW = hdr(PALETTE.blue, 0.9);
const MAG_GLOW = hdr(PALETTE.magenta, 0.9);

export function Backdrop({ reflective }: { reflective: boolean }) {
  return (
    <>
      <color attach="background" args={[PALETTE.obsidian]} />
      <fog attach="fog" args={[PALETTE.obsidian, 19, 40]} />

      {/* Image-based light, baked once from local Lightformers: no HDRI download. */}
      <Environment resolution={reflective ? 256 : 128} frames={1}>
        <Lightformer form="rect" intensity={5.5} color={PALETTE.blue} position={[-7, 2, 1]} rotation-y={Math.PI / 2} scale={[9, 7, 1]} />
        <Lightformer form="rect" intensity={6.5} color={PALETTE.magenta} position={[7, 1.5, 0]} rotation-y={-Math.PI / 2} scale={[9, 6, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#dbe9ff" position={[0, 7.5, 1]} rotation-x={Math.PI / 2} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={3.2} color={PALETTE.cyan} position={[0, 2.5, -8]} scale={[14, 1.2, 1]} />
        <Lightformer form="rect" intensity={1.8} color="#b7c6ff" position={[1, -1, 8]} rotation-y={Math.PI} scale={[10, 1.4, 1]} />
        <Lightformer form="ring" intensity={2.2} color="#ffffff" position={[-3, 5, 6]} rotation-x={-Math.PI / 4} scale={3} />
      </Environment>

      {/* rim + key lights: electric blue from back-left, magenta from back-right, a restrained cool key */}
      <directionalLight position={[-7, 4.5, -5]} intensity={2.6} color={PALETTE.blue} />
      <directionalLight position={[7, 4, -5]} intensity={2.8} color={PALETTE.magenta} />
      <directionalLight position={[2.5, 7, 7]} intensity={0.85} color="#cfe0ff" />
      <pointLight position={[0, -1.5, 5]} intensity={5} distance={9} color="#6f8cff" />

      <Beam {...BEAMS.blue} />
      <Beam {...BEAMS.magenta} />
      <Beam {...BEAMS.cyan} />

      {/* back-lit halos behind the two hero silhouettes */}
      <Glow position={[-3.2, 0.4, -3.2]} size={[9, 8]} color={BLUE_GLOW} opacity={0.13} />
      <Glow position={[3.1, 1.3, -4.4]} size={[10, 7]} color={MAG_GLOW} opacity={0.17} />

      {/* obsidian floor: glossy, with a blurred real reflection on capable devices */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]} raycast={() => null}>
        <planeGeometry args={[60, 60]} />
        {reflective ? (
          <MeshReflectorMaterial
            color="#171a23"
            metalness={0.3}
            roughness={0.5}
            envMapIntensity={0.12}
            resolution={512}
            blur={[480, 180]}
            mixBlur={1.6}
            mixStrength={3.2}
            mirror={1}
            depthScale={1.1}
            minDepthThreshold={0.3}
            maxDepthThreshold={1.5}
          />
        ) : (
          <meshStandardMaterial color="#06070b" metalness={0.85} roughness={0.32} envMapIntensity={0.12} />
        )}
      </mesh>
      <Glow position={[-3, FLOOR_Y + 0.006, 0.4]} size={[9, 6]} color={BLUE} opacity={0.1} rotation={[-Math.PI / 2, 0, 0]} />
      <Glow position={[3.4, FLOOR_Y + 0.006, 0.8]} size={[8, 5]} color={MAGENTA} opacity={0.12} rotation={[-Math.PI / 2, 0, 0]} />

      <Contact x={-3.2} z={0} w={6} d={3.2} />
      <Contact x={0.5} z={1.9} w={5} d={2.4} o={0.6} />
      <Contact x={2.1} z={-1.7} w={4.6} d={2.4} o={0.55} />
      <Contact x={3.8} z={2.1} w={1.9} d={1.6} o={0.6} />
    </>
  );
}
