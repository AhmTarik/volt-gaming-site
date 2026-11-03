import { useRef } from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { CineFilm } from "@/experience/CineFilm";
import { FULL_FILM } from "@/experience/scenes";
import { whatsappHref } from "@/volt/whatsapp";
import { localePath, tr, useLang } from "@/i18n";

const Experience = () => {
  const barRef = useRef<HTMLDivElement>(null);
  const lang = useLang();
  return (
    <div className="bg-black text-white">
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-4 md:px-10 md:py-6">
        <Link to={localePath(lang, "/")} className="flex items-center gap-2 font-heading text-sm font-bold tracking-[0.25em] text-white/90">
          <Zap size={18} className="text-neon-cyan" fill="currentColor" />
          VOLT
        </Link>
        <div className="flex items-center gap-5">
          <Link
            to={localePath(lang, "/")}
            className="hidden font-body text-base font-semibold uppercase tracking-[0.12em] text-white/80 transition-colors hover:text-white sm:block md:text-lg"
          >
            {tr(lang, { en: "Main site", ar: "الموقع الرئيسي" })}
          </Link>
          <a
            href={whatsappHref(tr(lang, { en: "Hi Volt, I'd like to book.", ar: "أهلاً فولت، عايز أحجز." }))}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/40 px-5 py-2.5 font-heading text-xs font-bold uppercase tracking-[0.15em] text-white md:text-sm transition-colors hover:border-neon-cyan hover:text-neon-cyan"
          >
            {tr(lang, { en: "Book", ar: "احجز" })}
          </a>
        </div>
        <div className="absolute inset-x-0 top-0 h-px bg-white/10">
          <div ref={barRef} className="h-full origin-left" style={{ transform: "scaleX(0)", background: "var(--accent, #22d3ee)" }} />
        </div>
      </header>

      <CineFilm film={FULL_FILM[lang]} progressBarRef={barRef} />
    </div>
  );
};

export default Experience;
