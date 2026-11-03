import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { useLounge } from "../LoungeContext";
import { STATION_ORDER, STATIONS, type StationId } from "../stations";
import { PANEL_META, type SetupId } from "./content";
import type { BookingState } from "./booking";
import BookingPanel from "./BookingPanel";
import { HomePanel, OffersPanel, PcsPanel, RoomsPanel, SimulatorPanel, type PanelActions } from "./panels";
import { ACCENT, FOCUS, buttonClass } from "./ui";

/** Desktop = side panel (lg+). Below that a bottom sheet. Mirrors Tailwind's `lg` breakpoint. */
const useIsDesktop = () => {
  const query = "(min-width: 1024px)";
  const [match, setMatch] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return match;
};

const neighbour = (station: StationId, delta: -1 | 1): StationId | null =>
  STATION_ORDER[STATION_ORDER.indexOf(station) + delta] ?? null;

/** Prev / next station controls. Icon-only in the mobile sheet header, labelled in the desktop footer. */
const StepButtons = ({ station, goTo, labelled }: { station: StationId; goTo: (id: StationId) => void; labelled?: boolean }) => {
  const prev = neighbour(station, -1);
  // The last station wraps back to Home instead of rendering an empty, disabled button.
  const next = neighbour(station, 1) ?? (station === "home" ? null : "home");
  const wraps = next === "home";
  return (
    <div className={labelled ? "flex items-center justify-between gap-2" : "flex items-center gap-1"}>
      <button
        type="button"
        disabled={!prev}
        onClick={() => prev && goTo(prev)}
        aria-label={prev ? `Previous station: ${STATIONS[prev].label}` : "No previous station"}
        className={buttonClass("ghost", labelled ? "min-w-0 flex-1 justify-start px-2" : "w-11 px-0")}
      >
        <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
        {labelled && prev && <span className="truncate">{STATIONS[prev].label}</span>}
      </button>
      <button
        type="button"
        disabled={!next}
        onClick={() => next && goTo(next)}
        aria-label={next ? `Next station: ${STATIONS[next].label}` : "No next station"}
        className={buttonClass(labelled ? "outline" : "ghost", labelled ? "min-w-0 flex-1 justify-end px-3" : "w-11 px-0")}
      >
        {labelled && next && <span className="truncate">{wraps ? "Back to Home" : `Next: ${STATIONS[next].label}`}</span>}
        <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
      </button>
    </div>
  );
};

interface BodyProps extends PanelActions {
  station: StationId;
  booking: BookingState;
}

const PanelBody = ({ station, booking, ...actions }: BodyProps) => {
  switch (station) {
    case "home":
      return <HomePanel {...actions} />;
    case "pcs":
      return <PcsPanel {...actions} />;
    case "simulator":
      return <SimulatorPanel {...actions} />;
    case "offers":
      return <OffersPanel {...actions} />;
    case "rooms":
      return <RoomsPanel {...actions} />;
    case "booking":
      return <BookingPanel booking={booking} />;
  }
};

