import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const WHATSAPP_NUMBER = "201500732070";
const MAP_LINK = "https://maps.app.goo.gl/7fjgL28b1Fx3qKQa6";

interface SimulatorStation {
  id: number;
  name: string;
  images: string[];
}

const EQUIPMENT = [
  { emoji: "🏁", name: "Moza R5 Wheel" },
  { emoji: "🔥", name: "Meca Evo Handbrake" },
  { emoji: "⚙️", name: "ESR Shifter" },
];

const SIMULATOR_STATIONS: SimulatorStation[] = [
  {
    id: 1,
    name: "Simulator 1",
    images: ["/images/sim-pc.jpg", "/images/sim-pc.jpg", "/images/sim-pc.jpg", "/images/sim-pc.jpg"],
  },
  {
    id: 2,
    name: "Simulator 2",
    images: ["/images/sim-pc.jpg", "/images/sim-pc.jpg", "/images/sim-pc.jpg", "/images/sim-pc.jpg"],
  },
];

function buildWhatsAppLink(stationName: string): string {
  const text = encodeURIComponent(
    `Hello Volt Gaming Center,\nI would like to book ${stationName}.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

const SWIPE_THRESHOLD = 50;

const SimulatorRooms = () => {
  const [selectedStation, setSelectedStation] = useState<SimulatorStation>(SIMULATOR_STATIONS[0]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const stationImages = selectedStation.images;
  const mainImage = stationImages[mainImageIndex] ?? stationImages[0];

  const handleStationSelect = useCallback((station: SimulatorStation) => {
    setSelectedStation(station);
    setMainImageIndex(0);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX === null) return;
      const endX = e.changedTouches[0].clientX;
      const delta = touchStartX - endX;
      setTouchStartX(null);
      if (Math.abs(delta) < SWIPE_THRESHOLD) return;
      if (delta > 0) {
        setMainImageIndex((i) => Math.min(stationImages.length - 1, i + 1));
      } else {
        setMainImageIndex((i) => Math.max(0, i - 1));
      }
    },
    [touchStartX, stationImages.length]
  );

  const whatsAppLink = buildWhatsAppLink(selectedStation.name);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <Link
              to="/"
              className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Home
            </Link>
          </div>

          <h1 className="font-heading text-3xl md:text-5xl font-bold text-center mb-4 gradient-text">
            🏎️ Car Simulator
          </h1>
          <p className="text-center text-muted-foreground text-lg mb-12 max-w-xl mx-auto">
            Choose a simulator to view details and book via WhatsApp.
          </p>

          {/* 1. Station Selector */}
          <section className="mb-12">
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:flex-wrap md:overflow-visible md:justify-center">
              {SIMULATOR_STATIONS.map((station) => (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => handleStationSelect(station)}
                  className={`flex-shrink-0 snap-start px-6 py-4 rounded-xl font-heading text-sm uppercase tracking-wider transition-all duration-200 min-w-[140px] md:min-w-0 ${
                    selectedStation.id === station.id
                      ? "glass-card neon-glow-red border-2 border-accent text-accent py-5 text-base md:py-6 md:text-lg"
                      : "glass-card border border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"
                  }`}
                >
                  {station.name}
                </button>
              ))}
            </div>
          </section>

          {/* 2. Gallery */}
          <section className="mb-12">
            <div className="glass-card rounded-2xl overflow-hidden neon-glow-red border border-accent/20">
              <div
                className="aspect-video w-full bg-muted flex items-center justify-center overflow-hidden touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={mainImage}
                  alt={`${selectedStation.name} view ${mainImageIndex + 1}`}
                  className="w-full h-full object-cover pointer-events-none select-none"
                />
              </div>
              <div className="flex gap-2 p-3 overflow-x-auto">
                {stationImages.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMainImageIndex(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      mainImageIndex === i
                        ? "border-accent ring-2 ring-accent/30"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 3. Station Details */}
          <section className="mb-12">
            <div className="glass-card rounded-2xl p-8 neon-glow-red border border-accent/20">
              <div className="flex flex-col items-center gap-4 mb-6 sm:grid sm:grid-cols-3 sm:items-center">
                <h2 className="font-heading text-2xl md:text-3xl font-bold sm:text-left sm:col-start-1">
                  {selectedStation.name}
                </h2>
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-xl md:text-2xl font-bold bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 neon-glow-cyan flex-shrink-0 sm:col-start-2 sm:justify-self-center">
                  1 Racing Sim
                </span>
              </div>
              <h3 className="font-heading text-base md:text-lg uppercase tracking-wider text-muted-foreground mb-4">
                Equipment
              </h3>
              <ul className="grid sm:grid-cols-3 gap-3">
                {EQUIPMENT.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center gap-3 text-muted-foreground font-body text-lg"
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="font-body text-foreground text-lg">{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 4. Booking */}
          <section className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full sm:w-auto md:max-w-md glass-card rounded-2xl p-6 neon-glow-green border border-green-500/20 hover:-translate-y-1 transition-transform font-heading text-lg uppercase tracking-wider text-green-500 hover:text-green-400"
            >
              <MessageCircle size={24} />
              Book Now
            </a>
            <a
              href={MAP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full sm:w-auto md:max-w-md glass-card rounded-2xl p-6 neon-glow-blue border border-secondary/20 hover:-translate-y-1 transition-transform font-heading text-lg uppercase tracking-wider text-secondary hover:text-secondary/90"
            >
              <MapPin size={24} />
              Location
            </a>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SimulatorRooms;
