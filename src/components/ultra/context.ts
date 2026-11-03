import { createContext, useContext } from "react";
import type { PartId } from "./types";

export interface SceneState {
  /** prefers-reduced-motion: no idle float, no fan spin, no passive parallax */
  reduced: boolean;
  hovered: PartId | null;
  /** narrow box: numbered markers in the scene + a DOM legend instead of side callouts */
  compact: boolean;
  /** `from`: only clear if that part is still the hovered one (pointer-out races pointer-over) */
  setHovered: (id: PartId | null, from?: PartId) => void;
}

export const SceneContext = createContext<SceneState>({
  reduced: false,
  hovered: null,
  compact: false,
  setHovered: () => {},
});

export const useScene = () => useContext(SceneContext);
