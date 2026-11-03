import { PRICING } from "@/volt/content";

type PriceKey = keyof typeof PRICING;

const TONE: Record<PriceKey, { text: string; glow: string }> = {
  ultra: { text: "text-primary", glow: "neon-text-purple" },
  volt: { text: "text-secondary", glow: "neon-text-blue" },
  simulator: { text: "text-accent", glow: "" },
};

const formatLength = (minutes: number) => {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = minutes / 60;
  return hours === 1 ? "1 hour" : `${hours} hours`;
};

/** Hourly headline plus one row per package, with how much each package saves. Prices per PC. */
const PriceList = ({ tier, className = "" }: { tier: PriceKey; className?: string }) => {
  const { hourly, packages } = PRICING[tier];
  const tone = TONE[tier];

  return (
    <div className={className}>
      <p className="flex items-baseline gap-2 mb-4">
        <span
          className={`font-heading text-5xl font-extrabold ${tone.text} ${tone.glow}`}
          style={tier === "simulator" ? { textShadow: "0 0 10px hsl(340 80% 55% / 0.6), 0 0 40px hsl(340 80% 55% / 0.3)" } : undefined}
        >
          {hourly}
        </span>
        <span className="flex flex-col leading-tight text-muted-foreground text-lg">
          EGP / hour
          <span className="text-sm">{tier === "simulator" ? "per seat" : "per PC"}</span>
        </span>
      </p>
      <ul>
        {packages.map(({ minutes, price }) => {
          const save = Math.round((hourly * minutes) / 60 - price);
          return (
            <li
              key={minutes}
              className="flex items-center justify-between gap-3 py-3 border-t border-white/10 text-lg"
            >
              <span>{formatLength(minutes)}</span>
              <span className="flex items-center gap-2 whitespace-nowrap">
                {save > 0 && (
                  <span className="text-sm font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md">
                    Save {save}
                  </span>
                )}
                <strong className="font-heading text-base font-bold">{price} EGP</strong>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PriceList;
