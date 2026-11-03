import { useEffect, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { MeshBasicMaterial } from "three";
import { useLounge } from "../../LoungeContext";
import type { StationId } from "../../stations";
import { setNeon } from "./neon";

/**
 * Click / hover wiring shared by the station props: pointer cursor, goTo(id),
 * and a soft brightness lift on the prop's neon materials while hovered.
 */
export const useStationInteraction = (id: StationId, neon: MeshBasicMaterial[] = [], boost = 0.65) => {
  const { goTo } = useLounge();
  const target = useRef(0);
  const k = useRef(0);

  useEffect(
    () => () => {
      document.body.style.cursor = "auto";
    },
    [],
  );

  useFrame((_, dt) => {
    if (k.current === target.current) return;
    const diff = target.current - k.current;
    k.current = Math.abs(diff) < 0.003 ? target.current : k.current + diff * Math.min(1, dt * 9);
    for (const m of neon) setNeon(m, 1 + boost * k.current);
  });

  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      goTo(id);
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      target.current = 1;
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      target.current = 0;
      document.body.style.cursor = "auto";
    },
  };
};
