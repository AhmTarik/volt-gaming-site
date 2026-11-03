import { useCallback, useEffect, useRef } from "react";
import { MotionConfig } from "framer-motion";
import { useLounge } from "../LoungeContext";
import { STATION_ORDER, STATIONS } from "../stations";
import { useBookingState } from "./booking";
import type { SetupId } from "./content";
import Loader from "./Loader";
import { useLoungeReady } from "./useLoungeReady";
import StationPanel from "./StationPanel";
import TopNav from "./TopNav";

const isTypingTarget = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName));
};

/**
 * 2D overlay for the 3D lounge: navigation, station panels and loader.
 * The root ignores pointer events so the Canvas stays clickable; interactive children opt back in.
 */
const Hud = () => {
  const { station, goTo, reducedMotion } = useLounge();
  const { ready, progress } = useLoungeReady();
  const booking = useBookingState();
  const uiRef = useRef<HTMLDivElement>(null);
  const { update } = booking;

  // Everything behind the loader is unreachable (tab order and screen readers) until the lounge is ready.
  useEffect(() => {
    const el = uiRef.current;
    if (!el) return;
    if (ready) el.removeAttribute("inert");
    else el.setAttribute("inert", "");
  }, [ready]);

  const bookSetup = useCallback(
    (setup: SetupId) => {
      update("setup", setup);
      goTo("booking");
    },
    [update, goTo],
  );

  // Keyboard travel: ArrowLeft / ArrowRight and 1-6. Ignored while typing in form fields.
  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || isTypingTarget(e.target)) return;
      const i = STATION_ORDER.indexOf(station);
      let next: number | null = null;
      if (e.key === "ArrowRight") next = i + 1;
      else if (e.key === "ArrowLeft") next = i - 1;
      else if (/^[1-9]$/.test(e.key)) next = Number(e.key) - 1;
      if (next === null || next < 0 || next >= STATION_ORDER.length || next === i) return;
      e.preventDefault();
      goTo(STATION_ORDER[next]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, station, goTo]);

  const position = STATION_ORDER.indexOf(station) + 1;

  return (
    <MotionConfig reducedMotion="user">
      <div className="pointer-events-none absolute inset-0 z-10 font-body text-slate-100">
        <h1 className="sr-only">Volt Gaming Center, interactive 3D gaming lounge</h1>

        {/* Announces the current station for screen-reader users (the Canvas is decorative). */}
        <p role="status" aria-live="polite" className="sr-only">
          {ready ? `${STATIONS[station].label}, station ${position} of ${STATION_ORDER.length}` : "Loading the lounge"}
        </p>

        <div ref={uiRef} className="pointer-events-none absolute inset-0">
          <TopNav />
          {ready && <StationPanel booking={booking} bookSetup={bookSetup} />}

          {/* Desktop-only hint; the mobile sheet already occupies the bottom edge. */}
          {ready && (
            <p className="pointer-events-none absolute bottom-6 left-6 hidden whitespace-nowrap rounded-full border border-white/10 bg-volt-bg/85 px-4 py-2 text-base text-slate-200 lg:block">
              Click objects in the room, or press{" "}
              <kbd className="rounded border border-white/30 px-1.5 font-heading text-xs text-volt-cyan">←</kbd>{" "}
              <kbd className="rounded border border-white/30 px-1.5 font-heading text-xs text-volt-cyan">→</kbd> or{" "}
              <kbd className="rounded border border-white/30 px-1.5 font-heading text-xs text-volt-cyan">1</kbd>
              –
              <kbd className="rounded border border-white/30 px-1.5 font-heading text-xs text-volt-cyan">{STATION_ORDER.length}</kbd>
              .
            </p>
          )}
        </div>

        <Loader ready={ready} progress={progress} reducedMotion={reducedMotion} />
      </div>
    </MotionConfig>
  );
};

export default Hud;
