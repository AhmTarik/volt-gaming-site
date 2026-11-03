import { useState, type CSSProperties, type ReactNode } from "react";
import { Check, Copy, Gift } from "lucide-react";
import Reveal from "@/components/Reveal";
import { tr, useLang } from "@/i18n";
import { WELCOME_OFFER, welcomeOfferActive } from "@/volt/content";

const CODE = WELCOME_OFFER.code;

const COPY = {
  kicker: { en: "Offers", ar: "العروض" },
  title: { en: "First time at Volt? A big bonus is waiting for you! 🎮", ar: "أول مرة تيجي ڤولت؟ يبقى مستنيك Bonus جامد! 🎮" },
  lead: {
    en: "Create a new account at Volt Gaming Center and get 25% extra credit on your first top-up! 🎁",
    ar: "سجّل حساب جديد في Volt Gaming Center وخد 25% رصيد زيادة على أول شحنة ليك! 🎁",
  },
  body: {
    en: "Whether you're here to wreck it in FPS, play with your friends, or try the strongest gaming setup… you'll find what you're into! 😎",
    ar: "سواء داخل تكسر الدنيا في الـ FPS، تلعب مع صحابك، أو تجرب أقوى Gaming Setup… هتلاقي اللي على مزاجك عندنا! 😎",
  },
  extra: { en: "extra credit", ar: "رصيد زيادة" },
  firstTopUp: { en: "on your first top-up", ar: "على أول شحنة" },
  how: { en: "How to get it", ar: "إزاي تاخده؟" },
  step1: { en: "Come to Volt and register at the counter.", ar: "تعالى ڤولت وسجّل حسابك عند الكاونتر." },
  step2: { en: "Tell the admin this code while you register:", ar: "وانت بتسجّل، قول الكود ده للأدمن:" },
  step3: { en: "Top up, and 25% extra lands on your balance. ⚡", ar: "اشحن، والـ 25% الزيادة تنزل على رصيدك على طول ⚡" },
  copy: { en: "Copy", ar: "انسخ" },
  copied: { en: "Copied", ar: "اتنسخ" },
  terms: {
    en: "New members only · Once per member · Valid until 30 November 2026",
    ar: "للأعضاء الجداد بس · مرة واحدة لكل عضو · العرض لحد 30 نوفمبر 2026",
  },
};

/** New-member offer: 25% extra on the first top-up with code VOLT3, said at the counter. */
const WelcomeOffer = () => {
  const lang = useLang();
  const t = (k: keyof typeof COPY) => tr(lang, COPY[k]);
  const [copied, setCopied] = useState(false);

  if (!welcomeOfferActive()) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the code is still on screen */
    }
  };

  const step = (n: number, children: ReactNode) => (
    <li className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ff2bd6] font-heading text-sm font-bold text-white" style={{ boxShadow: "0 0 10px -2px #ff2bd6" }}>
        {n}
      </span>
      <div className="pt-0.5 font-body text-lg text-white/90">{children}</div>
    </li>
  );

  return (
    <section id="offers" className="py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <Reveal>
          <p className="mb-3 text-center font-heading text-sm uppercase tracking-[0.3em] text-[#ff7ae8]">
            <Gift size={16} className="me-2 inline -translate-y-px" />
            {t("kicker")}
          </p>
        </Reveal>

        <Reveal delay={0.06}>
          <div
            className="relative overflow-hidden rounded-3xl border p-6 md:p-10"
            style={{
              borderColor: "rgb(255 43 214 / 0.45)",
              background:
                "radial-gradient(120% 90% at 100% 0%, rgb(255 43 214 / 0.16), transparent 60%), radial-gradient(90% 80% at 0% 100%, rgb(46 168 255 / 0.14), transparent 60%), hsl(0 0% 7%)",
              boxShadow: "0 0 40px -10px rgb(255 43 214 / 0.55), inset 0 0 30px -12px rgb(255 43 214 / 0.4)",
            }}
          >
            <div className="grid items-center gap-8 md:grid-cols-[auto_1fr] md:gap-10">
              {/* The number */}
              <div className="text-center md:text-start">
                <p
                  className="neon-tube neon-tube--pink font-heading text-7xl font-black leading-none md:text-8xl"
                  style={{ "--ignite-delay": "0s", "--hum-duration": "4.2s" } as CSSProperties}
                  dir="ltr"
                >
                  +25%
                </p>
                <p className="mt-2 font-body text-lg font-bold uppercase tracking-[0.12em] text-white">{t("extra")}</p>
                <p className="font-body text-base text-white/65">{t("firstTopUp")}</p>
              </div>

              {/* The pitch */}
              <div>
                <h2 className="mb-3 font-heading text-2xl font-bold leading-snug text-white md:text-3xl">{t("title")}</h2>
                <p className="mb-3 font-body text-lg font-semibold text-white/90">{t("lead")}</p>
                <p className="font-body text-lg text-white/70">{t("body")}</p>
              </div>
            </div>

            {/* How to claim it: at the counter, with the code */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="mb-4 font-heading text-lg font-bold text-[#ff9bee]">{t("how")}</h3>
              <ol className="space-y-4">
                {step(1, t("step1"))}
                {step(
                  2,
                  <>
                    {t("step2")}
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span
                        dir="ltr"
                        className="rounded-lg border border-dashed border-[#2ea8ff] bg-[#2ea8ff]/10 px-5 py-2 font-heading text-2xl font-black tracking-[0.25em] text-white"
                        style={{ textShadow: "0 0 12px #2ea8ff" }}
                      >
                        {CODE}
                      </span>
                      <button
                        type="button"
                        onClick={copy}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 font-body text-sm font-bold text-white/85 transition-colors hover:border-white/50"
                        aria-live="polite"
                      >
                        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        {copied ? t("copied") : t("copy")}
                      </button>
                    </div>
                  </>,
                )}
                {step(3, t("step3"))}
              </ol>
              <p className="mt-6 rounded-lg bg-white/[0.04] px-4 py-2.5 text-center font-body text-sm font-semibold text-white/70">
                {t("terms")}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default WelcomeOffer;
