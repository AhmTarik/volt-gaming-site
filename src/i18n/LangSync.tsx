import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { langFromPath, localePath, storedLang, stripLang } from "@/i18n";

/**
 * Keeps <html lang/dir> in sync with the URL, and on a first visit to an English page
 * sends Arabic-language phones to the Arabic version (once; the visitor's own choice wins).
 */
export const LangSync = () => {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const lang = langFromPath(pathname);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";

    // hreflang alternates so search engines index both versions.
    const base = stripLang(pathname);
    const links: [string, string][] = [
      ["en", localePath("en", base)],
      ["ar", localePath("ar", base)],
      ["x-default", localePath("en", base)],
    ];
    document.querySelectorAll("link[data-hreflang]").forEach((l) => l.remove());
    for (const [hl, href] of links) {
      const l = document.createElement("link");
      l.rel = "alternate";
      l.hreflang = hl;
      l.href = new URL(href, location.origin).href;
      l.dataset.hreflang = "1";
      document.head.appendChild(l);
    }
  }, [lang, pathname]);

  useEffect(() => {
    if (lang === "ar" || storedLang()) return;
    const prefersArabic = (navigator.languages?.[0] ?? navigator.language ?? "").toLowerCase().startsWith("ar");
    if (prefersArabic) navigate(localePath("ar", pathname) + search + hash, { replace: true });
    // Only on the first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
