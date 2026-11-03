import { MousePointerClick, MessageCircle, Gamepad2 } from "lucide-react";
import Reveal from "@/components/Reveal";

const WHATSAPP_LINK = "https://wa.me/201500732070";

const steps = [
  {
    icon: MousePointerClick,
    title: "Pick your setup",
    text: "Ultra PC, Volt PC, a private room or the racing simulator.",
    tone: "text-primary bg-primary/20 border-primary/30 neon-glow-purple",
  },
  {
    icon: MessageCircle,
    title: "Message us on WhatsApp",
    text: "Tell us the setup, day and time. We confirm your spot.",
    tone: "text-neon-cyan bg-neon-cyan/15 border-neon-cyan/30 neon-glow-cyan",
  },
  {
    icon: Gamepad2,
    title: "Show up and play",
    text: "Walk in, sit down, and game. Everything is ready for you.",
    tone: "text-secondary bg-secondary/20 border-secondary/30 neon-glow-blue",
  },
];

const HowItWorksSection = () => (
  <section id="how-it-works" className="py-24 px-4">
    <div className="container mx-auto max-w-5xl">
      <Reveal>
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-4 gradient-text">How It Works</h2>
        <p className="text-center text-muted-foreground text-lg mb-16 max-w-xl mx-auto">
          Three steps from couch to controller.
        </p>
      </Reveal>

      <Reveal stagger={0.14} className="grid md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <Reveal key={s.title}>
            <div className="glass-card rounded-2xl p-8 h-full text-center border border-white/5 relative">
              <span className="absolute top-4 left-5 font-heading text-sm text-muted-foreground tabular-nums">
                0{i + 1}
              </span>
              <span className={`mx-auto mb-5 w-16 h-16 rounded-xl border flex items-center justify-center ${s.tone}`}>
                <s.icon size={30} />
              </span>
              <h3 className="font-heading text-lg uppercase tracking-wider mb-3">{s.title}</h3>
              <p className="font-body text-lg text-muted-foreground">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </Reveal>

      <Reveal className="mt-12 text-center" delay={0.1}>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-heading text-sm uppercase tracking-wider bg-green-600 text-white hover:opacity-90 transition-opacity neon-glow-green"
        >
          <MessageCircle size={20} />
          Message us on WhatsApp
        </a>
      </Reveal>
    </div>
  </section>
);

export default HowItWorksSection;
