import { useEffect, useMemo, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { useLounge } from "../../LoungeContext";
import type { StationId } from "../../stations";

/**
 * Shared pointer behaviour for a station prop: click flies the camera there, hover swaps the
 * cursor. Hover/active state lives in refs (read inside useFrame) so nothing re-renders per frame.
 */
export const useStationInteraction = (id: StationId) => {
  const { goTo, station, reducedMotion } = useLounge();
  const hovered = useRef(false);
  const active = useRef(station === id);
  const reduced = useRef(reducedMotion);
  useEffect(() => {
    active.current = station === id;
    reduced.current = reducedMotion;
  }, [station, id, reducedMotion]);

  useEffect(
    () => () => {
      if (hovered.current) document.body.style.cursor = "auto";
    },
    [],
  );

  const handlers = useMemo(
    () => ({
      onClick: (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        goTo(id);
      },
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        hovered.current = true;
        document.body.style.cursor = "pointer";
      },
      onPointerOut: () => {
        hovered.current = false;
        document.body.style.cursor = "auto";
      },
    }),
    [goTo, id],
  );

  return { handlers, hovered, active, reduced };
};
