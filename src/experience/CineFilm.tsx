import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
  Cigarette,
  CigaretteOff,
  MapPin,
  MessageCircle,
  Wifi,
  Zap,
} from "lucide-react";
import { CineRenderer } from "@/experience/CineRenderer";
import { HOLD, TRANS, pcsLabel, sectionAnchor, type Film } from "@/experience/scenes";
import { CONTACT, PRICING } from "@/volt/content";
import { whatsappHref } from "@/volt/whatsapp";
import { BookingSheet, type BookingTarget } from "@/experience/BookingSheet";
import { useLang, type Lang } from "@/i18n";
import "@/experience/experience.css";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const line = (j: number) => ({ "--j": j }) as CSSProperties;

/** Interface copy of the film, per language (section and room copy live in scenes.ts). */
const UI = {
  en: {
    wireless: "Wireless",
    book: "Book this room",
    specs: "Specs",
    vapeOnly: "No cigarettes · Vape allowed",
    smoking: "Smoking allowed",
    pricesPC: "Prices per PC",
    pricesStation: "Prices per station",
    currency: "EGP",
    perPC: "/PC",
    perStation: "/seat",
    save: (n: number) => `Save ${n}`,
    length: (m: number) => (m < 60 ? `${m} min` : m === 60 ? "1 hour" : `${m / 60} hours`),
    scroll: "Scroll down",
    scrollSub: "to walk through every room",
    bookWa: "Book on WhatsApp",
    bookMsg: "Hi Volt, I'd like to book.",
    location: "Location",
    loading: "Loading the rooms",
    close: "Close",
    closeSpecs: "Close specs",
    specsOf: (name: string) => `${name} specs`,
    sections: "Sections",
  },
  ar: {
    wireless: "وايرلس",
    book: "احجز الأوضة",
    specs: "المواصفات",
    vapeOnly: "ممنوع السجاير · الفيب مسموح",
    smoking: "التدخين مسموح",
    pricesPC: "الأسعار للجهاز",
    pricesStation: "الأسعار للمحطة",
    currency: "ج.م",
    perPC: "/جهاز",
    perStation: "/محطة",
    save: (n: number) => `وفّر ${n}`,
    length: (m: number) => (m === 30 ? "نص ساعة" : m < 60 ? `${m} دقيقة` : m === 60 ? "ساعة" : `${m / 60} ساعات`),
    scroll: "انزل لتحت",
    scrollSub: "وشوف كل الأوض",
    bookWa: "احجز على واتساب",
    bookMsg: "أهلاً فولت، عايز أحجز.",
    location: "اللوكيشن",
    loading: "بنجهز الأوض",
    close: "اقفل",
    closeSpecs: "اقفل المواصفات",
    specsOf: (name: string) => `مواصفات ${name}`,
    sections: "الأقسام",
  },
} satisfies Record<Lang, unknown>;
const useUI = () => UI[useLang()];

/** Spec value; a trailing "Wireless" becomes a badge so it stands out. */
const SpecValue = ({ value }: { value: string }) => {
  const ui = useUI();
  const m = value.match(/^(.*)\s+wireless$/i);
  if (!m) return <>{value}</>;
  return (
    <>
      {m[1]}{" "}
      <span className="ms-0.5 inline-flex translate-y-[-1px] items-center gap-1 rounded-full border border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-2.5 py-0.5 align-middle font-body text-[11px] font-bold uppercase tracking-[0.08em] text-white cine:text-sm">
        <Wifi size={14} strokeWidth={2.75} className="cine-accent" />
        {ui.wireless}
      </span>
    </>
  );
};

