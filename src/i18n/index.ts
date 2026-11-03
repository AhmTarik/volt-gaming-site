import { useLocation } from "react-router-dom";

/**
 * Two languages, picked by URL: "/..." is English, "/ar/..." is Arabic.
 * Copy lives next to the component that shows it, as { en, ar } pairs (see `tr`).
 */
export type Lang = "en" | "ar";
export type Text = Record<Lang, string>;

const STORE_KEY = "volt-lang";

export const langFromPath = (pathname: string): Lang =>
  pathname === "/ar" || pathname.startsWith("/ar/") ? "ar" : "en";

/** Path without the language prefix: "/ar/experience" -> "/experience". */
export const stripLang = (pathname: string) =>
  langFromPath(pathname) === "ar" ? pathname.slice(3) || "/" : pathname;

/** Same page in a language: localePath("ar", "/experience") -> "/ar/experience". */
export const localePath = (lang: Lang, path: string) => {
  if (lang === "en") return path;
  return path === "/" ? "/ar" : `/ar${path}`;
};

export const useLang = (): Lang => langFromPath(useLocation().pathname);

/** Pick the copy for the current language. */
export const tr = (lang: Lang, text: Text) => text[lang];

export const rememberLang = (lang: Lang) => {
  try {
    localStorage.setItem(STORE_KEY, lang);
  } catch {
    /* private mode: fine, we just won't remember */
  }
};

export const storedLang = (): Lang | null => {
  try {
    const v = localStorage.getItem(STORE_KEY);
    return v === "ar" || v === "en" ? v : null;
  } catch {
    return null;
  }
};

