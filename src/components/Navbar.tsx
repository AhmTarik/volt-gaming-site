import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, MessageCircle, X } from "lucide-react";
import VoltSpark from "@/components/VoltSpark";
import { FLAGS } from "@/config/flags";
import { whatsappHref } from "@/volt/whatsapp";
import { welcomeOfferActive } from "@/volt/content";
import { localePath, rememberLang, stripLang, tr, useLang, type Text } from "@/i18n";

/** New home (FLAGS.homeExperience): links jump to the sections of the rooms film. */
const experienceLinks: { label: Text; href: string; isRoute: boolean }[] = [
  { label: { en: "Home", ar: "الرئيسية" }, href: "/", isRoute: true },
  { label: { en: "Ultra", ar: "ألترا" }, href: "#ultra", isRoute: false },
  { label: { en: "Volt", ar: "فولت" }, href: "#volt", isRoute: false },
  { label: { en: "Sim Racing", ar: "سيم ريسينج" }, href: "#sim-racing", isRoute: false },
  // Only while the welcome offer runs (the section hides after its last day).
  ...(welcomeOfferActive() ? [{ label: { en: "Offers", ar: "العروض" }, href: "#offers", isRoute: false }] : []),
  { label: { en: "Find us", ar: "مكاننا" }, href: "#contact", isRoute: false },
];

const oldLinks: { label: Text; href: string; isRoute: boolean }[] = [
  { label: { en: "Home", ar: "الرئيسية" }, href: "/", isRoute: true },
  { label: { en: "Our PCs", ar: "أجهزتنا" }, href: "#pcs", isRoute: false },
  { label: { en: "Simulator", ar: "السيميوليتور" }, href: "#simulator", isRoute: false },
  // Only while the welcome offer runs (the section hides after its last day).
  ...(welcomeOfferActive() ? [{ label: { en: "Offers", ar: "العروض" }, href: "#offers", isRoute: false }] : []),
  { label: { en: "Ultra Rooms", ar: "أوض ألترا" }, href: "/ultra-rooms", isRoute: true },
  { label: { en: "Volt Rooms", ar: "أوض فولت" }, href: "/volt-rooms", isRoute: true },
  { label: { en: "Simulator", ar: "السيميوليتور" }, href: "/simulator", isRoute: true },
  { label: { en: "Book Now", ar: "احجز دلوقتي" }, href: "#booking", isRoute: false },
];

const navLinks = FLAGS.homeExperience ? experienceLinks : oldLinks;

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const lang = useLang();
  const home = localePath(lang, "/");
  const onHome = location.pathname === home;
  const other = lang === "ar" ? "en" : "ar";
  /** Same page and section in the other language. */
  const switchHref = localePath(other, stripLang(location.pathname)) + location.hash;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkHref = (href: string, isRoute: boolean) => {
    if (isRoute) return href === "/" ? home : href;
    if (!onHome) return `${home}${href}`;
    return href;
  };

  /** "Home" and the logo: on the home page itself, go back up to the landing hero. */
  const goHome = (e: React.MouseEvent) => {
    setOpen(false);
    if (!onHome) return;
    e.preventDefault();
    if (location.hash) window.history.replaceState(null, "", home);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const bookLink = FLAGS.homeExperience && (
    <a
      href={whatsappHref(tr(lang, { en: "Hi Volt, I'd like to book.", ar: "أهلاً فولت، عايز أحجز." }))}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => setOpen(false)}
      className="neon-btn neon-btn--pink !px-4 !py-2 !text-xs"
    >
      <MessageCircle size={16} />
      {tr(lang, { en: "Book", ar: "احجز" })}
    </a>
  );

  const langSwitch = (
    <Link
      to={switchHref}
      onClick={() => {
        rememberLang(other);
        setOpen(false);
      }}
      hrefLang={other}
      lang={other}
      aria-label={other === "ar" ? "اعرض الموقع بالعربي" : "View the site in English"}
      className="rounded-full border border-white/25 px-3 py-1.5 font-body text-sm font-bold text-white/90 transition-colors hover:border-white/60 hover:text-white"
    >
      {other === "ar" ? "عربي" : "EN"}
    </Link>
  );

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-card py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link
          to={home}
          onClick={goHome}
          className="relative font-heading text-xl font-bold gradient-text tracking-wider"
        >
          <VoltSpark />
          <span className="md:hidden">Volt</span>
          <span className="hidden md:inline">Volt Gaming Center</span>
        </Link>

        <div className="flex items-center gap-4 lg:gap-8">
          {/* Desktop */}
          <ul
            className={`hidden items-center gap-8 ${FLAGS.homeExperience ? "lg:flex" : "xl:flex"}`}
          >
            {navLinks.map((link) => (
              <li key={link.href + link.label.en}>
                {link.isRoute ? (
                  <Link
                    to={linkHref(link.href, true)}
                    onClick={link.href === "/" ? goHome : undefined}
                    className="font-body text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-200 rtl:text-base rtl:font-semibold"
                  >
                    {tr(lang, link.label)}
                  </Link>
                ) : (
                  <a
                    href={linkHref(link.href, link.isRoute)}
                    className="font-body text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-200 rtl:text-base rtl:font-semibold"
                  >
                    {tr(lang, link.label)}
                  </a>
                )}
              </li>
            ))}
          </ul>

          {langSwitch}

          {/* Always-visible booking (new home only). */}
          {bookLink}

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className={`text-foreground ${FLAGS.homeExperience ? "lg:hidden" : "xl:hidden"}`}
            aria-label={tr(lang, { en: "Toggle menu", ar: "القائمة" })}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className={`${FLAGS.homeExperience ? "lg:hidden" : "xl:hidden"} glass-card mt-2 mx-4 max-h-[calc(100svh-5rem)] overflow-y-auto rounded-lg p-4`}
        >
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.href + link.label.en}>
                {link.isRoute ? (
                  <Link
                    to={linkHref(link.href, true)}
                    onClick={link.href === "/" ? goHome : () => setOpen(false)}
                    className="block py-1 font-body text-base rtl:text-lg rtl:font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tr(lang, link.label)}
                  </Link>
                ) : (
                  <a
                    href={linkHref(link.href, link.isRoute)}
                    onClick={() => setOpen(false)}
                    className="block py-1 font-body text-base rtl:text-lg rtl:font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tr(lang, link.label)}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