const Panel = ({
  station,
  booking,
  desktop,
  goTo,
  bookSetup,
}: BodyProps & { desktop: boolean }) => {
  const meta = PANEL_META[station];
  const accent = ACCENT[meta.accent];
  const index = STATION_ORDER.indexOf(station) + 1;
  // Collapsing only exists for the mobile sheet; the panel remounts per station so it re-expands on navigation.
  const [collapsed, setCollapsed] = useState(false);
  const hidden = !desktop && collapsed;
  const bodyId = `hud-panel-body-${station}`;
  const titleId = `hud-panel-title-${station}`;

  return (
    <section
      aria-labelledby={titleId}
      className={`pointer-events-auto flex flex-col overflow-hidden border bg-volt-bg/90 backdrop-blur-sm ${accent.border} ${accent.glow} ${
        // bottom sheet (< lg)
        "inset-x-0 bottom-0 max-h-[52vh] rounded-t-2xl border-b-0 pb-[env(safe-area-inset-bottom)] " +
        // side panel (lg+)
        "lg:inset-x-auto lg:bottom-auto lg:right-6 lg:top-20 lg:max-h-[calc(100vh-6.5rem)] lg:w-[min(24rem,36vw)] lg:rounded-2xl lg:border-b lg:pb-0 xl:w-[26rem]"
      } absolute`}
    >
      {/* Accent line */}
      <div className={`h-0.5 w-full ${accent.bar}`} aria-hidden="true" />

      <header className="flex items-start justify-between gap-2 px-4 pb-2 pt-3">
        <div className="min-w-0">
          <p className={`font-heading text-[0.7rem] font-semibold uppercase tracking-[0.2em] ${accent.text}`}>
            <span aria-hidden="true">{String(index).padStart(2, "0")} / {String(STATION_ORDER.length).padStart(2, "0")} · </span>
            {meta.kicker}
          </p>
          <h2
            id={titleId}
            className={`font-heading font-black leading-tight text-white ${
              station === "home"
                ? "bg-gradient-to-r from-volt-cyan to-volt-magenta bg-clip-text text-2xl text-transparent sm:text-3xl"
                : "text-xl sm:text-2xl"
            }`}
          >
            {meta.title}
          </h2>
        </div>
        <div className="-mr-2 flex shrink-0 items-center lg:hidden">
          <StepButtons station={station} goTo={goTo} />
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            aria-controls={bodyId}
            aria-label={collapsed ? "Show station details" : "Hide station details to see the room"}
            className={buttonClass("ghost", "w-11 px-0")}
          >
            {collapsed ? <ChevronUp className="h-5 w-5" aria-hidden="true" /> : <ChevronDown className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </header>

      {!hidden && (
        <>
          <div
            id={bodyId}
            tabIndex={0}
            role="region"
            aria-label={`${meta.title} details`}
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 ${FOCUS} focus-visible:ring-inset focus-visible:ring-offset-0`}
          >
            <p className="mb-4 text-lg leading-snug text-slate-200">{meta.blurb}</p>
            <PanelBody station={station} booking={booking} goTo={goTo} bookSetup={bookSetup} />
          </div>

          <footer className="hidden border-t border-white/10 px-2 py-2 lg:block">
            <StepButtons station={station} goTo={goTo} labelled />
          </footer>
        </>
      )}
    </section>
  );
};

interface StationPanelProps {
  booking: BookingState;
  bookSetup: (setup: SetupId) => void;
}

/**
 * Per-station content panel, kept out of the screen centre (where the camera focuses):
 * right-hand side panel on lg+, bottom sheet below.
 *
 * Motion: AnimatePresence mode="wait" with a short exit (150 ms) and a 300 ms enter. We do NOT wait for the
 * camera flight to finish: content for the destination should appear immediately, and navigation can be
 * interrupted mid-flight, which would leave a panel that waits on `transitioning` showing stale content.
 */
const StationPanel = ({ booking, bookSetup }: StationPanelProps) => {
  const { station, goTo, reducedMotion } = useLounge();
  const desktop = useIsDesktop();

  // MotionConfig reducedMotion="user" already drops transforms; this also shortens fades when the context says so.
  const offset = desktop ? { x: 28, y: 0 } : { x: 0, y: 48 };
  const t = (d: number) => ({ duration: reducedMotion ? 0.1 : d, ease: "easeOut" as const });

  return (
    <AnimatePresence mode="wait" initial>
      <motion.div
        key={station}
        className="pointer-events-none absolute inset-0 z-10"
        initial={{ opacity: 0, ...offset }}
        animate={{ opacity: 1, x: 0, y: 0, transition: t(0.3) }}
        exit={{ opacity: 0, x: offset.x / 2, y: offset.y / 2, transition: t(0.15) }}
      >
        <Panel station={station} booking={booking} desktop={desktop} goTo={goTo} bookSetup={bookSetup} />
      </motion.div>
    </AnimatePresence>
  );
};

export default StationPanel;
