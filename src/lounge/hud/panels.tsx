import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, MapPin, MessageCircle, MousePointerClick } from "lucide-react";
import type { StationId } from "../stations";
import { STATIONS } from "../stations";
import {
  MAP_LINK,
  OFFERS,
  PC_TIERS,
  ROOM_SPEC_ENTRIES,
  ROOM_TIERS,
  SIM_EQUIPMENT,
  SIM_STATIONS,
  buildRoomWhatsAppLink,
  type SetupId,
} from "./content";
import { ACCENT, CARD, SECTION_LABEL, buttonClass } from "./ui";

export interface PanelActions {
  goTo: (id: StationId) => void;
  /** Jump to the booking desk with this setup preselected. */
  bookSetup: (setup: SetupId) => void;
}

/* ------------------------------------------------------------------- home */

const QUICK_LINKS: StationId[] = ["pcs", "simulator", "offers", "rooms"];

export const HomePanel = ({ goTo }: PanelActions) => (
  <div className="flex flex-col gap-5">
    <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
      <button type="button" onClick={() => goTo("pcs")} className={buttonClass("primary", "flex-1")}>
        Explore the lounge
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => goTo("booking")} className={buttonClass("magenta", "flex-1")}>
        Book Now
      </button>
    </div>

    <section aria-labelledby="hud-quick-title">
      <h3 id="hud-quick-title" className={`${SECTION_LABEL} mb-2`}>
        Jump to
      </h3>
      <ul className="grid grid-cols-2 gap-2">
        {QUICK_LINKS.map((id) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => goTo(id)}
              className={buttonClass("ghost", "w-full justify-between border border-white/10 !normal-case !tracking-normal text-base")}
            >
              <span className="font-body text-base font-semibold">{STATIONS[id].label}</span>
              <ArrowRight className="h-4 w-4 text-volt-cyan" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>

    <div className="flex items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-base text-slate-300">
        <MousePointerClick className="h-4 w-4 shrink-0 text-volt-cyan" aria-hidden="true" />
        Click objects in the room to explore.
      </p>
      <a href={MAP_LINK} target="_blank" rel="noopener noreferrer" className={buttonClass("ghost", "shrink-0")}>
        <MapPin className="h-4 w-4" aria-hidden="true" />
        Location
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </div>
  </div>
);

/* -------------------------------------------------------------------- PCs */

