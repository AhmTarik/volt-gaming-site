/** Same shape as `RoomSpecs` in src/pages/UltraRooms.tsx (kept structural so the page needn't export it). */
export interface SetupSpecs {
  cpu: string;
  gpu: string;
  ram: string;
  monitor: string;
  keyboard: string;
  mouse: string;
  chair: string;
}

export type PartId = "case" | "gpu" | "monitor" | "keyboard" | "mouse";
