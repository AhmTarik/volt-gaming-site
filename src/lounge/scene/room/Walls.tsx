import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { InstancedMesh, Object3D, RepeatWrapping } from "three";
import { COLORS } from "../../stations";
import { makeCanvasTexture } from "./canvasTexture";
import { neonMaterial } from "./neon";

const H = 8.5;
const Z0 = -10;
const Z1 = 13;
const SLATS = 62;

const usePanelTexture = (rx: number, ry: number) => {
  const tex = useMemo(() => {
    const { tex } = makeCanvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = "#161926";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.02})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 1 + Math.random() * 6);
      }
      ctx.strokeStyle = "#080a11";
      ctx.lineWidth = 5;
      ctx.strokeRect(0, 0, w, h);
      ctx.strokeStyle = "#252a3b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, h - 8);
      ctx.lineTo(8, 8);
      ctx.lineTo(w - 8, 8);
      ctx.stroke();
    });
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(rx, ry);
    return tex;
  }, [rx, ry]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
};

/** Backlit acoustic slats: dark vertical fins over a glowing wall, so light leaks through the gaps. */
const Slats = ({ side, glow }: { side: 1 | -1; glow: string }) => {
  const ref = useRef<InstancedMesh>(null);
  const glowMat = useMemo(() => neonMaterial(glow, glow === COLORS.cyan ? 1.5 : 2.6), [glow]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new Object3D();
    for (let i = 0; i < SLATS; i++) {
      o.position.set(side * 13.88, 3.65, Z0 + 0.4 + i * 0.36);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [side]);
  useEffect(() => () => glowMat.dispose(), [glowMat]);
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, SLATS]} receiveShadow>
        <boxGeometry args={[0.1, 6.6, 0.27]} />
        <meshStandardMaterial color="#0e1017" roughness={0.55} metalness={0.5} envMapIntensity={0.6} />
      </instancedMesh>
      <mesh position={[side * 13.95, 3.65, (Z0 + Z1) / 2 - 0.4]} rotation={[0, (-side * Math.PI) / 2, 0]} material={glowMat}>
        <planeGeometry args={[Z1 - Z0 - 1.2, 6.6]} />
      </mesh>
    </group>
  );
};

const Walls = () => {
  const back = usePanelTexture(7, 2.125);
  const side = usePanelTexture(5.75, 2.125);
  const trim = useMemo(() => [neonMaterial(COLORS.cyan), neonMaterial(COLORS.magenta)] as const, []);
  const pylonL = useMemo(() => neonMaterial(COLORS.cyan), []);
  const pylonR = useMemo(() => neonMaterial(COLORS.magenta), []);
  useEffect(
    () => () => {
      [...trim, pylonL, pylonR].forEach((m) => m.dispose());
    },
    [trim, pylonL, pylonR],
  );

  return (
    <group>
      {/* back wall z = -10 */}
      <mesh position={[0, H / 2, Z0]} receiveShadow>
        <planeGeometry args={[28, H]} />
        <meshStandardMaterial map={back} roughness={0.72} metalness={0.35} envMapIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.16, Z0 + 0.05]}>
        <boxGeometry args={[28, 0.32, 0.1]} />
        <meshStandardMaterial color="#0a0b11" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.36, Z0 + 0.06]} material={trim[0]}>
        <boxGeometry args={[28, 0.045, 0.03]} />
      </mesh>
      <mesh position={[0, 7.75, Z0 + 0.06]} material={trim[1]}>
        <boxGeometry args={[28, 0.05, 0.03]} />
      </mesh>

      {/* side walls x = +-14 */}
      <mesh position={[-14, H / 2, (Z0 + Z1) / 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[Z1 - Z0, H]} />
        <meshStandardMaterial map={side} roughness={0.72} metalness={0.35} envMapIntensity={0.5} />
      </mesh>
      <mesh position={[14, H / 2, (Z0 + Z1) / 2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[Z1 - Z0, H]} />
        <meshStandardMaterial map={side} roughness={0.72} metalness={0.35} envMapIntensity={0.5} />
      </mesh>
      <Slats side={-1} glow={COLORS.purple} />
      <Slats side={1} glow={COLORS.magenta} />

      {/* front pylons frame the overview shot */}
      <mesh position={[-13.55, 3.7, 12.7]} material={pylonL}>
        <boxGeometry args={[0.1, 7.4, 0.1]} />
      </mesh>
      <mesh position={[13.55, 3.7, 12.7]} material={pylonR}>
        <boxGeometry args={[0.1, 7.4, 0.1]} />
      </mesh>
    </group>
  );
};

export default Walls;
