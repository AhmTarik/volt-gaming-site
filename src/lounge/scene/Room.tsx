import Floor from "./room/Floor";
import Walls from "./room/Walls";
import Truss from "./room/Truss";
import FlowLines from "./room/FlowLines";
import RoomEnvironment from "./room/RoomEnvironment";

/**
 * Room shell: polished reflective floor with wayfinding lanes, three walls (front is open and
 * dim), an open ceiling truss with drifting RGB strips, and night-HDRI reflections.
 */
const Room = () => (
  <group>
    <RoomEnvironment />
    <Floor />
    <Walls />
    <Truss />
    <FlowLines />
  </group>
);

export default Room;
