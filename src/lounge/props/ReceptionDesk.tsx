import { useEffect, useMemo } from "react";
import { MeshStandardMaterial, type Material } from "three";
import { RoundedBox } from "@react-three/drei";
import { COLORS, STATIONS } from "../stations";
import { BODY_FONT, HEADING_FONT, loadBrandFonts, makeCanvasTexture, wrapLines } from "../scene/room/canvasTexture";
import { createScreenMaterial } from "../scene/room/ScreenMaterial";
import { measureNeon } from "../scene/room/glyphs";
import { neonMaterial } from "../scene/room/neon";
import { useStationInteraction } from "../scene/room/interaction";
import NeonSign from "../scene/room/NeonSign";
import GlowPlane from "../scene/room/GlowPlane";

const DESK_H = 1.05;
const DEPTH = 1.1;
const CENTER_W = 3.4;
const WING_W = 1.6;
const WING_ANGLE = 0.3; // wings sweep toward the visitor

/** Booking tablet face: real copy from BookingSection. */
const drawTablet = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.fillStyle = "#06070d";
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#00f0ff30");
  g.addColorStop(1, "#ff007f30");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 54px ${HEADING_FONT}`;
  ctx.fillText("BOOK YOUR", 56, 130);
  ctx.fillText("SESSION", 56, 196);
  ctx.fillStyle = "#cfd5e6";
  ctx.font = `600 38px ${BODY_FONT}`;
  wrapLines(ctx, "Reserve your spot and start gaming.", w - 112).forEach((l, i) => ctx.fillText(l, 56, 262 + i * 44));
  ctx.fillStyle = "#00f0ff";
  ctx.beginPath();
  ctx.roundRect(56, h - 140, w - 112, 84, 14);
  ctx.fill();
  ctx.fillStyle = "#04060a";
  ctx.font = `800 34px ${HEADING_FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("BOOK NOW", w / 2, h - 86);
};

const Segment = ({
  width,
  top,
  body,
  edge,
  under,
  rib,
  ribs,
}: {
  width: number;
  top: Material;
  body: Material;
  edge: Material;
  under: Material;
  rib: Material;
  ribs?: boolean;
}) => (
  <group>
    <mesh position={[0, (DESK_H - 0.06) / 2, 0]} material={body} castShadow receiveShadow>
      <boxGeometry args={[width, DESK_H - 0.06, DEPTH - 0.1]} />
    </mesh>
    <mesh position={[0, DESK_H - 0.03, 0.02]} material={top} castShadow receiveShadow>
      <boxGeometry args={[width + 0.06, 0.06, DEPTH + 0.06]} />
    </mesh>
    {/* lit lip under the top, front edge */}
    <mesh position={[0, DESK_H - 0.09, DEPTH / 2 - 0.02]} material={edge}>
      <boxGeometry args={[width, 0.035, 0.035]} />
    </mesh>
    {/* kick-plate glow */}
    <mesh position={[0, 0.1, DEPTH / 2 - 0.045]} material={under}>
      <boxGeometry args={[width - 0.1, 0.03, 0.03]} />
    </mesh>
    {ribs &&
      Array.from({ length: Math.floor(width / 0.16) }, (_, i) => (
        <mesh key={i} position={[(i - (Math.floor(width / 0.16) - 1) / 2) * 0.16, DESK_H / 2 - 0.03, DEPTH / 2 - 0.01]} material={rib}>
          <boxGeometry args={[0.04, DESK_H - 0.4, 0.05]} />
        </mesh>
      ))}
  </group>
);