/** One section's prices: a ticket per package, with what the longer packages save. */
const PriceStrip = ({
  tier,
  style,
}: {
  tier: keyof typeof PRICING;
  style: CSSProperties;
}) => {
  const { hourly, packages } = PRICING[tier];
  const ui = useUI();
  return (
    <div
      className="cine-line mt-4 cine:mt-6 [@media(max-height:700px)]:mt-2 [@media(max-height:820px)]:cine:mt-4"
      style={style}
    >
      <p className="mb-2 hidden font-body text-sm font-semibold uppercase tracking-[0.12em] text-white/75 cine:block [@media(max-height:820px)]:cine:hidden">
        {tier === "simulator" ? ui.pricesStation : ui.pricesPC}
      </p>
      <div className="flex divide-x divide-white/15 overflow-hidden rtl:divide-x-reverse rounded-xl border border-white/15 bg-white/[0.04]">
        {packages.map(({ minutes, price }) => {
          const save = Math.round((hourly * minutes) / 60 - price);
          return (
            <div
              key={minutes}
              className="flex-1 px-3 py-2 cine:px-4 cine:py-3 [@media(max-height:820px)]:cine:py-2"
            >
              <div className="font-body text-xs font-semibold uppercase tracking-[0.1em] text-white/75 cine:text-sm">
                {ui.length(minutes)}
              </div>
              <div className="cine-num cine-accent text-xl font-bold leading-tight cine:text-3xl [@media(max-height:820px)]:cine:text-2xl">
                {price}
                <span className="ms-1 font-body text-xs font-semibold text-white/75 cine:text-sm">
                  {ui.currency}
                  {/* "per PC" when the label above is hidden */}
                  <span className="cine:hidden [@media(max-height:820px)]:cine:inline">
                    {tier === "simulator" ? ui.perStation : ui.perPC}
                  </span>
                </span>
              </div>
              {save > 0 && (
                <div className="hidden font-body text-xs font-bold uppercase tracking-[0.06em] text-green-400 cine:block [@media(max-height:820px)]:cine:hidden">
                  {ui.save(save)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Phones: a sheet that slides up with every spec of one room. */
const SpecsSheet = ({
  film,
  scene,
  onClose,
  onBook,
}: {
  film: Film;
  scene: number;
  onClose: () => void;
  onBook: () => void;
}) => {
  const sc = film.scenes[scene];
  const group = film.groups[film.groupIndexOf(scene)].group;
  const cells = film.specCells(sc.group).map((c) => ({
    label: c.label,
    value: (c.variants.find((v) => v.scenes.includes(scene)) ?? c.variants[0])
      .value,
  }));
  const [shown, setShown] = useState(false);
  const ui = useUI();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Lock page scroll (it drives the film) while the sheet is open.
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => setShown(true));
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    setShown(false);
    window.setTimeout(onClose, 260);
  };

  return (
    <div
      className="fixed inset-0 z-[60] cine:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={ui.specsOf(sc.room?.name ?? group.title.join(" "))}
      style={{ "--accent": film.accentOf(scene) } as CSSProperties}
    >
      <button
        type="button"
        aria-label={ui.closeSpecs}
        onClick={close}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: shown ? 1 : 0 }}
      />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[calc(100svh-80px)] overflow-y-auto rounded-t-2xl border-t border-[color:var(--accent)] bg-[#0b0b0d] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_60px_-20px_var(--accent)]"
        style={{
          transform: shown ? "translateY(0)" : "translateY(100%)",
          transition: "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" />
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
              {group.kicker}
            </p>
            <h3 className="font-heading text-xl font-bold text-white">
              {sc.room?.name ?? group.title.join(" ")}
            </h3>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label={ui.close}
            className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white"
          >
            <X size={18} />
          </button>
        </div>
        <dl className="divide-y divide-white/10 border-y border-white/10">
          {cells.map((c) => (
            <div
              key={c.label}
              className="flex items-baseline justify-between gap-4 py-3"
            >
              <dt className="shrink-0 font-body text-sm font-semibold uppercase tracking-[0.1em] text-white/70">
                {c.label}
              </dt>
              <dd className="cine-accent cine-num text-end text-lg font-semibold leading-snug">
                <SpecValue value={c.value} />
              </dd>
            </div>
          ))}
        </dl>
        {sc.room && (
          <button
            type="button"
            onClick={onBook}
            className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-lg bg-[color:var(--accent)] px-5 py-3.5 font-heading text-xs font-bold uppercase tracking-[0.1em] text-black"
          >
            <MessageCircle size={18} strokeWidth={2.5} />
            {ui.book}
          </button>
        )}
      </div>
    </div>
  );
};

interface CineFilmProps {
  film: Film;
  /** On another page (home): no own header; adds #pcs plus #ultra / #volt / #sim-racing anchors for the site navbar. */
  embedded?: boolean;
  /** Optional element whose scaleX tracks overall progress. */
  progressBarRef?: RefObject<HTMLDivElement>;
}

/** The scroll film: a framed WebGL photo on the left, room details on the right. */
export const CineFilm = ({
  film,
  embedded = false,
  progressBarRef,
}: CineFilmProps) => {
  const {
    scenes: SCENES,
    groups: GROUP_ORDER,
    total: TOTAL,
    sceneStart,
    timelineAt,
    exitOf,
    accentOf,
    specCells,
    groupIndexOf,
  } = film;
  const N = SCENES.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const groupRefs = useRef<(HTMLElement | null)[]>([]);
  const roomRefs = useRef<(HTMLDivElement | null)[]>([]);
  const navRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /** Spec values that differ per room: cell key -> one element per variant, with the scenes it covers. */
  const variantRefs = useRef(
    new Map<string, { scenes: number[]; el: HTMLElement | null }[]>(),
  );
  const fallbackRefs = useRef<(HTMLImageElement | null)[]>([]);

  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [noGL, setNoGL] = useState(false);
  /** Scene whose specs are open in the phone sheet. */
  const [sheet, setSheet] = useState<number | null>(null);
  const lang = useLang();
  const ui = UI[lang];
  /** Scene whose booking form is open. */
  const [booking, setBooking] = useState<number | null>(null);
  const bookingTarget = (i: number): BookingTarget => {
    const sc = SCENES[i];
    return {
      place: sc.room!.bookAs,
      tier: sc.group === "sim" ? "simulator" : sc.group === "volt" ? "volt" : "ultra",
      max: sc.room!.pcs ?? 1,
      accent: accentOf(i),
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const stage = stageRef.current!;
    const track = trackRef.current!;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let renderer: CineRenderer | null = null;
    let readyAt = 0;
    let cancelled = false;

    try {
      renderer = new CineRenderer(
        canvas,
        SCENES.map((s) => ({ image: s.image, focal: s.focal })),
        { reduceMotion: reduce, onProgress: (n) => !cancelled && setLoaded(n) },
      );
      renderer.ready
        .then(() => {
          if (cancelled) return;
          readyAt = performance.now();
          setReady(true);
        })
        .catch(() => {
          if (cancelled) return;
          readyAt = performance.now();
          setNoGL(true);
          setReady(true);
        });
    } catch {
      readyAt = performance.now();
      setNoGL(true);
      setReady(true);
    }

    const ro = new ResizeObserver(() => renderer?.resize());
    ro.observe(canvas);

    let current = 0;
    let velocity = 0;
    let last = performance.now();
    let raf = 0;
    const cache = new Map<string, string>();
    const set = (el: HTMLElement, prop: string, value: string, key: string) => {
      if (cache.get(key) === value) return;
      cache.set(key, value);
      el.style.setProperty(prop, value);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000) || 0.016;
      last = now;

      const h = stage.clientHeight || window.innerHeight;
      // Distance scrolled into the track; works wherever the track sits on the page.
      const target = Math.min(
        TOTAL,
        Math.max(0, -track.getBoundingClientRect().top / h),
      );
      const prev = current;
      current = reduce
        ? target
        : current + (target - current) * (1 - Math.exp(-dt * 7));
      if (Math.abs(target - current) < 1e-4) current = target;
      velocity += ((current - prev) / dt - velocity) * 0.2;

      const intro = readyAt ? clamp01((now - readyAt) / 1700) : 0;
      const introE = reduce ? (readyAt ? 1 : 0) : easeOut(intro);
      const st = timelineAt(current);
      if (import.meta.env.DEV)
        (window as unknown as { __cine: unknown }).__cine = {
          target,
          current,
          ...st,
        };

      let zoomA = 1 + 0.08 * st.hold;
      if (st.a === 0) zoomA *= 1 + (1 - introE) * 0.35;

      renderer?.render({
        a: st.a,
        b: st.b,
        p: st.p,
        mode: exitOf(st.a),
        zoomA,
        zoomB: 1,
        velocity,
        time: now / 1000,
        speedA: SCENES[st.a].speed ?? 0,
        speedB: SCENES[st.b].speed ?? 0,
        fade: introE,
      });
      if (import.meta.env.DEV) {
        // Test hook: headless screenshots of WebGL can be stale, so read pixels in-frame.
        const w = window as unknown as {
          __cineSnapReq?: boolean;
          __cineSnap?: string;
        };
        if (w.__cineSnapReq) {
          w.__cineSnap = canvas.toDataURL("image/jpeg", 0.7);
          w.__cineSnapReq = false;
        }
      }

      fallbackRefs.current.forEach((img, i) => {
        if (!img) return;
        const o = i === st.a ? 1 - st.p : i === st.b && st.p > 0 ? st.p : 0;
        set(img, "opacity", o.toFixed(3), `f${i}`);
      });

      // Section copy: stays up for every room in the section.
      const groupOut: number[] = [];
      const groupV: number[] = [];
      GROUP_ORDER.forEach(({ scenes }, g) => {
        const first = scenes[0];
        const lastScene = scenes[scenes.length - 1];
        const v =
          first === 0
            ? clamp01((intro - 0.3) / 0.7)
            : clamp01(
                (current - (sceneStart(first) - TRANS * 0.35)) /
                  (TRANS * 0.35 + HOLD * 0.3),
              );
        const out =
          lastScene === N - 1
            ? 0
            : clamp01(
                (current - (sceneStart(lastScene) + HOLD * 0.8)) /
                  (TRANS * 0.35),
              );
        groupV[g] = v;
        groupOut[g] = out;
        const el = groupRefs.current[g];
        if (!el) return;
        set(el, "--v", v.toFixed(4), `gv${g}`);
        set(el, "--out", out.toFixed(4), `go${g}`);
        set(
          el,
          "visibility",
          v > 0.001 && out < 0.999 ? "visible" : "hidden",
          `gvis${g}`,
        );
        set(
          el,
          "pointer-events",
          v > 0.6 && out < 0.2 ? "auto" : "none",
          `gpe${g}`,
        );
      });

      // Room copy: swaps per scroll stop inside a section.
      roomRefs.current.forEach((el, i) => {
        if (!el) return;
        const g = groupIndexOf(i);
        const start = sceneStart(i);
        const v = Math.min(
          groupV[g],
          clamp01(
            (current - (start - TRANS * 0.45)) / (TRANS * 0.45 + HOLD * 0.25),
          ),
        );
        const out = Math.max(
          groupOut[g],
          i === N - 1
            ? 0
            : clamp01((current - (start + HOLD * 0.85)) / (TRANS * 0.35)),
        );
        set(el, "--v", v.toFixed(4), `rv${i}`);
        set(el, "--out", out.toFixed(4), `ro${i}`);
        set(
          el,
          "visibility",
          v > 0.001 && out < 0.999 ? "visible" : "hidden",
          `rvis${i}`,
        );
        set(
          el,
          "pointer-events",
          v > 0.6 && out < 0.2 ? "auto" : "none",
          `rpe${i}`,
        );
      });

      const active = st.p > 0.5 ? st.b : st.a;
      const activeGroup = groupIndexOf(active);
      navRefs.current.forEach(
        (el, g) =>
          el && set(el, "--on", g === activeGroup ? "1" : "0", `n${g}`),
      );
      chipRefs.current.forEach(
        (el, i) => el && set(el, "--on", i === active ? "1" : "0", `c${i}`),
      );
      variantRefs.current.forEach((variants, cell) => {
        const shown = Math.max(
          0,
          variants.findIndex((v) => v.scenes.includes(active)),
        );
        variants.forEach((v, k) => {
          if (!v.el) return;
          set(v.el, "opacity", k === shown ? "1" : "0", `sv${cell}-${k}`);
          set(
            v.el,
            "transform",
            k === shown ? "none" : "translateY(8px)",
            `st${cell}-${k}`,
          );
        });
      });
      const accent = accentOf(active);
      set(stage, "--accent", accent, "accent");
      groupRefs.current.forEach((el, g) => {
        if (el)
          set(
            el,
            "--accent",
            g === activeGroup ? accent : GROUP_ORDER[g].group.accent,
            `ga${g}`,
          );
      });
      if (progressBarRef?.current)
        set(
          progressBarRef.current,
          "transform",
          `scaleX(${(current / TOTAL).toFixed(4)})`,
          "bar",
        );
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer?.dispose();
    };
    // Everything else the loop reads is destructured from `film`, so `film` covers it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [film, progressBarRef]);

  const goTo = (i: number) => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;
    const offset = i === 0 ? 0 : HOLD * 0.35;
    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: trackTop + (sceneStart(i) + offset) * stage.clientHeight,
      behavior: "smooth",
    });
  };

  /** Anchors for the site navbar (#ultra, #volt, #sim-racing), one per section, at its first room. */
  const anchors = embedded
    ? GROUP_ORDER.flatMap(({ group, scenes }) =>
        group.nav
          ? [
              {
                id: sectionAnchor(group.id),
                at: sceneStart(scenes[0]) + HOLD * 0.35,
              },
            ]
          : [],
      )
    : [];

  return (
    <div
      ref={trackRef}
      id={embedded ? "pcs" : undefined}
      className={`relative text-white ${embedded ? "bg-background" : "bg-black"}`}
      style={{ height: `calc(${TOTAL + 1} * 100svh)` }}
    >
      {anchors.map(({ id, at }) => (
        <div
          key={id}
          id={id}
          aria-hidden
          className="pointer-events-none absolute left-0 h-px w-px"
          style={{ top: `calc(${at} * 100svh)` }}
        />
      ))}
      <div
        ref={stageRef}
        className="cine-accent-host sticky top-0 flex h-[100svh] w-full flex-col gap-5 overflow-hidden px-4 pb-4 pt-[68px] cine:flex-row cine:items-stretch cine:gap-12 cine:px-10 cine:pb-10 cine:pt-24 lg:gap-16"
        style={{ "--accent": GROUP_ORDER[0].group.accent } as CSSProperties}
      >
        {/* Photo frame */}
        <div
          className="relative h-[36svh] shrink-0 sm:h-[44svh] [@media(min-height:561px)_and_(max-height:660px)]:h-[32svh] [@media(max-height:560px)]:h-[25svh] overflow-hidden rounded-2xl ring-1 ring-white/10 transition-shadow duration-700 cine:h-auto cine:flex-[1.15]"
          style={{ boxShadow: "0 30px 120px -40px var(--accent)" }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            aria-hidden
          />
          {noGL &&
            SCENES.map((s, i) => (
              <img
                key={s.id}
                ref={(el) => (fallbackRefs.current[i] = el)}
                src={s.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ opacity: i === 0 ? 1 : 0 }}
              />
            ))}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
        </div>

        {/* Details */}
        <div className="relative flex min-h-0 flex-1 flex-col cine:max-w-[560px]">
          <nav className="flex gap-5 cine:gap-8" aria-label={ui.sections}>
            {GROUP_ORDER.map(({ group, scenes }, g) =>
              group.nav ? (
                <button
                  key={group.id}
                  ref={(el) => (navRefs.current[g] = el)}
                  onClick={() => goTo(scenes[0])}
                  className="relative pb-2 font-heading text-sm font-bold uppercase tracking-[0.1em] transition-colors cine:text-lg"
                  style={
                    {
                      "--on": 0,
                      color: "rgb(255 255 255 / calc(0.55 + var(--on) * 0.45))",
                    } as CSSProperties
                  }
                >
                  {group.nav}
                  <span
                    className="absolute inset-x-0 bottom-0 h-px origin-left transition-transform duration-500"
                    style={{
                      background: "var(--accent)",
                      transform: "scaleX(var(--on))",
                    }}
                  />
                </button>
              ) : null,
            )}
          </nav>

          <div className="relative mt-3 min-h-0 flex-1 cine:mt-4">
            {GROUP_ORDER.map(({ group, scenes }, g) => {
              const rooms = scenes.filter((i) => SCENES[i].room);
              const style = {
                "--accent": group.accent,
                "--zs": "0.12",
                visibility: g === 0 ? "visible" : "hidden",
              } as CSSProperties;
              return (
                <section
                  key={group.id}
                  ref={(el) => (groupRefs.current[g] = el)}
                  className="cine-scene cine-accent-host pointer-events-none absolute inset-0 flex flex-col justify-center"
                  style={style}
                  aria-label={group.title.join(" ")}
                >
                  <p
                    className={`cine-line mb-2 font-body text-sm font-semibold uppercase tracking-[0.15em] text-white/85 cine:mb-3 cine:block cine:text-xl ${
                      rooms.length > 0
                        ? "hidden [@media(max-height:940px)]:cine:hidden"
                        : ""
                    }`}
                    style={line(0)}
                  >
                    <span className="cine-accent">◆</span>&nbsp;&nbsp;
                    {group.kicker}
                  </p>
                  <h2
                    className="cine-line cine-title font-heading font-black leading-[0.95] text-white"
                    style={{
                      ...line(1),
                      // Room sections: one line on desktop ("ULTRA//ROOMS 27 PCs"). Intro: two lines.
                      fontSize:
                        group.id === "intro"
                          ? "clamp(min(1.9rem, 7.5vw), min(4.6vw, 7vh, 6vh + 1rem), 4.75rem)"
                          : "clamp(min(1.9rem, 7.5vw), min(3.3vw, 6.5vh), 3rem)",
                    }}
                  >
                    {group.title[0]}
                    <span className="cine-slash mx-[0.12em] font-medium">
                      //
                    </span>
                    <span className={group.id === "intro" ? "cine:block" : ""}>
                      {group.title[1]}
                      {group.total && (
                        <span
                          className="cine-num cine-accent ms-2 inline-block whitespace-nowrap align-baseline text-base font-bold min-[400px]:text-lg tracking-normal cine:ms-4 cine:text-[0.42em]"
                          style={{ textShadow: "0 0 18px var(--accent)" }}
                        >
                          {group.total}
                        </span>
                      )}
                    </span>
                  </h2>

                  {group.body && (
                    <p
                      className="cine-line mt-3 max-w-md font-body text-base leading-snug text-white/75 cine:mt-5 cine:text-xl"
                      style={line(2)}
                    >
                      {group.body}
                    </p>
                  )}

                  {rooms.length > 1 && (
                    <div
                      className="cine-line mt-4 flex flex-wrap gap-2 cine:mt-6 [@media(max-height:500px)]:hidden"
                      style={line(2)}
                    >
                      {rooms.map((i) => (
                        <button
                          key={SCENES[i].id}
                          ref={(el) => (chipRefs.current[i] = el)}
                          onClick={() => goTo(i)}
                          className="rounded-full border px-3 py-1 font-body text-sm font-semibold uppercase tracking-[0.1em] transition-colors duration-300 cine:px-3.5 cine:py-1 cine:text-sm"
                          style={
                            {
                              "--on": 0,
                              borderColor:
                                "color-mix(in srgb, var(--accent) calc(var(--on) * 100%), rgb(255 255 255 / 0.2))",
                              color:
                                "rgb(255 255 255 / calc(0.65 + var(--on) * 0.35))",
                              background:
                                "color-mix(in srgb, var(--accent) calc(var(--on) * 18%), transparent)",
                            } as CSSProperties
                          }
                        >
                          {SCENES[i].room!.short}
                        </button>
                      ))}
                    </div>
                  )}

                  {rooms.length > 0 && (
                    <div className="mt-3 grid cine:mt-6 [@media(max-height:820px)]:cine:mt-4">
                      {rooms.map((i) => {
                        const r = SCENES[i].room!;
                        return (
                          <div
                            key={SCENES[i].id}
                            ref={(el) => (roomRefs.current[i] = el)}
                            className="cine-scene col-start-1 row-start-1"
                            style={
                              {
                                "--ox": lang === "ar" ? "40px" : "-40px",
                                visibility: "hidden",
                              } as CSSProperties
                            }
                          >
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                              <h3
                                className="cine-line font-heading text-xl font-bold text-white cine:text-3xl"
                                style={line(0)}
                              >
                                {r.name}
                              </h3>
                              {r.pcs && (
                                <span
                                  className={`cine-line cine-accent cine-num font-bold ${
                                    r.unit
                                      ? "w-full text-2xl uppercase cine:text-[2.6rem] cine:leading-tight"
                                      : "text-xl cine:text-[1.7rem]"
                                  }`}
                                  style={{
                                    ...line(0.5),
                                    textShadow: r.unit
                                      ? "0 0 22px var(--accent)"
                                      : undefined,
                                  }}
                                >
                                  {r.unit ? `${r.pcs} ${r.unit}` : pcsLabel(lang, r.pcs)}
                                </span>
                              )}
                            </div>
                            {r.hype && (
                              <p
                                className="cine-line cine-accent mt-2 font-heading text-xl font-black uppercase leading-tight cine:mt-3 cine:text-4xl [@media(max-height:820px)]:cine:text-3xl"
                                style={{
                                  ...line(0.8),
                                  textShadow: "0 0 24px var(--accent)",
                                }}
                              >
                                {r.hype.join(" · ")}
                              </p>
                            )}
                            <p
                              className={`cine-line mt-1 font-body cine:mt-2 [@media(max-height:700px)]:hidden [@media(max-height:820px)]:cine:hidden ${
                                r.hype
                                  ? "hidden text-base font-semibold text-white sm:block cine:text-2xl"
                                  : "hidden text-lg text-white/70 sm:block [@media(max-height:940px)]:cine:hidden"
                              }`}
                              style={line(1)}
                            >
                              {r.note}
                            </p>
                            {/* Desktop: smoking badge and Book on one line. Phones: badge, then the buttons. */}
                            <div
                              className="cine-line mt-2 flex flex-wrap items-center gap-2 cine:mt-4 cine:gap-3 [@media(max-height:820px)]:cine:mt-3"
                              style={line(1.2)}
                            >
                              {r.smoking && (
                                <div className="w-full cine:w-auto">
                                  <p className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-2.5 py-0.5 font-body text-xs font-bold uppercase tracking-[0.06em] text-white sm:text-sm cine:gap-2 cine:px-3 cine:py-1.5 cine:text-sm">
                                    {r.smoking === "vape-only" ? (
                                      <>
                                        <CigaretteOff
                                          size={18}
                                          strokeWidth={2.5}
                                          className="cine-accent"
                                        />
                                        {ui.vapeOnly}
                                      </>
                                    ) : (
                                      <>
                                        <Cigarette
                                          size={18}
                                          strokeWidth={2.5}
                                          className="cine-accent"
                                        />
                                        {ui.smoking}
                                      </>
                                    )}
                                  </p>
                                </div>
                              )}
                              <div className="flex items-stretch gap-2">
                                <button
                                  type="button"
                                  onClick={() => setBooking(i)}
                                  aria-haspopup="dialog"
                                  className="group inline-flex items-center gap-2.5 rounded-lg bg-[color:var(--accent)] px-5 py-3 font-heading text-xs font-bold uppercase tracking-[0.1em] text-black shadow-[0_0_24px_-6px_var(--accent)] transition-shadow duration-300 hover:shadow-[0_0_36px_-2px_var(--accent)] cine:px-6 cine:py-3.5 cine:text-sm"
                                >
                                  <MessageCircle size={18} strokeWidth={2.5} />
                                  {ui.book}
                                  <ArrowRight
                                    size={16}
                                    strokeWidth={2.5}
                                    className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                                  />
                                </button>
                                {/* Phones hide the specs; this opens them in a sheet. */}
                                {group.specs && (
                                  <button
                                    type="button"
                                    onClick={() => setSheet(i)}
                                    aria-haspopup="dialog"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-4 font-heading text-xs font-bold uppercase tracking-[0.1em] text-white transition-transform active:scale-[0.97] cine:hidden"
                                  >
                                    <ChevronUp
                                      size={16}
                                      strokeWidth={2.75}
                                      className="cine-accent"
                                    />
                                    {ui.specs}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {group.price && (
                    <PriceStrip tier={group.price} style={line(2.5)} />
                  )}

                  {/* Phones: room specs are left out so the photo can stay big (intro stats stay). */}
                  {group.specs && (
                    <div
                      className={`${group.id === "intro" ? "" : "hidden cine:block"} mt-4 cine:mt-7 [@media(max-height:500px)]:hidden [@media(max-height:700px)]:mt-2 [@media(max-height:820px)]:cine:mt-4`}
                    >
                      <div
                        className="cine-line cine-rule mb-3 h-px w-full cine:mb-5 [@media(max-height:820px)]:cine:mb-3"
                        style={line(3)}
                      />
                      <dl
                        className={`grid gap-x-6 gap-y-3 cine:gap-y-5 [@media(max-height:700px)]:gap-y-1.5 [@media(max-height:820px)]:cine:gap-y-3 ${group.id === "intro" ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3"}`}
                      >
                        {specCells(group.id).map((s, k, cells) => (
                          <div
                            key={s.label}
                            className={`cine-line ${
                              group.id === "intro"
                                ? ""
                                : // Desktop shows every spec; phones get them from the Specs sheet.
                                  ""
                            } ${s.variants.some((v) => v.value.length > 16) && group.id === "sim" ? "sm:col-span-2" : ""}`}
                            style={line(3.3 + k * 0.25)}
                          >
                            <dt
                              className={`font-body font-semibold uppercase text-white/75 ${
                                group.id === "intro"
                                  ? "text-sm tracking-[0.08em] cine:text-xl cine:tracking-[0.1em]"
                                  : "text-xs tracking-[0.12em] cine:text-sm"
                              }`}
                            >
                              {s.label}
                            </dt>
                            <dd
                              className={`cine-accent cine-num ${
                                group.id === "intro"
                                  ? "mt-1 text-4xl font-bold cine:text-6xl"
                                  : "mt-0.5 text-lg font-semibold leading-snug cine:text-xl [@media(max-height:820px)]:cine:text-base"
                              }`}
                            >
                              {s.variants.length === 1 ? (
                                <SpecValue value={s.variants[0].value} />
                              ) : (
                                <span className="grid">
                                  {s.variants.map((v, vi) => (
                                    <span
                                      key={v.value}
                                      ref={(el) => {
                                        const cell = `${group.id}-${s.label}`;
                                        const list =
                                          variantRefs.current.get(cell) ?? [];
                                        list[vi] = { scenes: v.scenes, el };
                                        variantRefs.current.set(cell, list);
                                      }}
                                      className="col-start-1 row-start-1 transition-[opacity,transform] duration-500"
                                      style={{ opacity: vi === 0 ? 1 : 0 }}
                                    >
                                      <SpecValue value={v.value} />
                                    </span>
                                  ))}
                                </span>
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {group.id === "intro" && (
                    <div
                      className="cine-line mt-6 flex items-center gap-4 cine:mt-10"
                      style={line(4)}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--accent)] cine:h-12 cine:w-12">
                        <ChevronDown
                          size={22}
                          className="cine-accent motion-safe:animate-bounce"
                        />
                      </span>
                      <span className="font-heading text-sm uppercase tracking-[0.2em] text-white cine:text-lg">
                        {ui.scroll}
                        <span className="block font-body text-xs normal-case tracking-normal text-white/60 cine:text-base">
                          {ui.scrollSub}
                        </span>
                      </span>
                    </div>
                  )}

                  {group.id === "book" && (
                    <div
                      className="cine-line mt-6 flex flex-col gap-3 sm:flex-row cine:mt-8"
                      style={line(3)}
                    >
                      <a
                        href={whatsappHref(ui.bookMsg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-heading text-xs uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90 neon-glow-purple"
                      >
                        <MessageCircle size={18} />
                        {ui.bookWa}
                      </a>
                      <a
                        href={CONTACT.mapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 px-6 py-3.5 font-heading text-xs uppercase tracking-[0.2em] text-white transition-colors hover:border-white/60"
                      >
                        <MapPin size={18} />
                        {ui.location}
                      </a>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>

        {sheet !== null && (
          <SpecsSheet
            film={film}
            scene={sheet}
            onClose={() => setSheet(null)}
            onBook={() => {
              setBooking(sheet);
              setSheet(null);
            }}
          />
        )}
        {booking !== null && (
          <BookingSheet target={bookingTarget(booking)} lang={lang} onClose={() => setBooking(null)} />
        )}

        {/* Loader */}
        <div
          className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center bg-black transition-opacity duration-700"
          style={{ opacity: ready ? 0 : 1 }}
          aria-hidden={ready}
        >
          <Zap size={28} className="mb-6 text-neon-cyan" fill="currentColor" />
          <div className="h-px w-40 bg-white/15">
            <div
              className="h-full bg-neon-cyan transition-transform duration-300"
              style={{
                transform: `scaleX(${loaded / SCENES.length})`,
                transformOrigin: "left",
              }}
            />
          </div>
          <p className="mt-4 font-body text-xs uppercase tracking-[0.35em] text-white/50">
            {ui.loading}
          </p>
        </div>
      </div>
    </div>
  );
};
