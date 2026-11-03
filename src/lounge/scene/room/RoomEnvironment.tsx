import { Component, Suspense, type ReactNode } from "react";
import { Environment, Lightformer } from "@react-three/drei";

/** Local, network-free stand-in used if the CDN HDRI fails to load. */
const LocalNight = () => (
  <Environment resolution={128} background={false} environmentIntensity={0.45}>
    <Lightformer form="rect" intensity={2} color="#00f0ff" position={[-8, 4, -6]} scale={[10, 3, 1]} />
    <Lightformer form="rect" intensity={2.4} color="#ff007f" position={[8, 3, -4]} scale={[10, 3, 1]} />
    <Lightformer form="rect" intensity={0.8} color="#8b5cf6" position={[0, 8, 4]} rotation={[Math.PI / 2, 0, 0]} scale={[14, 6, 1]} />
  </Environment>
);

class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * preset="night" is fetched from a CDN at runtime. It gets its own Suspense so the room
 * does not wait on it, and an error boundary so an offline visitor still gets reflections.
 */
const RoomEnvironment = () => (
  <Boundary fallback={<LocalNight />}>
    <Suspense fallback={null}>
      <Environment preset="night" background={false} environmentIntensity={0.4} />
    </Suspense>
  </Boundary>
);

export default RoomEnvironment;
