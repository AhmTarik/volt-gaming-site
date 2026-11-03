import type { PanelMeta } from "./content";

/** Visible keyboard focus ring (cyan on the dark scene, 2px + offset). */
export const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-volt-bg";

const BTN_BASE =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-center font-heading text-xs font-semibold uppercase tracking-wider transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 " +
  FOCUS;

/** Text on filled buttons is #0d0f17: 12:1 on cyan, 5:1 on magenta (white on magenta would be 3.8:1). */
const BTN_VARIANTS = {
  primary: "bg-volt-cyan text-volt-bg hover:bg-volt-cyan/85",
  magenta: "bg-volt-magenta text-volt-bg hover:bg-volt-magenta/85",
  outline: "border border-volt-cyan/60 text-volt-cyan hover:bg-volt-cyan/10",
  whatsapp: "border border-green-400/60 text-green-300 hover:bg-green-400/10",
  ghost: "text-slate-200 hover:bg-white/10 hover:text-white",
} as const;

export type ButtonVariant = keyof typeof BTN_VARIANTS;

export const buttonClass = (variant: ButtonVariant = "primary", extra = "") =>
  `${BTN_BASE} ${BTN_VARIANTS[variant]} ${extra}`.trim();

export const CARD = "rounded-xl border border-white/10 bg-white/[0.04] p-4";

export const SECTION_LABEL = "font-heading text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-300";

type Accent = PanelMeta["accent"];

export const ACCENT: Record<Accent, { border: string; text: string; bar: string; glow: string; chip: string }> = {
  cyan: {
    border: "border-volt-cyan/40",
    text: "text-volt-cyan",
    bar: "bg-volt-cyan",
    glow: "shadow-[0_0_48px_-16px] shadow-volt-cyan/70",
    chip: "border-volt-cyan/40 bg-volt-cyan/10 text-volt-cyan",
  },
  magenta: {
    border: "border-volt-magenta/50",
    text: "text-pink-300",
    bar: "bg-volt-magenta",
    glow: "shadow-[0_0_48px_-16px] shadow-volt-magenta/70",
    chip: "border-volt-magenta/50 bg-volt-magenta/10 text-pink-300",
  },
  purple: {
    border: "border-volt-purple/50",
    text: "text-violet-300",
    bar: "bg-volt-purple",
    glow: "shadow-[0_0_48px_-16px] shadow-volt-purple/70",
    chip: "border-volt-purple/50 bg-volt-purple/10 text-violet-300",
  },
};
