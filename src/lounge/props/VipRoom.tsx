import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import { COLORS, STATIONS } from "../stations";
import { BODY_FONT, HEADING_FONT, loadBrandFonts, makeCanvasTexture } from "../scene/room/canvasTexture";
import { createScreenMaterial } from "../scene/room/ScreenMaterial";
import { measureNeon } from "../scene/room/glyphs";
import { neonMaterial } from "../scene/room/neon";
import { useStationInteraction } from "../scene/room/interaction";
import NeonSign from "../scene/room/NeonSign";
import GlowPlane from "../scene/room/GlowPlane";
import { useLounge } from "../LoungeContext";

/*
 * Local frame: origin = STATIONS.rooms.anchor (-10,0,-7).
 * Room spans x [-3.6, 3.6], z [-2.8, 2.8] (world x -13.6..-6.4, z -9.8..-4.2).
 * Back wall (z=-2.8) and left wall (x=-3.6) are the lounge walls; the +z and +x sides are glass.
 * Door gap in the +x side, z [0.4, 1.6] (faces the floor lane that ends at world x=-6.35).
 */
const X0 = -3.6;
const X1 = 3.6;
const Z0 = -2.8;
const Z1 = 2.8;
const GLASS_H = 3.3;
const TOP = 3.9;
const DOOR: [number, number] = [0.4, 1.6];

/** The four Ultra rooms from src/pages/UltraRooms.tsx, drawn as a lobby on the TV. */
const ROOMS = [
  { name: "ULTRA ROOM 1", pcs: 5 },
  { name: "ULTRA ROOM 2", pcs: 12 },
  { name: "ULTRA ROOM 3", pcs: 5 },
  { name: "ULTRA ROOM 4", pcs: 5 },
];

const drawTv = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.fillStyle = "#05060b";
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, h, w, 0);
  g.addColorStop(0, "#ff007f38");
  g.addColorStop(0.5, "#05060b00");
  g.addColorStop(1, "#00f0ff30");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 92px ${HEADING_FONT}`;
  ctx.fillText("ULTRA ROOMS", 64, 150);
  ctx.fillStyle = "#cfd5e6";
  ctx.font = `600 38px ${BODY_FONT}`;
  ctx.fillText("Book your session", 68, 204);
  const tw = (w - 128 - 3 * 24) / 4;
  ROOMS.forEach((r, i) => {
    const x = 64 + i * (tw + 24);
    const y = 280;
    ctx.fillStyle = "#ffffff12";
    ctx.beginPath();
    ctx.roundRect(x, y, tw, 190, 14);
    ctx.fill();
    ctx.strokeStyle = i === 1 ? "#00f0ff" : "#ffffff33";
    ctx.lineWidth = i === 1 ? 4 : 2;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 24px ${HEADING_FONT}`;
    ctx.fillText(r.name, x + 20, y + 62);
    ctx.fillStyle = i === 1 ? "#00f0ff" : "#cfd5e6";
    ctx.font = `800 70px ${HEADING_FONT}`;
    ctx.fillText(String(r.pcs), x + 20, y + 142);
    ctx.font = `600 30px ${BODY_FONT}`;
    ctx.fillText("PCs", x + 20 + ctx.measureText(String(r.pcs)).width + 14, y + 142);
  });
};

