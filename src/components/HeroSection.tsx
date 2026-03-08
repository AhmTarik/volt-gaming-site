import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const MAP_LINK = "https://maps.app.goo.gl/7fjgL28b1Fx3qKQa6";

const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Gaming café interior with neon lighting"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        <p className="font-heading text-xl md:text-2xl lg:text-3xl uppercase tracking-[0.3em] text-neon-cyan mb-4 neon-text-cyan opacity-0 animate-fade-up">
          Welcome to
        </p>
        <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-black mb-6 gradient-text opacity-0 animate-fade-up [animation-delay:0.15s]">
          Volt Gaming Center
        </h1>
        <p className="font-body text-xl md:text-2xl text-muted-foreground mb-10 opacity-0 animate-fade-up [animation-delay:0.3s]">
          Next Level Gaming Experience
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-up [animation-delay:0.45s]">
          <a
            href="#pcs"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-heading text-sm uppercase tracking-wider bg-primary text-primary-foreground hover:opacity-90 transition-opacity neon-glow-purple"
          >
            View PCs
          </a>
          <Link
            to="/simulator"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-heading text-sm uppercase tracking-wider bg-accent text-accent-foreground hover:opacity-90 transition-opacity neon-glow-red"
          >
            View Car Simulator
          </Link>
          <a
            href={MAP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-heading text-sm uppercase tracking-wider bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity neon-glow-blue"
          >
            <MapPin size={20} />
            Location
          </a>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
