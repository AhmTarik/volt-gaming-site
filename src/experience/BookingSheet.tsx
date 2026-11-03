import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Minus, MessageCircle, Plus, X } from "lucide-react";
import { OPENING, PRICING } from "@/volt/content";
import { whatsappHref } from "@/volt/whatsapp";
import type { Lang } from "@/i18n";

export interface BookingTarget {
  /** Room name as shown, e.g. "Ultra Storm" / "ألترا ستورم". */
  place: string;
  tier: keyof typeof PRICING;
  /** Most PCs (or sim stations) that can be booked here. */
  max: number;
  accent: string;
}

const T = {
  en: {
    title: (p: string) => `Book ${p}`,
    day: "Day",
    today: "Today",
    tomorrow: "Tomorrow",
    other: "Other day",
    time: "Time",
    length: "How long",
    count: { pc: "PCs", sim: "Stations" },
    of: (n: number) => `of ${n}`,
    total: "Estimated total",
    currency: "EGP",
    send: "Send on WhatsApp",
    close: "Close",
    name: "Your name",
    optional: "optional",
    fridayNote: "Friday: we open at 5 PM.",
    hours: (h: number) => (h === 0.5 ? "30 min" : h === 1 ? "1 hour" : `${h} hours`),
    msg: (o: Msg) =>
      [
        `Hi Volt, I'd like to book ${o.place}.`,
        "",
        `Day: ${o.day}`,
        `Time: ${o.time}`,
        `Length: ${o.length}`,
        `${o.countLabel}: ${o.count}`,
        `Estimated total: ${o.total} EGP`,
        ...(o.name ? [`Name: ${o.name}`] : []),
      ].join("\n"),
  },
  ar: {
    title: (p: string) => `احجز ${p}`,
    day: "اليوم",
    today: "النهارده",
    tomorrow: "بكرة",
    other: "يوم تاني",
    time: "الساعة",
    length: "كام ساعة",
    count: { pc: "عدد الأجهزة", sim: "عدد المحطات" },
    of: (n: number) => `من ${n}`,
    total: "الإجمالي التقريبي",
    currency: "ج.م",
    send: "ابعت على واتساب",
    close: "اقفل",
    name: "اسمك",
    optional: "اختياري",
    fridayNote: "الجمعة بنفتح الساعة 5 العصر.",
    hours: (h: number) => (h === 0.5 ? "نص ساعة" : h === 1 ? "ساعة" : h === 2 ? "ساعتين" : h <= 10 ? `${h} ساعات` : `${h} ساعة`),
    msg: (o: Msg) =>
      [
        `أهلاً فولت، عايز أحجز ${o.place}.`,
        "",
        `اليوم: ${o.day}`,
        `الساعة: ${o.time}`,
        `المدة: ${o.length}`,
        `${o.countLabel}: ${o.count}`,
        `الإجمالي التقريبي: ${o.total} ج.م`,
        ...(o.name ? [`الاسم: ${o.name}`] : []),
      ].join("\n"),
  },
} satisfies Record<Lang, unknown>;

interface Msg {
  place: string;
  day: string;
  time: string;
  length: string;
  countLabel: string;
  count: number;
  total: number;
  name?: string;
}

const NAME_KEY = "volt-booking-name";
const readName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
};
const saveName = (v: string) => {
  try {
    if (v) localStorage.setItem(NAME_KEY, v);
    else localStorage.removeItem(NAME_KEY);
  } catch {
    /* private mode */
  }
};

const DURATIONS = { pc: [1, 2, 3, 5, 10], sim: [0.5, 1, 2] };

