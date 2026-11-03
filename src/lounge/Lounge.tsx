import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { LoungeProvider } from "./LoungeContext";
import { COLORS, STATIONS } from "./stations";
import CameraRig from "./scene/CameraRig";
import Lighting from "./scene/Lighting";
import Effects from "./scene/Effects";
import Room from "./scene/Room";
import UltraPcs from "./props/UltraPcs";
import SimRig from "./props/SimRig";
import VipRoom from "./props/VipRoom";
import WallDisplay from "./props/WallDisplay";
import ReceptionDesk from "./props/ReceptionDesk";
import Hud from "./hud/Hud";

/** Full-screen 3D lounge. The Canvas is the page; the HUD is a DOM overlay on top. */
const Lounge = () => (
  <LoungeProvider>
    <div className="fixed inset-0 overflow-hidden" style={{ background: COLORS.background }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 45, near: 0.1, far: 120, position: STATIONS.home.camera }}
      >
        <color attach="background" args={[COLORS.background]} />
        <fog attach="fog" args={[COLORS.background, 28, 70]} />
        <Suspense fallback={null}>
          <Lighting />
          <Room />
          <UltraPcs />
          <SimRig />
          <VipRoom />
          <WallDisplay />
          <ReceptionDesk />
          <Effects />
        </Suspense>
        <CameraRig />
      </Canvas>
      <Hud />
    </div>
  </LoungeProvider>
);

export default Lounge;
