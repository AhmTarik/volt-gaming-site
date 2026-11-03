import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Cpu, Gauge, Monitor, Keyboard, Mouse, Armchair, MemoryStick, MessageCircle, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LazySetupBreakdown from "@/components/ultra/LazySetupBreakdown";

const WHATSAPP_NUMBER = "201500732070";
const MAP_LINK = "https://maps.app.goo.gl/7fjgL28b1Fx3qKQa6";

interface RoomSpecs {
  cpu: string;
  gpu: string;
  ram: string;
  monitor: string;
  keyboard: string;
  mouse: string;
  chair: string;
}

interface UltraRoom {
  id: number;
  name: string;
  pcCount: number;
  images: string[];
  specs: RoomSpecs;
}

const defaultSpecs: RoomSpecs = {
  cpu: "i5-12400F",
  gpu: "RTX 4060",
  ram: "16GB",
  monitor: "Samsung G7 240Hz",
  keyboard: "Mechanical Red Switch",
  mouse: "Glorious Gaming Mouse",
  chair: "Cooler Master Gaming Chair",
};

const ULTRA_ROOMS: UltraRoom[] = [
  {
    id: 1,
    name: "Ultra Room 1",
    pcCount: 5,
    images: [
      "/images/ultra-1/ultra1-1.jpg",
      "/images/ultra-1/ultra1-2.jpg",
      "/images/ultra-1/ultra1-3.jpg",
      "/images/ultra-1/ultra1-4.jpg",
      "/images/ultra-1/ultra1-5.jpg",
    ],
    specs: defaultSpecs,
  },
  {
    id: 2,
    name: "Ultra Room 2",
    pcCount: 12,
    images: [
      "/images/ultra-2/ultra2-1.jpeg",
      "/images/ultra-2/ultra2-2.jpeg",
      "/images/ultra-2/ultra2-3.jpeg",
    ],
    specs: defaultSpecs,
  },
  {
    id: 3,
    name: "Ultra Room 3",
    pcCount: 5,
    images: [
      "/images/ultra-3/ultra3-1.jpg",
      "/images/ultra-3/ultra3-2.jpg",
      "/images/ultra-3/ultra3-3.jpg",
    ],
    specs: defaultSpecs,
  },
  {
    id: 4,
    name: "Ultra Room 4",
    pcCount: 5,
    images: [
      "/images/ultra-3/ultra3-1.jpg",
      "/images/ultra-3/ultra3-2.jpg",
      "/images/ultra-3/ultra3-3.jpg",
    ],
    specs: defaultSpecs,
  },
];

function buildWhatsAppLink(roomName: string): string {
  const text = encodeURIComponent(
    `Hello Volt Gaming Center,\nI would like to book ${roomName}.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

const specEntries: { key: keyof RoomSpecs; label: string; icon: React.ReactNode }[] = [
  { key: "cpu", label: "CPU", icon: <Cpu size={20} /> },
  { key: "gpu", label: "GPU", icon: <Gauge size={20} /> },
  { key: "ram", label: "RAM", icon: <MemoryStick size={20} /> },
  { key: "monitor", label: "Monitor", icon: <Monitor size={20} /> },
  { key: "keyboard", label: "Keyboard", icon: <Keyboard size={20} /> },
  { key: "mouse", label: "Mouse", icon: <Mouse size={20} /> },
  { key: "chair", label: "Chair", icon: <Armchair size={20} /> },
];

const SWIPE_THRESHOLD = 50;

const UltraRooms = () => {
  const [selectedRoom, setSelectedRoom] = useState<UltraRoom>(ULTRA_ROOMS[0]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const roomImages = selectedRoom.images;
  const mainImage = roomImages[mainImageIndex] ?? roomImages[0];

  const handleRoomSelect = useCallback((room: UltraRoom) => {
    setSelectedRoom(room);
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
        setMainImageIndex((i) => Math.min(roomImages.length - 1, i + 1));
      } else {
        setMainImageIndex((i) => Math.max(0, i - 1));
      }
    },
    [touchStartX, roomImages.length]
  );

  const whatsAppLink = buildWhatsAppLink(selectedRoom.name);

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
            Ultra Rooms
          </h1>
          <p className="text-center text-muted-foreground text-lg mb-12 max-w-xl mx-auto">
            Choose a room to view details and book via WhatsApp.
          </p>

          {/* 1. Room Selector */}
          <section className="mb-12">
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:flex-wrap md:overflow-visible md:justify-center">
              {ULTRA_ROOMS.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => handleRoomSelect(room)}
                  className={`flex-shrink-0 snap-start px-6 py-4 rounded-xl font-heading text-sm uppercase tracking-wider transition-all duration-200 min-w-[140px] md:min-w-0 ${
                    selectedRoom.id === room.id
                      ? "glass-card neon-glow-purple border-2 border-primary text-primary py-5 text-base md:py-6 md:text-lg"
                      : "glass-card border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {room.name}
                </button>
              ))}
            </div>
          </section>

          {/* 2. Gallery */}
          <section className="mb-12">
            <div className="glass-card rounded-2xl overflow-hidden neon-glow-blue border border-secondary/20">
              <div
                className="aspect-video w-full bg-muted flex items-center justify-center overflow-hidden touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={mainImage}
                  alt={`${selectedRoom.name} view ${mainImageIndex + 1}`}
                  className="w-full h-full object-cover pointer-events-none select-none"
                />
              </div>
              <div className="flex gap-2 p-3 overflow-x-auto">
                {roomImages.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMainImageIndex(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      mainImageIndex === i
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 3. Room Details */}
          <section className="mb-12">
            <div className="glass-card rounded-2xl p-8 neon-glow-purple border border-primary/20">
              <div className="flex flex-col items-center gap-4 mb-6 sm:grid sm:grid-cols-3 sm:items-center">
                <h2 className="font-heading text-2xl md:text-3xl font-bold sm:text-left sm:col-start-1">
                  {selectedRoom.name}
                </h2>
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-xl md:text-2xl font-bold bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 neon-glow-cyan flex-shrink-0 sm:col-start-2 sm:justify-self-center">
                  {selectedRoom.pcCount} PCs
                </span>
              </div>
              {/* Exploded-view product shot: full-bleed band inside the card, spec list below acts as its legend */}
              <div className="-mx-8 mb-8 border-y border-white/5">
                <LazySetupBreakdown specs={selectedRoom.specs} />
              </div>
              <h3 className="font-heading text-base md:text-lg uppercase tracking-wider text-muted-foreground mb-4">
                PC Specifications
              </h3>
              <ul className="grid sm:grid-cols-2 gap-3">
                {specEntries.map(({ key, label, icon }) => (
                  <li
                    key={key}
                    className="flex items-center gap-3 text-muted-foreground font-body text-lg"
                  >
                    <span className="text-primary">{icon}</span>
                    <span>
                      <strong className="text-foreground">{label}:</strong>{" "}
                      {selectedRoom.specs[key]}
                    </span>
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

export default UltraRooms;