const ReceptionDesk = () => {
  const [ax, ay, az] = STATIONS.booking.anchor;

  const mats = useMemo(
    () => ({
      cyan: neonMaterial(COLORS.cyan),
      magenta: neonMaterial(COLORS.magenta),
    }),
    [],
  );
  const hoverMats = useMemo(() => [mats.cyan, mats.magenta], [mats]);
  useEffect(
    () => () => {
      mats.cyan.dispose();
      mats.magenta.dispose();
    },
    [mats],
  );
  const handlers = useStationInteraction("booking", hoverMats);

  const tablet = useMemo(() => makeCanvasTexture(512, 360, drawTablet), []);
  const tabletMat = useMemo(() => createScreenMaterial(tablet.tex, tablet.tex, 0.9, 0.6), [tablet]);
  useEffect(() => {
    let live = true;
    loadBrandFonts().then(() => {
      if (!live) return;
      drawTablet(tablet.ctx, 512, 360);
      tablet.tex.needsUpdate = true;
    });
    return () => {
      live = false;
    };
  }, [tablet]);
  useEffect(
    () => () => {
      tablet.tex.dispose();
      tabletMat.dispose();
    },
    [tablet, tabletMat],
  );

  const metal = useMemo(
    () => ({
      top: new MeshStandardMaterial({ color: "#07080d", roughness: 0.12, metalness: 0.7, envMapIntensity: 1.4 }),
      body: new MeshStandardMaterial({ color: "#161821", roughness: 0.38, metalness: 0.85, envMapIntensity: 0.9 }),
      rib: new MeshStandardMaterial({ color: "#0a0b11", roughness: 0.3, metalness: 0.9, envMapIntensity: 0.9 }),
    }),
    [],
  );
  useEffect(() => () => Object.values(metal).forEach((m) => m.dispose()), [metal]);
  const seg = { top: metal.top, body: metal.body, rib: metal.rib, edge: mats.cyan, under: mats.magenta };
  const topMat = metal.top;
  const bodyMat = metal.body;

  const hinge = CENTER_W / 2;
  const wingCenter = hinge + (WING_W / 2) * Math.cos(WING_ANGLE);
  const wingZ = (WING_W / 2) * Math.sin(WING_ANGLE);

  // sign layout: bolt + wordmark, centred together
  const SH = 0.6;
  const wordW = measureNeon("VOLT", SH);
  const boltW = measureNeon("*", SH);
  const gap = 0.3;
  const total = boltW + gap + wordW;
  const boltX = -total / 2 + boltW / 2;
  const wordX = total / 2 - wordW / 2;

  return (
    <group position={[ax, ay, az]} {...handlers}>
      {/* invisible hit volume */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[6.8, 2.4, 1.8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      {/* counter: centre + two wings that sweep toward the visitor, hinged on round posts */}
      <Segment width={CENTER_W} ribs {...seg} />
      <group position={[-wingCenter, 0, wingZ]} rotation={[0, WING_ANGLE, 0]}>
        <Segment width={WING_W} {...seg} />
      </group>
      <group position={[wingCenter, 0, wingZ]} rotation={[0, -WING_ANGLE, 0]}>
        <Segment width={WING_W} {...seg} />
      </group>
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * hinge, 0, 0]}>
          <mesh position={[0, (DESK_H - 0.06) / 2, 0]} material={bodyMat} castShadow>
            <cylinderGeometry args={[DEPTH / 2 - 0.04, DEPTH / 2 - 0.04, DESK_H - 0.06, 24]} />
          </mesh>
          <mesh position={[0, DESK_H - 0.03, 0]} material={topMat}>
            <cylinderGeometry args={[DEPTH / 2 + 0.03, DEPTH / 2 + 0.03, 0.06, 24]} />
          </mesh>
        </group>
      ))}

      {/* booking tablet on a weighted stand, facing the visitor */}
      <group position={[-0.9, DESK_H, 0.15]}>
        <mesh position={[0, 0.015, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.19, 0.03, 24]} />
          <meshStandardMaterial color="#0b0c12" roughness={0.3} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.17, -0.05]} rotation={[-0.12, 0, 0]}>
          <boxGeometry args={[0.04, 0.34, 0.03]} />
          <meshStandardMaterial color="#0b0c12" roughness={0.3} metalness={0.9} />
        </mesh>
        <group position={[0, 0.5, 0]} rotation={[-0.32, 0, 0]}>
          <RoundedBox args={[0.78, 0.56, 0.035]} radius={0.025} smoothness={3} castShadow>
            <meshStandardMaterial color="#0b0c12" roughness={0.3} metalness={0.9} />
          </RoundedBox>
          <mesh position={[0, 0, 0.019]} material={tabletMat}>
            <planeGeometry args={[0.7, 0.49]} />
          </mesh>
        </group>
      </group>

      {/* service bell + card terminal */}
      <mesh position={[1.1, DESK_H + 0.04, 0.1]} castShadow>
        <sphereGeometry args={[0.09, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#9aa3b5" roughness={0.18} metalness={1} envMapIntensity={1.6} />
      </mesh>
      <mesh position={[1.1, DESK_H + 0.015, 0.1]}>
        <cylinderGeometry args={[0.11, 0.11, 0.03, 20]} />
        <meshStandardMaterial color="#0b0c12" roughness={0.3} metalness={0.9} />
      </mesh>
      <group position={[0.4, DESK_H, 0.2]} rotation={[0, -0.25, 0]}>
        <RoundedBox args={[0.22, 0.05, 0.3]} radius={0.02} smoothness={3} position={[0, 0.025, 0]} castShadow>
          <meshStandardMaterial color="#0b0c12" roughness={0.35} metalness={0.8} />
        </RoundedBox>
        <mesh position={[0, 0.052, 0.08]}>
          <boxGeometry args={[0.16, 0.004, 0.1]} />
          <meshStandardMaterial color="#05060a" roughness={0.1} metalness={0.4} />
        </mesh>
      </group>

      {/* backdrop: smoked acrylic plate on two posts, VOLT in tube neon with a bolt */}
      <group position={[0, 0, -0.47]}>
        {([-1, 1] as const).map((s) => (
          <mesh key={s} position={[s * 2.0, DESK_H + 0.55, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 1.1, 8]} />
            <meshStandardMaterial color="#0b0c12" roughness={0.3} metalness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 1.78, -0.03]}>
          <boxGeometry args={[4.3, 1.05, 0.03]} />
          <meshPhysicalMaterial color="#05060b" transparent opacity={0.72} roughness={0.15} metalness={0.2} clearcoat={1} envMapIntensity={1.2} />
        </mesh>
        <NeonSign text="*" height={SH} material={mats.magenta} position={[boltX, 1.78, 0.03]} />
        <NeonSign text="VOLT" height={SH} material={mats.cyan} flicker={0} position={[wordX, 1.78, 0.03]} />
      </group>

      {/* neon spill on the floor in front of the counter */}
      <GlowPlane color={COLORS.magenta} size={[6.4, 1.8]} opacity={0.3} position={[0, 0.02, 0.85]} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  );
};

export default ReceptionDesk;
