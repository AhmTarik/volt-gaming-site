import { useId } from "react";
import { CheckCircle2, MapPin, MessageCircle, Phone } from "lucide-react";
import {
  DURATIONS,
  MAP_LINK,
  PHONE_DISPLAY,
  SETUP_OPTIONS,
  TEL_LINK,
  WHATSAPP_LINK,
  bookingSchema,
  buildBookingMessage,
  buildWhatsAppLink,
} from "./content";
import type { BookingState } from "./booking";
import { ACCENT, FOCUS, SECTION_LABEL, buttonClass } from "./ui";

const INPUT =
  "w-full min-h-11 rounded-lg border border-white/20 bg-white/[0.06] px-3 py-2.5 font-body text-lg text-white placeholder:text-slate-400 transition-colors focus-visible:border-volt-cyan " +
  FOCUS;

const LABEL = "mb-1 block font-heading text-[0.7rem] font-semibold uppercase tracking-wider text-slate-300";

const localToday = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const Field = ({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label htmlFor={id} className={LABEL}>
      {label}
    </label>
    {children}
    {error && (
      <p id={`${id}-error`} role="alert" className="mt-1 text-base text-pink-300">
        {error}
      </p>
    )}
  </div>
);

const ContactBlock = () => (
  <section aria-labelledby="hud-contact-title" className="flex flex-col gap-2 border-t border-white/10 pt-4">
    <h3 id="hud-contact-title" className={SECTION_LABEL}>
      Find us
    </h3>
    <p className="text-base text-slate-300">Visit us or message us on WhatsApp to book your spot.</p>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      <a href={MAP_LINK} target="_blank" rel="noopener noreferrer" className={buttonClass("outline")}>
        <MapPin className="h-4 w-4" aria-hidden="true" />
        Open in Google Maps
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={buttonClass("whatsapp")}>
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        WhatsApp {PHONE_DISPLAY}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </div>
    <a href={TEL_LINK} className={buttonClass("ghost", "justify-start")}>
      <Phone className="h-4 w-4" aria-hidden="true" />
      Call {PHONE_DISPLAY}
    </a>
    <p className="pt-1 text-sm text-slate-400">© {new Date().getFullYear()} Volt Gaming Café. All rights reserved.</p>
  </section>
);

const BookingPanel = ({ booking }: { booking: BookingState }) => {
  const uid = useId();
  const { form, errors, setErrors, update, submitted, setSubmitted, reset } = booking;
  const id = (f: string) => `${uid}-${f}`;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = bookingSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] && !fieldErrors[err.path[0] as string]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      // Move focus to the first invalid field so keyboard / screen-reader users land on it.
      const first = (["name", "phone", "setup", "date", "time", "duration"] as const).find((f) => fieldErrors[f]);
      if (first) document.getElementById(id(first))?.focus();
      return;
    }
    setSubmitted(result.data);
  };

  if (submitted) {
    return (
      <div className="flex flex-col gap-4">
        <div className={`rounded-xl border bg-white/[0.04] p-4 text-center ${ACCENT.cyan.border} ${ACCENT.cyan.glow}`} role="status">
          <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-volt-cyan" aria-hidden="true" />
          <h3 className="mb-1 font-heading text-xl font-bold text-white">Booking request ready</h3>
          <p className="text-lg text-slate-200">
            Send it to us on WhatsApp and we will confirm your session. Get ready to game!
          </p>
        </div>
        <a
          href={buildWhatsAppLink(buildBookingMessage(submitted))}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("whatsapp")}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Send on WhatsApp
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <button type="button" onClick={reset} className={buttonClass("ghost", "border border-white/10")}>
          Book Another
        </button>
        <ContactBlock />
      </div>
    );
  }

  const describe = (f: string) => (errors[f] ? `${id(f)}-error` : undefined);

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field id={id("name")} label="Name" error={errors.name}>
          <input
            id={id("name")}
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={form.name ?? ""}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={describe("name")}
            className={INPUT}
          />
        </Field>

        <Field id={id("phone")} label="Phone" error={errors.phone}>
          <input
            id={id("phone")}
            type="tel"
            autoComplete="tel"
            placeholder="Your phone number"
            value={form.phone ?? ""}
            onChange={(e) => update("phone", e.target.value)}
            aria-invalid={!!errors.phone}
            aria-describedby={describe("phone")}
            className={INPUT}
          />
        </Field>

        <Field id={id("setup")} label="Setup" error={errors.setup}>
          <select
            id={id("setup")}
            value={form.setup ?? ""}
            onChange={(e) => update("setup", e.target.value)}
            aria-invalid={!!errors.setup}
            aria-describedby={describe("setup")}
            className={`${INPUT} cursor-pointer`}
          >
            <option value="" className="bg-volt-bg">
              Select setup
            </option>
            {SETUP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-volt-bg">
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id={id("date")} label="Date" error={errors.date}>
            <input
              id={id("date")}
              type="date"
              min={localToday()}
              value={form.date ?? ""}
              onChange={(e) => update("date", e.target.value)}
              aria-invalid={!!errors.date}
              aria-describedby={describe("date")}
              className={`${INPUT} [color-scheme:dark]`}
            />
          </Field>
          <Field id={id("time")} label="Time" error={errors.time}>
            <input
              id={id("time")}
              type="time"
              value={form.time ?? ""}
              onChange={(e) => update("time", e.target.value)}
              aria-invalid={!!errors.time}
              aria-describedby={describe("time")}
              className={`${INPUT} [color-scheme:dark]`}
            />
          </Field>
        </div>

        <fieldset>
          <legend className={LABEL}>Duration</legend>
          <div className="grid grid-cols-3 gap-2" role="group" aria-describedby={describe("duration")}>
            {DURATIONS.map((h, i) => {
              const on = form.duration === h;
              return (
                <button
                  key={h}
                  id={i === 0 ? id("duration") : undefined}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update("duration", h)}
                  className={buttonClass(on ? "primary" : "ghost", on ? "" : "border border-white/20")}
                >
                  {h}h
                </button>
              );
            })}
          </div>
          {errors.duration && (
            <p id={`${id("duration")}-error`} role="alert" className="mt-1 text-base text-pink-300">
              {errors.duration}
            </p>
          )}
        </fieldset>

        <button type="submit" className={buttonClass("magenta", "w-full py-3")}>
          Submit Booking
        </button>
      </form>

      <ContactBlock />
    </div>
  );
};

export default BookingPanel;
