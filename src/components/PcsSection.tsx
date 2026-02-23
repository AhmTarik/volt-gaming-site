import { Monitor, Cpu, Armchair, Gauge } from "lucide-react";

interface PcSpec {
  icon: React.ReactNode;
  text: string;
}

interface PcCardProps {
  title: string;
  emoji: string;
  specs: PcSpec[];
  premium?: boolean;
}

const PcCard = ({ title, emoji, specs, premium }: PcCardProps) => (
  <div
    className={`glass-card rounded-2xl p-8 flex flex-col transition-transform duration-300 hover:-translate-y-2 ${
      premium ? "neon-glow-purple border border-primary/30" : "neon-glow-blue border border-secondary/20"
    }`}
  >
    {premium && (
      <span className="self-start px-3 py-1 rounded-full text-xs font-heading uppercase tracking-wider bg-primary/20 text-primary mb-4">
        Premium
      </span>
    )}
    <h3 className="font-heading text-2xl md:text-3xl font-bold mb-6">
      {emoji} {title}
    </h3>
    <ul className="flex flex-col gap-4 mb-8 flex-1">
      {specs.map((spec, i) => (
        <li key={i} className="flex items-center gap-3 text-muted-foreground">
          <span className={premium ? "text-primary" : "text-secondary"}>{spec.icon}</span>
          <span className="font-body text-lg">{spec.text}</span>
        </li>
      ))}
    </ul>
    <a
      href="#booking"
      className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-heading text-sm uppercase tracking-wider transition-colors ${
        premium
          ? "bg-primary text-primary-foreground hover:opacity-90"
          : "bg-secondary text-secondary-foreground hover:opacity-90"
      }`}
    >
      Book This Setup
    </a>
  </div>
);

const PcsSection = () => {
  const ultraSpecs: PcSpec[] = [
    { icon: <Armchair size={20} />, text: "Cooler Master Gaming Chair" },
    { icon: <Monitor size={20} />, text: "240Hz Samsung Monitor" },
    { icon: <Gauge size={20} />, text: "NVIDIA RTX 4060" },
    { icon: <Cpu size={20} />, text: "Intel i5 12th Gen" },
  ];

  const voltSpecs: PcSpec[] = [
    { icon: <Armchair size={20} />, text: "Standard Gaming Chair" },
    { icon: <Monitor size={20} />, text: "180Hz Acer Monitor" },
    { icon: <Gauge size={20} />, text: "NVIDIA RTX 3050" },
    { icon: <Cpu size={20} />, text: "Intel i5 12th Gen" },
  ];

  return (
    <section id="pcs" className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-4 gradient-text">
          Our PCs
        </h2>
        <p className="text-center text-muted-foreground text-lg mb-16 max-w-xl mx-auto">
          Choose your weapon. Every station is built for performance.
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          <PcCard title="Ultra PC" emoji="🔥" specs={ultraSpecs} premium />
          <PcCard title="Volt PC" emoji="⚡" specs={voltSpecs} />
        </div>
      </div>
    </section>
  );
};

export default PcsSection;
