import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Menu, X, Zap } from "lucide-react";
import { useLounge } from "../LoungeContext";
import { STATION_ORDER, STATIONS, type StationId } from "../stations";
import { FOCUS } from "./ui";

const Logo = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Volt Gaming Center, back to lounge overview"
    className={`pointer-events-auto flex h-11 cursor-pointer items-center gap-2 rounded-lg pr-2 ${FOCUS}`}
  >
    <Zap className="h-6 w-6 text-volt-cyan" aria-hidden="true" fill="currentColor" />
    <span className="bg-gradient-to-r from-volt-cyan to-volt-magenta bg-clip-text font-heading text-xl font-black uppercase tracking-[0.18em] text-transparent">
      Volt
    </span>
  </button>
);

const ClassicLink = ({ className = "" }: { className?: string }) => (
  <Link
    to="/"
    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 font-body text-base font-semibold text-slate-200 transition-colors hover:text-white ${FOCUS} ${className}`}
  >
    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
    Classic site
  </Link>
);

/** Top navigation: inline pill on desktop (lg+), compact dropdown menu below. */
const TopNav = () => {
  const { station, goTo } = useLounge();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !toggleRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const select = (id: StationId) => {
    goTo(id);
    setOpen(false);
  };

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-volt-bg/90 via-volt-bg/50 to-transparent pb-6">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-3 sm:px-6">
        <Logo onClick={() => select("home")} />

        {/* Desktop */}
        <nav
          aria-label="Lounge stations"
          className="pointer-events-auto hidden rounded-full border border-white/10 bg-volt-bg/80 px-1.5 backdrop-blur-md lg:block"
        >
          <ul className="flex items-center gap-0.5">
            {STATION_ORDER.map((id) => {
              const active = id === station;
              const cta = id === "booking";
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => goTo(id)}
                    aria-current={active ? "location" : undefined}
                    className={`relative flex h-11 cursor-pointer items-center whitespace-nowrap px-3 font-heading text-[0.7rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 xl:px-4 xl:text-xs ${FOCUS} ${
                      cta
                        ? "my-1 h-9 rounded-full bg-volt-magenta px-4 text-volt-bg hover:bg-volt-magenta/85"
                        : active
                          ? "rounded-md text-volt-cyan"
                          : "rounded-md text-slate-200 hover:text-white"
                    }`}
                  >
                    {STATIONS[id].label}
                    {active && (
                      <motion.span
                        layoutId="hud-nav-indicator"
                        aria-hidden="true"
                        transition={{ type: "spring", stiffness: 420, damping: 36 }}
                        className={`absolute inset-x-2 h-0.5 rounded-full bg-volt-cyan shadow-[0_0_10px_2px] shadow-volt-cyan/70 ${
                          cta ? "-bottom-0.5 bg-white shadow-white/60" : "bottom-1"
                        }`}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="pointer-events-auto hidden lg:block">
          <ClassicLink className="rounded-full border border-white/10 bg-volt-bg/80 backdrop-blur-md" />
        </div>

        {/* Mobile / tablet */}
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="hud-mobile-menu"
          aria-label={open ? "Close stations menu" : "Open stations menu"}
          className={`pointer-events-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-volt-bg/80 text-slate-100 lg:hidden ${FOCUS}`}
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div
          ref={menuRef}
          id="hud-mobile-menu"
          className="pointer-events-auto absolute inset-x-3 top-[3.75rem] z-30 rounded-xl border border-white/15 bg-volt-bg/95 p-2 shadow-xl sm:left-auto sm:right-6 sm:w-72 lg:hidden"
        >
          <nav aria-label="Lounge stations">
            <ul className="flex flex-col gap-1">
              {STATION_ORDER.map((id, i) => {
                const active = id === station;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => select(id)}
                      aria-current={active ? "location" : undefined}
                      className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left font-heading text-sm font-semibold uppercase tracking-wider transition-colors ${FOCUS} ${
                        active ? "bg-volt-cyan/10 text-volt-cyan" : "text-slate-100 hover:bg-white/10"
                      }`}
                    >
                      <span className={`w-6 text-xs ${active ? "text-volt-cyan" : "text-slate-400"}`} aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1">{STATIONS[id].label}</span>
                      {active && <span className="h-2 w-2 rounded-full bg-volt-cyan shadow-[0_0_8px_2px] shadow-volt-cyan/70" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
              <li className="mt-1 border-t border-white/10 pt-1">
                <ClassicLink className="w-full rounded-lg" />
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default TopNav;