const VipRoom = () => {
  const { reducedMotion } = useLounge();
  const [ax, ay, az] = STATIONS.rooms.anchor;

  const mats = useMemo(
    () => ({
      cyan: neonMaterial(COLORS.cyan),
      magenta: neonMaterial(COLORS.magenta),
      purple: neonMaterial(COLORS.purple),
      glass: new MeshPhysicalMaterial({
        color: "#a8d8ff",
        transparent: true,
        opacity: 0.11,
        roughness: 0.04,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        envMapIntensity: 2.2,
        side: DoubleSide,
        depthWrite: false,
      }),
      frame: new MeshStandardMaterial({ color: "#10121a", roughness: 0.35, metalness: 0.9, envMapIntensity: 0.9 }),
      carpet: new MeshStandardMaterial({ color: "#0d0f17", roughness: 1, metalness: 0 }),
      leather: new MeshStandardMaterial({ color: "#1b1c27", roughness: 0.42, metalness: 0.05, envMapIntensity: 0.9 }),
      matte: new MeshStandardMaterial({ color: "#0e1017", roughness: 0.55, metalness: 0.5, envMapIntensity: 0.7 }),
      glassTop: new MeshPhysicalMaterial({ color: "#0b1018", roughness: 0.05, metalness: 0.2, clearcoat: 1, envMapIntensity: 1.8 }),
    }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  const hoverMats = useMemo(() => [mats.cyan, mats.magenta, mats.purple], [mats]);
  const handlers = useStationInteraction("rooms", hoverMats);

  const tv = useMemo(() => makeCanvasTexture(1024, 576, drawTv), []);
  const tvMat = useMemo(() => createScreenMaterial(tv.tex, tv.tex, 0.9, 1), [tv]);
  useEffect(() => {
    let live = true;
    loadBrandFonts().then(() => {
      if (!live) return;
      drawTv(tv.ctx, 1024, 576);
      tv.tex.needsUpdate = true;
    });
    return () => {
      live = false;
    };
  }, [tv]);
  useEffect(() => {
    tvMat.uniforms.uScan.value = reducedMotion ? 0 : 1;
  }, [reducedMotion, tvMat]);
  useEffect(
    () => () => {
      tv.tex.dispose();
      tvMat.dispose();
    },
    [tv, tvMat],
  );
  // slow refresh sweep only; frozen under reduced motion
  useFrame((_, dt) => {
    if (!reducedMotion) tvMat.uniforms.uTime.value += Math.min(dt, 0.1);
  });

  const SH = 0.52;
  const vipW = measureNeon("VIP", SH);
  const ultraW = measureNeon("ULTRA", SH);
  const sgap = 0.55;
  const sTotal = vipW + sgap + ultraW;
  const vipX = -sTotal / 2 + vipW / 2;
  const ultraX = sTotal / 2 - ultraW / 2;
  const divX = -sTotal / 2 + vipW + sgap / 2;

  // glass panes: front (z=Z1) split by mullions, right (x=X1) split around the door
  const front = [-3.6, -1.2, 1.2, 3.6];
  const right: [number, number][] = [
    [Z0, DOOR[0]],
    [DOOR[1], Z1],
  ];

  return (
    <group position={[ax, ay, az]} {...handlers}>
      {/* hit volume */}
      <mesh position={[0, 1.95, 0]}>
        <boxGeometry args={[7.2, 3.9, 5.6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      {/* carpet slab + floor outline */}
      <mesh position={[0, 0.02, 0]} material={mats.carpet} receiveShadow>
        <boxGeometry args={[7.2, 0.04, 5.6]} />
      </mesh>
      <mesh position={[0, 0.045, Z1 - 0.04]} material={mats.magenta}>
        <boxGeometry args={[7.2, 0.012, 0.05]} />
      </mesh>
      <mesh position={[X1 - 0.04, 0.045, (Z0 + DOOR[0]) / 2]} material={mats.magenta}>
        <boxGeometry args={[0.05, 0.012, DOOR[0] - Z0]} />
      </mesh>
      <mesh position={[X1 - 0.04, 0.045, (DOOR[1] + Z1) / 2]} material={mats.magenta}>
        <boxGeometry args={[0.05, 0.012, Z1 - DOOR[1]]} />
      </mesh>
      <mesh position={[0, 0.045, Z0 + 0.04]} material={mats.cyan}>
        <boxGeometry args={[7.2, 0.012, 0.05]} />
      </mesh>
      <mesh position={[X0 + 0.04, 0.045, 0]} material={mats.cyan}>
        <boxGeometry args={[0.05, 0.012, 5.6]} />
      </mesh>

      {/* glass partitions */}
      {front.slice(0, -1).map((x, i) => (
        <mesh key={`f${i}`} position={[(x + front[i + 1]) / 2, 0.05 + GLASS_H / 2, Z1]} material={mats.glass}>
          <boxGeometry args={[front[i + 1] - x - 0.08, GLASS_H, 0.02]} />
        </mesh>
      ))}
      {right.map(([a, b], i) => (
        <mesh key={`r${i}`} position={[X1, 0.05 + GLASS_H / 2, (a + b) / 2]} material={mats.glass}>
          <boxGeometry args={[0.02, GLASS_H, b - a - 0.08]} />
        </mesh>
      ))}

      {/* frame: posts, rails, canopy */}
      {[...front.map((x) => [x, Z1] as [number, number]), [X1, Z0], [X1, DOOR[0]], [X1, DOOR[1]], [X0, Z1]].map(([x, z], i) => (
        <mesh key={`p${i}`} position={[x, TOP / 2, z]} material={mats.frame} castShadow>
          <boxGeometry args={[0.1, TOP, 0.1]} />
        </mesh>
      ))}
      <mesh position={[0, GLASS_H + 0.1, Z1]} material={mats.frame}>
        <boxGeometry args={[7.3, 0.12, 0.12]} />
      </mesh>
      <mesh position={[X1, GLASS_H + 0.1, 0]} material={mats.frame}>
        <boxGeometry args={[0.12, 0.12, 5.7]} />
      </mesh>
      <mesh position={[0, 0.07, Z1]} material={mats.frame}>
        <boxGeometry args={[7.3, 0.08, 0.1]} />
      </mesh>
      {/* canopy frame (open: the overview camera must see in) */}
      <mesh position={[0, TOP, Z1]} material={mats.frame}>
        <boxGeometry args={[7.3, 0.1, 0.1]} />
      </mesh>
      <mesh position={[X1, TOP, 0]} material={mats.frame}>
        <boxGeometry args={[0.1, 0.1, 5.7]} />
      </mesh>
      <mesh position={[X0 + 0.05, TOP, 0]} material={mats.frame}>
        <boxGeometry args={[0.1, 0.1, 5.6]} />
      </mesh>
      <mesh position={[0, TOP, Z0 + 0.05]} material={mats.frame}>
        <boxGeometry args={[7.2, 0.1, 0.1]} />
      </mesh>
      <mesh position={[0, TOP, 0]} material={mats.frame}>
        <boxGeometry args={[7.2, 0.06, 0.06]} />
      </mesh>

      {/* neon outlining the room: top rails (cyan), corner and door posts (magenta), cove along the walls (violet) */}
      <mesh position={[0, GLASS_H + 0.03, Z1 - 0.01]} material={mats.cyan}>
        <boxGeometry args={[7.2, 0.035, 0.035]} />
      </mesh>
      <mesh position={[X1 - 0.01, GLASS_H + 0.03, 0]} material={mats.cyan}>
        <boxGeometry args={[0.035, 0.035, 5.6]} />
      </mesh>
      {([[X1, Z1], [X1, DOOR[0]], [X1, DOOR[1]]] as [number, number][]).map(([x, z], i) => (
        <mesh key={`n${i}`} position={[x + 0.06, GLASS_H / 2 + 0.05, z + (i === 0 ? 0.06 : 0)]} material={mats.magenta}>
          <boxGeometry args={[0.025, GLASS_H, 0.025]} />
        </mesh>
      ))}
      <mesh position={[0, TOP - 0.07, Z0 + 0.12]} material={mats.purple}>
        <boxGeometry args={[7.0, 0.03, 0.03]} />
      </mesh>
      <mesh position={[X0 + 0.12, TOP - 0.07, 0]} material={mats.purple}>
        <boxGeometry args={[0.03, 0.03, 5.4]} />
      </mesh>

      {/* TV on the back wall, with a bias-light outline */}
      <group position={[0, 1.85, Z0 + 0.06]}>
        <mesh material={mats.frame} castShadow>
          <boxGeometry args={[3.4, 1.96, 0.08]} />
        </mesh>
        <mesh position={[0, 0, 0.045]} material={tvMat}>
          <planeGeometry args={[3.3, 1.86]} />
        </mesh>
        <mesh position={[0, 1.02, 0.01]} material={mats.magenta}>
          <boxGeometry args={[3.5, 0.03, 0.03]} />
        </mesh>
        <mesh position={[0, -1.02, 0.01]} material={mats.magenta}>
          <boxGeometry args={[3.5, 0.03, 0.03]} />
        </mesh>
      </group>

      {/* VIP | ULTRA sign */}
      <group position={[0, 3.3, Z0 + 0.1]}>
        <NeonSign text="VIP" height={SH} material={mats.magenta} position={[vipX, 0, 0]} />
        <mesh position={[divX, 0, 0]} material={mats.purple}>
          <boxGeometry args={[0.04, SH * 1.1, 0.04]} />
        </mesh>
        <NeonSign text="ULTRA" height={SH} material={mats.cyan} flicker={3} position={[ultraX, 0, 0]} />
      </group>

      {/* media unit: soundbar, console, controller */}
      <mesh position={[0, 0.27, Z0 + 0.3]} material={mats.matte} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.46, 0.45]} />
      </mesh>
      <mesh position={[0, 0.07, Z0 + 0.55]} material={mats.cyan}>
        <boxGeometry args={[3.2, 0.025, 0.025]} />
      </mesh>
      <mesh position={[0, 0.54, Z0 + 0.28]} material={mats.frame} castShadow>
        <boxGeometry args={[2.0, 0.07, 0.1]} />
      </mesh>
      <group position={[1.2, 0.5, Z0 + 0.3]}>
        <RoundedBox args={[0.46, 0.08, 0.32]} radius={0.03} smoothness={3} position={[0, 0.04, 0]} castShadow>
          <meshStandardMaterial color="#0a0b10" roughness={0.3} metalness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0.042, 0.165]} material={mats.cyan}>
          <boxGeometry args={[0.3, 0.012, 0.01]} />
        </mesh>
      </group>

      {/* coffee table: smoked glass, controllers, glow pool on the carpet */}
      <group position={[0, 0, -0.9]}>
        <mesh position={[0, 0.4, 0]} material={mats.glassTop} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.04, 0.85]} />
        </mesh>
        {([-1, 1] as const).flatMap((sx) =>
          ([-1, 1] as const).map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx * 0.78, 0.21, sz * 0.36]} material={mats.frame}>
              <boxGeometry args={[0.05, 0.36, 0.05]} />
            </mesh>
          )),
        )}
        <mesh position={[0, 0.07, 0]} material={mats.magenta}>
          <boxGeometry args={[1.5, 0.02, 0.02]} />
        </mesh>
        {([[-0.3, 0.1, 0.25, "magenta"], [0.28, -0.1, -0.35, "cyan"]] as const).map(([x, z, r, c], i) => (
          <group key={i} position={[x, 0.435, z]} rotation={[0, r, 0]}>
            <RoundedBox args={[0.17, 0.035, 0.1]} radius={0.015} smoothness={3} castShadow>
              <meshStandardMaterial color="#0b0c12" roughness={0.4} metalness={0.3} />
            </RoundedBox>
            <mesh position={[0, 0.02, -0.04]} material={mats[c]}>
              <boxGeometry args={[0.06, 0.006, 0.006]} />
            </mesh>
          </group>
        ))}
      </group>
      <GlowPlane color={COLORS.magenta} size={[3.4, 2.6]} opacity={0.3} position={[0, 0.052, -0.9]} rotation={[-Math.PI / 2, 0, 0]} />

      {/* sofa facing the TV (viewer sees its back, as a player would over the shoulder) */}
      <group position={[0, 0, 1.0]}>
        <RoundedBox args={[3.3, 0.3, 1.0]} radius={0.05} smoothness={3} position={[0, 0.2, 0]} material={mats.leather} castShadow receiveShadow />
        {[-1.05, 0, 1.05].map((x) => (
          <RoundedBox key={x} args={[1.0, 0.16, 0.78]} radius={0.06} smoothness={3} position={[x, 0.43, -0.08]} material={mats.leather} castShadow receiveShadow />
        ))}
        <RoundedBox args={[3.3, 0.62, 0.24]} radius={0.08} smoothness={3} position={[0, 0.66, 0.42]} material={mats.leather} castShadow receiveShadow />
        {[-1.05, 0, 1.05].map((x) => (
          <RoundedBox key={x} args={[0.98, 0.5, 0.14]} radius={0.06} smoothness={3} position={[x, 0.68, 0.27]} rotation={[-0.16, 0, 0]} material={mats.leather} castShadow />
        ))}
        {([-1, 1] as const).map((s) => (
          <RoundedBox key={s} args={[0.26, 0.48, 1.0]} radius={0.07} smoothness={3} position={[s * 1.55, 0.44, 0]} material={mats.leather} castShadow receiveShadow />
        ))}
        {/* piping along the backrest top + base underglow */}
        <mesh position={[0, 0.98, 0.42]} material={mats.magenta}>
          <boxGeometry args={[3.0, 0.025, 0.025]} />
        </mesh>
        <mesh position={[0, 0.05, 0.5]} material={mats.cyan}>
          <boxGeometry args={[3.2, 0.02, 0.02]} />
        </mesh>
      </group>

      {/* poufs */}
      {([-2.5, 2.5] as const).map((x) => (
        <group key={x} position={[x, 0, -0.4]}>
          <mesh position={[0, 0.2, 0]} material={mats.leather} castShadow receiveShadow>
            <cylinderGeometry args={[0.34, 0.36, 0.4, 28]} />
          </mesh>
          <mesh position={[0, 0.405, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.purple}>
            <ringGeometry args={[0.3, 0.32, 40]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default VipRoom;
