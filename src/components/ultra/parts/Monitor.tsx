import { useEffect, useMemo } from "react";
import { AdditiveBlending, Color, MeshBasicMaterial } from "three";
import { GeoBuilder, hdr } from "../geo";
import { getRadialMap, getScreenMap, makeMats, PALETTE } from "../materials";
import { Float } from "../Part";
import { SpecLabel } from "../SpecLabel";

const METAL = "#4a5060";
const METAL_LIGHT = "#8a93a6";

/** 27in-class esports monitor, 16:9, thin bezel. Panel faces +Z; neck + foot slid down, back shell slid back. */
export function Monitor({ label }: { label: { category: string; value: string } }) {
  const mats = useMemo(() => ({ panel: makeMats(), stand: makeMats(), back: makeMats() }), []);
  const geo = useMemo(() => {
    const P = new GeoBuilder();
    const M = new GeoBuilder();
    P.rbox(3.2, 1.82, 0.07, 0.04, { color: "#0a0b11" });
    M.box(3.2, 0.012, 0.072, { pos: [0, 0.91, 0], color: METAL });
    const B = new GeoBuilder();
    const BM = new GeoBuilder();
    B.rbox(3.1, 1.7, 0.18, 0.07, { color: "#0c0e14" });
    BM.rbox(0.62, 0.62, 0.03, 0.02, { pos: [0, 0, -0.1], color: METAL });
    BM.rbox(1.0, 0.04, 0.032, 0.015, { pos: [0, 0.62, -0.1], color: METAL_LIGHT });
    const S = new GeoBuilder();
    const SG = new GeoBuilder();
    S.rbox(0.26, 1.1, 0.1, 0.04, { color: METAL });
    const F = new GeoBuilder();
    F.rbox(1.45, 0.06, 0.92, 0.035, { color: METAL });
    SG.box(1.25, 0.014, 0.014, { pos: [0, 0.0, 0.47], color: hdr(PALETTE.magenta, 3.4) });
    return { panel: P.build(), panelM: M.build(), back: B.build(), backM: BM.build(), neck: S.build(), foot: F.build(), footGlow: SG.build() };
  }, []);
  const screen = useMemo(() => new MeshBasicMaterial({ map: getScreenMap(), toneMapped: false, color: new Color(1.05, 1.05, 1.05) }), []);
  const halo = useMemo(() => {
    const m = new MeshBasicMaterial({
      map: getRadialMap(),
      color: hdr(PALETTE.magenta, 1.1),
      transparent: true,
      opacity: 0.55,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    m.userData.noHover = true;
    return m;
  }, []);
  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.all.forEach((x) => x.dispose()));
      screen.dispose();
      halo.dispose();
    },
    [mats, screen, halo],
  );

  return (
    <group>
      <mesh position={[0.2, -0.1, -1.1]} material={halo} renderOrder={-1}>
        <planeGeometry args={[7.2, 4.6]} />
      </mesh>

      <mesh geometry={geo.panel} material={mats.panel.plastic} />
      <mesh geometry={geo.panelM} material={mats.panel.metal} />
      <mesh position={[0, 0, 0.0365]} material={screen}>
        <planeGeometry args={[3.12, 1.74]} />
      </mesh>

      <Float position={[0, 0, -0.62]} amp={0.03} speed={0.5} phase={1.6} drift={0.012}>
        <mesh geometry={geo.back} material={mats.back.plastic} />
        <mesh geometry={geo.backM} material={mats.back.metal} />
      </Float>
      <Float position={[0, -1.72, -0.5]} amp={0.035} speed={0.52} phase={2.8} drift={0.015}>
        <mesh geometry={geo.neck} material={mats.stand.metal} />
      </Float>
      <Float position={[0, -2.62, -0.25]} amp={0.03} speed={0.46} phase={4} drift={0.015}>
        <mesh geometry={geo.foot} material={mats.stand.metal} />
        <mesh geometry={geo.footGlow} material={mats.stand.glow} />
      </Float>

      <SpecLabel index={3} id="monitor" category={label.category} value={label.value} anchor={[1.45, 0.78, 0.04]} elbow={[2.0, 1.45, 0.3]} side="right" />
    </group>
  );
}
