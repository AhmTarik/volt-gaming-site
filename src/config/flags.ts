/**
 * Feature flags.
 *
 * Each flag has a default from an env var (set in `.env.local`, or in the hosting
 * dashboard for production), and can be overridden per visit with a URL query
 * parameter so it can be previewed without a rebuild:
 *
 *   http://localhost:5199/?homeExperience=on    force on
 *   http://localhost:5199/?homeExperience=off   force off
 *
 * Env changes need a dev-server restart; URL overrides apply on reload.
 */

const urlOverride = (name: string): boolean | undefined => {
  if (typeof window === "undefined") return undefined;
  const v = new URLSearchParams(window.location.search).get(name)?.toLowerCase();
  if (v === "on" || v === "1" || v === "true") return true;
  if (v === "off" || v === "0" || v === "false") return false;
  return undefined;
};

/** Unset means on: only an explicit "off" / "0" / "false" turns a flag off. */
const envOn = (value: string | undefined) => !(value === "off" || value === "0" || value === "false");

export const FLAGS = {
  /**
   * Home page: replace the "Our PCs" and "Simulator" sections with the scroll film
   * from /experience (Ultra rooms → Volt rooms → Sim racing).
   * Env: VITE_FLAG_HOME_EXPERIENCE=on|off (default on). URL: ?homeExperience=on|off
   */
  homeExperience: urlOverride("homeExperience") ?? envOn(import.meta.env.VITE_FLAG_HOME_EXPERIENCE),
};
