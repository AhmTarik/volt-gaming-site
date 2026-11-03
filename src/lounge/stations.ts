/**
 * Shared contract for the 3D lounge. Every agent/component builds against these values.
 * World units ≈ meters. Floor is y = 0. Room spans x ∈ [-14, 14], z ∈ [-10, 12].
 * Back wall at z = -10. The home camera looks from the front (+z) toward the back wall.
 */
export type Vec3 = [number, number, number];

export type StationId = "home" | "pcs" | "simulator" | "offers" | "rooms" | "booking";

export interface Station {
  id: StationId;
  /** Label shown in the top navigation. */
  label: string;
  /** URL hash used for deep links, e.g. /lounge#pcs */
  hash: string;
  /** Camera position when this station is active (desktop, landscape). */
  camera: Vec3;
  /** Point the camera looks at. */
  target: Vec3;
  /** World-space center of the area the station's props occupy (y = floor). */
  anchor: Vec3;
}

export const COLORS = {
  background: "#0d0f17",
  cyan: "#00f0ff",
  magenta: "#ff007f",
  purple: "#8b5cf6",
  metal: "#1a1d29",
} as const;

export const STATIONS: Record<StationId, Station> = {
  home: {
    id: "home",
    label: "Home",
    hash: "",
    // Below the ceiling truss (y 7.6) so its neon beams don't slice across the overview.
    camera: [0, 6.4, 19.5],
    target: [0, 1.2, -2],
    anchor: [0, 0, 0],
  },
  pcs: {
    id: "pcs",
    label: "Our PCs",
    hash: "pcs",
    camera: [-7, 3.1, 7.2],
    target: [-7, 1.2, 0],
    anchor: [-7, 0, 0],
  },
  simulator: {
    id: "simulator",
    label: "Simulator",
    hash: "simulator",
    camera: [6.9, 2.5, 3.0],
    target: [8.1, 1.0, -1.3],
    anchor: [8, 0, -1],
  },
  offers: {
    id: "offers",
    label: "Offers",
    hash: "offers",
    camera: [1.5, 4, 1.5],
    target: [1.5, 3.9, -9.8],
    anchor: [1.5, 4, -9.9],
  },
  rooms: {
    id: "rooms",
    label: "VIP Rooms",
    hash: "rooms",
    camera: [-6.5, 3, -1.5],
    target: [-10, 1.4, -7],
    anchor: [-10, 0, -7],
  },
  booking: {
    id: "booking",
    label: "Book Now",
    hash: "booking",
    camera: [0, 2.5, 10.5],
    target: [0, 1.1, 5.5],
    anchor: [0, 0, 5.5],
  },
};

/** Navigation order. */
export const STATION_ORDER: StationId[] = ["home", "pcs", "simulator", "offers", "rooms", "booking"];

export const stationFromHash = (hash: string): StationId => {
  const h = hash.replace(/^#/, "");
  return STATION_ORDER.find((id) => STATIONS[id].hash === h && h !== "") ?? "home";
};