/** Price for one PC/station: a package price when one matches, otherwise the hourly rate. */
const pricePer = (tier: keyof typeof PRICING, hours: number) => {
  const { hourly, packages } = PRICING[tier];
  return packages.find((p) => p.minutes === hours * 60)?.price ?? Math.round(hourly * hours);
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const toInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Hours (0-23) Volt is open on that date, skipping the past when it's today. */
const openHours = (date: Date) => {
  const now = new Date();
  const from = OPENING.opensAt[date.getDay()] ?? 0;
  const isToday = startOfDay(date).getTime() === startOfDay(now).getTime();
  const earliest = isToday ? now.getHours() + 1 : 0;
  const hours: number[] = [];
  for (let h = Math.max(from, earliest); h < 24; h++) hours.push(h);
  return hours;
};

/**
 * Booking form: pick day, time, length and how many PCs, see the estimated price,
 * then send it all as a ready WhatsApp message.
 */
export const BookingSheet = ({ target, lang, onClose }: { target: BookingTarget; lang: Lang; onClose: () => void }) => {
  const t = T[lang];
  const kind = target.tier === "simulator" ? "sim" : "pc";
  const locale = lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB";

  const today = startOfDay(new Date());
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const [dayMode, setDayMode] = useState<"today" | "tomorrow" | "other">(openHours(today).length ? "today" : "tomorrow");
  const [otherDate, setOtherDate] = useState(toInput(new Date(today.getTime() + 2 * 86_400_000)));
  const date = dayMode === "today" ? today : dayMode === "tomorrow" ? tomorrow : new Date(`${otherDate}T00:00`);
  const hours = useMemo(() => openHours(date), [date.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  const [hour, setHour] = useState<number | null>(null);
  const chosenHour = hour !== null && hours.includes(hour) ? hour : (hours.find((h) => h >= 19) ?? hours[0] ?? null);
  const [length, setLength] = useState(kind === "sim" ? 1 : 2);
  const [count, setCount] = useState(Math.min(kind === "sim" ? 1 : 2, target.max));
  const total = pricePer(target.tier, length) * count;
  // Optional; remembered on this device so regulars don't retype it.
  const [name, setName] = useState(readName);

  const [shown, setShown] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setShown(false);
    window.setTimeout(onClose, 260);
  };

  useEffect(() => {
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

  const timeLabel = (h: number) =>
    new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(2026, 0, 1, h));
  const dayLabel = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(date);

  const href =
    chosenHour === null
      ? undefined
      : whatsappHref(
          t.msg({
            place: target.place,
            day: dayMode === "other" ? dayLabel : `${dayMode === "today" ? t.today : t.tomorrow} (${dayLabel})`,
            time: timeLabel(chosenHour),
            length: t.hours(length),
            countLabel: t.count[kind],
            count,
            total,
            name: name.trim() || undefined,
          }),
        );

  const chip = (on: boolean) =>
    `rounded-lg border px-3 py-2 font-body text-sm font-bold transition-colors ${
      on
        ? "border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-white"
        : "border-white/15 text-white/75 hover:border-white/40"
    }`;
  const label = "mb-2 block font-body text-xs font-semibold uppercase tracking-[0.12em] text-white/70";
  const isFriday = date.getDay() === 5;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={t.title(target.place)}
      dir={lang === "ar" ? "rtl" : "ltr"}
      lang={lang}
      style={{ "--accent": target.accent } as CSSProperties}
    >
      <button
        type="button"
        aria-label={t.close}
        onClick={close}
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: shown ? 1 : 0 }}
      />
      <div
        className="relative max-h-[calc(100svh-24px)] w-full overflow-y-auto rounded-t-2xl border-t border-[color:var(--accent)] bg-[#0b0b0d] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-white shadow-[0_-20px_60px_-20px_var(--accent)] sm:max-w-md sm:rounded-2xl sm:border sm:pt-5"
        style={{
          transform: shown ? "none" : "translateY(40px)",
          opacity: shown ? 1 : 0,
          transition: "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 200ms ease-out",
        }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25 sm:hidden" />
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="font-heading text-lg font-bold">{t.title(target.place)}</h3>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label={t.close}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20"
          >
            <X size={18} />
          </button>
        </div>

        <fieldset className="mb-4 min-w-0">
          <legend className={label}>{t.day}</legend>
          <div className="flex flex-wrap gap-2">
            {(["today", "tomorrow", "other"] as const).map((m) => (
              <button key={m} type="button" className={chip(dayMode === m)} onClick={() => setDayMode(m)} aria-pressed={dayMode === m}>
                {t[m]}
              </button>
            ))}
          </div>
          {dayMode === "other" && (
            <input
              type="date"
              min={toInput(today)}
              value={otherDate}
              onChange={(e) => e.target.value && setOtherDate(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 font-body text-base text-white [color-scheme:dark]"
            />
          )}
          <p className="mt-1.5 font-body text-sm text-white/60">
            {dayLabel}
            {isFriday && ` · ${t.fridayNote}`}
          </p>
        </fieldset>

        <label className="mb-4 block">
          <span className={label}>{t.time}</span>
          <select
            value={chosenHour ?? ""}
            onChange={(e) => setHour(Number(e.target.value))}
            className="w-full rounded-lg border border-white/15 bg-[#141417] px-3 py-2.5 font-body text-base font-semibold text-white [color-scheme:dark]"
          >
            {hours.map((h) => (
              <option key={h} value={h}>
                {timeLabel(h)}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="mb-4 min-w-0">
          <legend className={label}>{t.length}</legend>
          <div className="flex flex-wrap gap-2">
            {DURATIONS[kind].map((h) => (
              <button key={h} type="button" className={chip(length === h)} onClick={() => setLength(h)} aria-pressed={length === h}>
                {t.hours(h)}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mb-5">
          <span className={label}>{t.count[kind]}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              disabled={count <= 1}
              aria-label="−"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 disabled:opacity-35"
            >
              <Minus size={18} />
            </button>
            <span className="cine-num min-w-[2ch] text-center text-2xl font-bold" aria-live="polite">
              {count}
            </span>
            <button
              type="button"
              onClick={() => setCount((c) => Math.min(target.max, c + 1))}
              disabled={count >= target.max}
              aria-label="+"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 disabled:opacity-35"
            >
              <Plus size={18} />
            </button>
            <span className="font-body text-sm text-white/60">{t.of(target.max)}</span>
          </div>
        </div>

        <label className="mb-5 block">
          <span className={label}>
            {t.name} <span className="normal-case tracking-normal text-white/45">({t.optional})</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => saveName(name.trim())}
            autoComplete="name"
            maxLength={60}
            enterKeyHint="done"
            className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2.5 font-body text-base font-semibold text-white placeholder:text-white/30"
          />
        </label>

        <div className="mb-4 flex items-baseline justify-between border-t border-white/10 pt-4">
          <span className="font-body text-sm font-semibold uppercase tracking-[0.1em] text-white/75">{t.total}</span>
          <span className="cine-num cine-accent text-3xl font-bold">
            {total}
            <span className="ms-1 font-body text-sm text-white/70">{t.currency}</span>
          </span>
        </div>

        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            saveName(name.trim());
            window.setTimeout(close, 300);
          }}
          aria-disabled={!href}
          className="flex items-center justify-center gap-2.5 rounded-lg bg-[color:var(--accent)] px-5 py-3.5 font-heading text-sm font-bold uppercase tracking-[0.1em] text-black aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          <MessageCircle size={18} strokeWidth={2.5} />
          {t.send}
        </a>
      </div>
    </div>,
    document.body,
  );
};
