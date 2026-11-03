import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        // Side-by-side layout of the scroll film (src/experience): wide AND landscape,
        // so a portrait tablet gets the stacked phone layout.
        cine: { raw: "(min-width: 768px) and (min-aspect-ratio: 1/1)" },
      },
      fontFamily: {
        heading: ["Orbitron", "Changa", "sans-serif"],
        body: ["Rajdhani", "Changa", "sans-serif"],
        arabic: ["Changa", "sans-serif"],
        // Redesign (src/volt): see docs/redesign-plan.md §4
        archivo: ["Archivo", "system-ui", "sans-serif"],
        cairo: ["Cairo", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // 3D lounge HUD palette (mirrors COLORS in src/lounge/stations.ts)
        // Redesign palette (src/volt), sampled from the venue photos. docs/redesign-plan.md §3
        site: {
          desk: "#DCDDE6", // page background
          wall: "#14121F", // text on desk, photo bands
          sticker: "#F2B100", // PC numbers + the one primary button ONLY
          ring: "#5B2BC4", // links, focus, selected states on desk
          chalk: "#F4F5F6", // text on wall bands, form fields
          slate: "#4A5360", // secondary text on desk
        },
        volt: {
          bg: "#0d0f17",
          metal: "#1a1d29",
          cyan: "#00f0ff",
          magenta: "#ff007f",
          purple: "#8b5cf6",
        },
        neon: {
          purple: "hsl(var(--neon-purple))",
          blue: "hsl(var(--neon-blue))",
          red: "hsl(var(--neon-red))",
          cyan: "hsl(var(--neon-cyan))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.6s ease-out forwards",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
