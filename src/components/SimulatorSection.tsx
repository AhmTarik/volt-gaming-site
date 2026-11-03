import { Link } from "react-router-dom";
import Reveal from "@/components/Reveal";
import PriceList from "@/components/PriceList";
import simulatorBg from "@/assets/simulator-bg.jpg";

const SimulatorSection = () => {
  const equipment = [
    { emoji: "🏁", name: "Moza R5 Wheel" },
    { emoji: "🔥", name: "Meca Evo Handbrake" },
    { emoji: "⚙️", name: "ESR Shifter" },
  ];

  return (
    <section id="simulator" className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={simulatorBg}
          alt="Racing simulator setup"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      <div className="relative z-10 container mx-auto max-w-4xl text-center">
        <Reveal>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4">
            🏎️ <span className="gradient-text">Car Simulator</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto">
            Feel the adrenaline. Professional-grade racing simulator for the ultimate driving experience.
          </p>
        </Reveal>

        <Reveal stagger={0.08} className="grid grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-12">
          {equipment.map((item) => (
            <Reveal key={item.name}>
            <div
              className="glass-card rounded-xl px-1 py-3 sm:p-6 h-full neon-glow-red border border-accent/20 hover:-translate-y-1 transition-transform duration-300"
            >
              <span className="text-2xl sm:text-3xl mb-2 sm:mb-3 block">{item.emoji}</span>
              <p className="font-heading text-[10px] sm:text-lg uppercase tracking-normal sm:tracking-wider break-words">{item.name}</p>
            </div>
            </Reveal>
          ))}
        </Reveal>

        <Reveal>
          <div className="glass-card rounded-2xl p-6 md:p-8 neon-glow-red border border-accent/20 max-w-md mx-auto mb-12 text-left">
            <PriceList tier="simulator" />
          </div>
        </Reveal>

        <Reveal>
        <Link
          to="/simulator"
          className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-heading text-sm uppercase tracking-wider bg-accent text-accent-foreground hover:opacity-90 transition-opacity neon-glow-red"
        >
          Book Simulator
        </Link>
        </Reveal>
      </div>
    </section>
  );
};

export default SimulatorSection;
