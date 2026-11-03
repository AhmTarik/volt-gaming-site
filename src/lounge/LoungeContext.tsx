import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { stationFromHash, STATIONS, type StationId } from "./stations";

interface LoungeState {
  station: StationId;
  /** Navigate to a station (updates the URL hash too). */
  goTo: (id: StationId) => void;
  /** True while the camera is moving between stations. Set by CameraRig. */
  transitioning: boolean;
  setTransitioning: (v: boolean) => void;
  /** User prefers reduced motion: camera cuts/short fades instead of flights, no pulsing lights. */
  reducedMotion: boolean;
}

const LoungeContext = createContext<LoungeState | null>(null);

export const LoungeProvider = ({ children }: { children: ReactNode }) => {
  const [station, setStation] = useState<StationId>(() =>
    typeof window === "undefined" ? "home" : stationFromHash(window.location.hash),
  );
  const [transitioning, setTransitioning] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const onHash = () => setStation(stationFromHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goTo = useCallback((id: StationId) => {
    setStation(id);
    const hash = STATIONS[id].hash;
    const url = hash ? `#${hash}` : window.location.pathname + window.location.search;
    window.history.replaceState(null, "", url);
  }, []);

  const value = useMemo(
    () => ({ station, goTo, transitioning, setTransitioning, reducedMotion }),
    [station, goTo, transitioning, reducedMotion],
  );

  return <LoungeContext.Provider value={value}>{children}</LoungeContext.Provider>;
};

export const useLounge = () => {
  const ctx = useContext(LoungeContext);
  if (!ctx) throw new Error("useLounge must be used inside <LoungeProvider>");
  return ctx;
};