export const PcsPanel = ({ goTo, bookSetup }: PanelActions) => (
  <div className="flex flex-col gap-4">
    {PC_TIERS.map((tier) => {
      const accent = tier.premium ? ACCENT.purple : ACCENT.cyan;
      return (
        <article key={tier.id} className={`${CARD} ${accent.border} ${tier.premium ? accent.glow : ""}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-heading text-xl font-bold text-white">{tier.name}</h3>
            {tier.premium && (
              <span className={`rounded-full border px-3 py-1 font-heading text-[0.65rem] font-semibold uppercase tracking-wider ${accent.chip}`}>
                Premium
              </span>
            )}
          </div>
          <ul className="mb-4 flex flex-col gap-2">
            {tier.specs.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-lg text-slate-200">
                <Icon className={`h-5 w-5 shrink-0 ${accent.text}`} aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => bookSetup(tier.id)} className={buttonClass(tier.premium ? "magenta" : "primary", "w-full")}>
            Book This Setup
          </button>
        </article>
      );
    })}
    <button type="button" onClick={() => goTo("rooms")} className={buttonClass("outline")}>
      See the rooms
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>
  </div>
);

/* -------------------------------------------------------------- simulator */

export const SimulatorPanel = ({ bookSetup }: PanelActions) => (
  <div className="flex flex-col gap-5">
    <section aria-labelledby="hud-sim-gear">
      <h3 id="hud-sim-gear" className={`${SECTION_LABEL} mb-2`}>
        Equipment
      </h3>
      <ul className="flex flex-col gap-2">
        {SIM_EQUIPMENT.map(({ icon: Icon, name }) => (
          <li key={name} className={`${CARD} ${ACCENT.magenta.border} flex items-center gap-3 !py-3`}>
            <Icon className={`h-6 w-6 shrink-0 ${ACCENT.magenta.text}`} aria-hidden="true" />
            <span className="font-heading text-sm font-semibold uppercase tracking-wider text-white">{name}</span>
          </li>
        ))}
      </ul>
    </section>

    <section aria-labelledby="hud-sim-rigs">
      <h3 id="hud-sim-rigs" className={`${SECTION_LABEL} mb-2`}>
        Reserve a rig
      </h3>
      <ul className="flex flex-col gap-2">
        {SIM_STATIONS.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-3">
            <span className="font-heading text-sm font-semibold uppercase tracking-wider text-white">{s.name}</span>
            <a href={buildRoomWhatsAppLink(s.name)} target="_blank" rel="noopener noreferrer" className={buttonClass("whatsapp")}>
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>

    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
      <button type="button" onClick={() => bookSetup("simulator")} className={buttonClass("magenta", "flex-1")}>
        Book Simulator
      </button>
      <Link to="/simulator" className={buttonClass("ghost", "flex-1 border border-white/10")}>
        Photos on classic site
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  </div>
);

/* ----------------------------------------------------------------- offers */

export const OffersPanel = ({ goTo }: PanelActions) => (
  <div className="flex flex-col gap-3">
    {OFFERS.map(({ icon: Icon, title, description, badge, accent }) => (
      <article key={title} className={`${CARD} ${ACCENT[accent].border}`}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon className={`h-6 w-6 shrink-0 ${ACCENT[accent].text}`} aria-hidden="true" />
            <h3 className="font-heading text-lg font-bold text-white">{title}</h3>
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1 font-heading text-[0.65rem] font-semibold uppercase tracking-wider ${ACCENT[accent].chip}`}>
            {badge}
          </span>
        </div>
        <p className="text-lg text-slate-200">{description}</p>
      </article>
    ))}
    <button type="button" onClick={() => goTo("booking")} className={buttonClass("primary")}>
      Book Now
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>
  </div>
);

/* -------------------------------------------------------------- VIP rooms */

export const RoomsPanel = (_: PanelActions) => {
  const [tierId, setTierId] = useState<(typeof ROOM_TIERS)[number]["id"]>("ultra");
  const tier = ROOM_TIERS.find((t) => t.id === tierId) ?? ROOM_TIERS[0];

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Room type" className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 p-1">
        {ROOM_TIERS.map((t) => {
          const on = t.id === tierId;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={on}
              onClick={() => setTierId(t.id)}
              className={buttonClass(on ? "primary" : "ghost", "w-full")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <ul className="flex flex-col gap-2">
        {tier.rooms.map((room) => (
          <li key={room.name} className={`${CARD} ${ACCENT.purple.border} flex items-center justify-between gap-3 !py-3`}>
            <div>
              <p className="font-heading text-sm font-bold uppercase tracking-wider text-white">{room.name}</p>
              <p className={`font-heading text-xs font-semibold ${ACCENT.cyan.text}`}>{room.pcCount} PCs</p>
            </div>
            <a href={buildRoomWhatsAppLink(room.name)} target="_blank" rel="noopener noreferrer" className={buttonClass("whatsapp")}>
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Book
              <span className="sr-only"> {room.name} on WhatsApp (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>

      <section aria-labelledby="hud-room-specs">
        <h3 id="hud-room-specs" className={`${SECTION_LABEL} mb-2`}>
          PC specifications
        </h3>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {ROOM_SPEC_ENTRIES.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-start gap-2 text-base">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${ACCENT.purple.text}`} aria-hidden="true" />
              <div>
                <dt className="inline font-semibold text-white">{label}: </dt>
                <dd className="inline text-slate-300">{tier.specs[key]}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <Link to={tier.href} className={buttonClass("ghost", "border border-white/10")}>
        View {tier.label} photos
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
};
