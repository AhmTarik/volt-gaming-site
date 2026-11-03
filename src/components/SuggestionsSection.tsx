import { useState } from "react";
import { Lightbulb, MessageCircle, TriangleAlert } from "lucide-react";
import Reveal from "@/components/Reveal";
import { whatsappHref } from "@/volt/whatsapp";
import { tr, useLang } from "@/i18n";

type Kind = "suggestion" | "complaint";

const COPY = {
  title: { en: "Suggestions and complaints", ar: "اقتراحات وشكاوي" },
  intro: {
    en: "Tell us what to improve, or what went wrong. It goes straight to us on WhatsApp.",
    ar: "قولنا نحسّن إيه، أو إيه اللي ضايقك. الرسالة بتوصلنا على الواتساب على طول.",
  },
  type: { en: "Is it a", ar: "هي" },
  suggestion: { en: "Suggestion", ar: "اقتراح" },
  complaint: { en: "Complaint", ar: "شكوى" },
  details: { en: "Details", ar: "التفاصيل" },
  placeholder: {
    suggestion: { en: "What would make Volt better for you?", ar: "إيه اللي يخلّي فولت أحسن بالنسبالك؟" },
    complaint: { en: "What happened? Which room and when, if you remember.", ar: "إيه اللي حصل؟ وفي أنهي أوضة وإمتى لو فاكر." },
  },
  name: { en: "Your name", ar: "اسمك" },
  optional: { en: "optional", ar: "اختياري" },
  send: { en: "Send on WhatsApp", ar: "ابعت على واتساب" },
  required: { en: "Write a few words first.", ar: "اكتب كلمتين الأول." },
};

const NAME_KEY = "volt-booking-name";
const readName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
};

/** Suggestion / complaint form: the visitor picks the type, writes it, and it opens as a WhatsApp message. */
const SuggestionsSection = () => {
  const lang = useLang();
  const t = (k: Exclude<keyof typeof COPY, "placeholder">) => tr(lang, COPY[k]);
  const [kind, setKind] = useState<Kind>("suggestion");
  const [details, setDetails] = useState("");
  const [name, setName] = useState(readName);
  const [tried, setTried] = useState(false);
  const empty = details.trim().length < 3;

  const message = () => {
    const ar = lang === "ar";
    const head = kind === "complaint" ? (ar ? "⚠️ شكوى" : "⚠️ Complaint") : ar ? "💡 اقتراح" : "💡 Suggestion";
    return [
      head,
      "",
      details.trim(),
      ...(name.trim() ? ["", `${ar ? "الاسم" : "Name"}: ${name.trim()}`] : []),
    ].join("\n");
  };

  const kindButton = (k: Kind, Icon: typeof Lightbulb, color: string) => {
    const on = kind === k;
    return (
      <button
        type="button"
        onClick={() => setKind(k)}
        aria-pressed={on}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 font-body text-lg font-bold transition-colors"
        style={{
          borderColor: on ? color : "rgb(255 255 255 / 0.15)",
          background: on ? `color-mix(in srgb, ${color} 16%, transparent)` : "transparent",
          color: on ? "#fff" : "rgb(255 255 255 / 0.7)",
          boxShadow: on ? `0 0 18px -4px ${color}` : "none",
        }}
      >
        <Icon size={20} style={{ color }} />
        {t(k)}
      </button>
    );
  };

  const field = "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 font-body text-base text-white placeholder:text-white/35 focus:border-white/40 focus:outline-none";
  const label = "mb-2 block font-body text-sm font-semibold uppercase tracking-[0.12em] text-white/70";

  return (
    <section id="suggestions" className="py-24 px-4 border-t border-border">
      <div className="container mx-auto max-w-xl">
        <Reveal>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-4 gradient-text rtl:leading-snug">
            💬 {t("title")}
          </h2>
          <p className="text-center text-muted-foreground text-lg mb-10 max-w-xl mx-auto">{t("intro")}</p>
        </Reveal>

        <Reveal delay={0.08}>
          <form
            className="glass-card rounded-2xl border border-neon-cyan/20 p-5 md:p-8 neon-glow-cyan"
            onSubmit={(e) => {
              e.preventDefault();
              setTried(true);
              if (empty) return;
              try {
                if (name.trim()) localStorage.setItem(NAME_KEY, name.trim());
              } catch {
                /* private mode */
              }
              window.open(whatsappHref(message()), "_blank", "noopener,noreferrer");
            }}
          >
            <fieldset className="mb-5">
              <legend className={label}>{t("type")}</legend>
              <div className="flex gap-3">
                {kindButton("suggestion", Lightbulb, "#22d3ee")}
                {kindButton("complaint", TriangleAlert, "#ff5a7a")}
              </div>
            </fieldset>

            <label className="mb-5 block">
              <span className={label}>{t("details")}</span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={5}
                maxLength={1000}
                placeholder={tr(lang, COPY.placeholder[kind])}
                aria-invalid={tried && empty}
                className={`${field} resize-y ${tried && empty ? "border-red-400/70" : ""}`}
              />
              {tried && empty && <span className="mt-1.5 block font-body text-sm text-red-300">{t("required")}</span>}
            </label>

            <label className="mb-6 block">
              <span className={label}>
                {t("name")} <span className="normal-case tracking-normal text-white/45">({t("optional")})</span>
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={60}
                className={field}
              />
            </label>

            <button type="submit" className="neon-btn neon-btn--blue w-full">
              <MessageCircle size={20} strokeWidth={2.5} />
              {t("send")}
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
};

export default SuggestionsSection;
