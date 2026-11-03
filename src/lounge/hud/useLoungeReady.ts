import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";

const MIN_VISIBLE_MS = 900; // avoid a flash for near-instant loads
const SETTLE_MS = 350; // loading must stay idle this long (assets load in batches)
const MAX_WAIT_MS = 12000; // never trap the user behind the loader

/**
 * drei's useProgress reports 0% / inactive when nothing goes through the loading manager
 * (e.g. a fully procedural scene), so "ready" can't depend on progress reaching 100.
 * Ready = minimum time elapsed AND the loading manager idle for a moment; latched once true.
 */
export const useLoungeReady = () => {
  const { active, progress } = useProgress();
  const [minElapsed, setMinElapsed] = useState(false);
  const [settled, setSettled] = useState(false);
  const [forced, setForced] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const a = window.setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    const b = window.setTimeout(() => setForced(true), MAX_WAIT_MS);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  useEffect(() => {
    if (active) {
      setSettled(false);
      return;
    }
    const t = window.setTimeout(() => setSettled(true), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [active]);

  useEffect(() => {
    if (forced || (minElapsed && settled)) setReady(true);
  }, [forced, minElapsed, settled]);

  return { ready, progress };
};
