import { useRef, type CSSProperties } from "react";
import { ChevronDown, MapPin, MessageCircle } from "lucide-react";
import HeroLightning from "@/components/HeroLightning";
import heroBg from "@/assets/hero-bg.jpg";
import { whatsappHref } from "@/volt/whatsapp";
import { tr, useLang } from "@/i18n";

const MAP_LINK = "https://maps.app.goo.gl/7fjgL28b1Fx3qKQa6";

const COPY = {
  bgAlt: { en: "Gaming café interior with neon lighting", ar: "جيمنج سنتر من جوه بإضاءة نيون" },
  welcome: { en: "Welcome to", ar: "أهلاً بيك في" },
  brandA: { en: "Volt", ar: "فولت" },
  brandB: { en: "Gaming Center", ar: "جيمنج سنتر" },
  book: { en: "Book on WhatsApp", ar: "احجز على واتساب" },
  bookMsg: { en: "Hi Volt, I'd like to book.", ar: "أهلاً فولت، عايز أحجز." },
  rooms: { en: "See the rooms", ar: "شوف الأوض" },
  directions: { en: "New Cairo · Get directions", ar: "القاهرة الجديدة · افتح اللوكيشن" },
  cue: { en: "Scroll down to the rooms", ar: "انزل للأوض" },
};

const HeroSection = () => {
  const lang = useLang();
  const t = (k: keyof typeof COPY) => tr(lang, COPY[k]);
  const ref = useRef<HTMLElement>(null);
  const sloganRef = useRef<HTMLParagraphElement>(null);
  return (
    <section
      ref={ref}
      id="home"
      className="relative flex min-h-screen min-h-[100svh] flex-col items-center justify-center overflow-hidden pb-8 pt-24 md:py-0 max-md:[@media(max-height:760px)]:pb-5 max-md:[@media(max-height:760px)]:pt-20"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt={t("bgAlt")}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      <HeroLightning hostRef={ref} targetRef={sloganRef} />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        {/* Neon sign: each word is a tube that flickers on in turn (see .neon-tube in index.css). */}
        <p
          className="neon-tube neon-tube--blue font-heading text-xl md:text-2xl lg:text-3xl uppercase tracking-[0.3em] mb-4 rtl:text-2xl md:rtl:text-3xl lg:rtl:text-4xl"
          style={{ "--ignite-delay": "0s", "--hum-duration": "4.6s" } as CSSProperties}
        >
          {t("welcome")}
        </p>
        <h1 className="font-heading text-[min(12vw,3rem)] md:text-7xl lg:text-8xl font-black mb-8 md:mb-10 max-md:[@media(max-height:760px)]:mb-5 rtl:leading-[1.35] md:rtl:mb-12">
          <span
            className="neon-tube neon-tube--blue"
            style={{ "--ignite-delay": "0.2s", "--hum-duration": "3.4s" } as CSSProperties}
          >
            {t("brandA")}
          </span>{" "}
          <span
            className="neon-tube neon-tube--pink rtl:whitespace-nowrap"
            style={{ "--ignite-delay": "0.4s", "--hum-duration": "4s" } as CSSProperties}
          >
            {t("brandB")}
          </span>
        </h1>
        <div className="mb-12 md:mb-16 max-md:[@media(max-height:760px)]:mb-8 opacity-0 animate-fade-up [animation-delay:0.3s]">
          <p
            ref={sloganRef}
            lang="ar"
            dir="rtl"
            className="font-arabic text-[min(7vw,1.75rem)] sm:text-4xl lg:text-5xl font-bold text-white leading-snug [text-wrap:balance] [word-spacing:0.12em]"
            style={{ textShadow: "0 0 18px rgb(177 77 255 / 0.55), 0 0 40px rgb(255 43 214 / 0.25)" }}
          >
            سيب الدنيا برّه.. وادخل العب
          </p>
        </div>
        {/* Neon-tube buttons, matching the sign above (see .neon-btn in index.css). */}
        <div className="flex flex-col items-center gap-8 md:gap-10 max-md:[@media(max-height:760px)]:gap-5 opacity-0 animate-fade-up [animation-delay:0.45s]">
          <div className="flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row">
            <a
              href={whatsappHref(t("bookMsg"))}
              target="_blank"
              rel="noopener noreferrer"
              className="neon-btn neon-btn--pink"
            >
              <MessageCircle size={20} strokeWidth={2.5} />
              {t("book")}
            </a>
            <a href="#pcs" className="neon-btn neon-btn--blue">
              {t("rooms")}
              <ChevronDown size={20} strokeWidth={2.5} />
            </a>
          </div>
          <a
            href={MAP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 font-body text-lg md:text-2xl font-bold uppercase tracking-[0.12em] text-white/85 transition-colors hover:text-white"
            style={{ textShadow: "0 0 12px rgb(46 168 255 / 0.5)" }}
          >
            <MapPin size={24} strokeWidth={2.5} className="text-[#2ea8ff]" />
            {t("directions")}
          </a>
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#pcs"
        aria-label={t("cue")}
        className="relative z-20 mt-10 max-md:[@media(max-height:760px)]:mt-6 flex flex-col items-center gap-2 opacity-0 animate-fade-up [animation-delay:0.8s] md:absolute md:bottom-8 md:left-1/2 md:mt-0 md:-translate-x-1/2 md:gap-3 [@media(max-height:760px)]:md:bottom-3 [@media(max-height:760px)]:md:gap-1.5 [@media(max-height:700px)]:md:hidden"
      >
        {/* "يلا" in Volt blue, "بينا" in pink, each its own tube like the title. */}
        <span
          lang="ar"
          dir="rtl"
          className="whitespace-nowrap font-arabic text-2xl font-extrabold md:text-3xl lg:text-4xl [@media(max-height:760px)]:md:text-3xl"
        >
          <span
            className="neon-tube neon-tube--blue"
            style={{ "--ignite-delay": "1s", "--hum-duration": "3.4s" } as CSSProperties}
          >
            يلا
          </span>{" "}
          <span
            className="neon-tube neon-tube--pink"
            style={{ "--ignite-delay": "1.2s", "--hum-duration": "4s" } as CSSProperties}
          >
            بينا
          </span>
        </span>
        <span className="neon-ring flex h-11 w-11 items-center justify-center rounded-full lg:h-14 lg:w-14 [@media(max-height:760px)]:lg:h-11 [@media(max-height:760px)]:lg:w-11">
          <ChevronDown size={24} strokeWidth={2.5} className="text-[#cfeaff] motion-safe:animate-bounce" />
        </span>
      </a>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
