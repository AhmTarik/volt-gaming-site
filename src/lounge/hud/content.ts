import {
  Armchair,
  Clock,
  Cog,
  Cpu,
  CircleDot,
  Gauge,
  Hand,
  Keyboard,
  MemoryStick,
  Monitor,
  Mouse,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { z } from "zod";
import type { StationId } from "../stations";

/* ---------------------------------------------------------------- contact */

export const MAP_LINK = "https://maps.app.goo.gl/7fjgL28b1Fx3qKQa6";
export const PHONE_DISPLAY = "01500732070";
/** wa.me + country code (01 -> Egypt 20), no "+" or spaces. */
export const WHATSAPP_NUMBER = "201500732070";
export const TEL_LINK = `tel:+${WHATSAPP_NUMBER}`;
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

export const buildWhatsAppLink = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const buildRoomWhatsAppLink = (name: string) =>
  buildWhatsAppLink(`Hello Volt Gaming Center,\nI would like to book ${name}.`);

/* ------------------------------------------------------------- panel meta */

export interface PanelMeta {
  kicker: string;
  title: string;
  blurb: string;
  accent: "cyan" | "magenta" | "purple";
}

export const PANEL_META: Record<StationId, PanelMeta> = {
  home: {
    kicker: "Welcome to",
    title: "Volt Gaming Center",
    blurb: "Next Level Gaming Experience",
    accent: "cyan",
  },
  pcs: {
    kicker: "Gaming PCs",
    title: "Our PCs",
    blurb: "Choose your weapon. Every station is built for performance.",
    accent: "cyan",
  },
  simulator: {
    kicker: "Racing",
    title: "Car Simulator",
    blurb: "Feel the adrenaline. Professional-grade racing simulator for the ultimate driving experience.",
    accent: "magenta",
  },
  offers: {
    kicker: "Deals",
    title: "Offers",
    blurb: "Level up your experience with our exclusive deals.",
    accent: "purple",
  },
  rooms: {
    kicker: "Private rooms",
    title: "VIP Rooms",
    blurb: "Choose a room to view details and book via WhatsApp.",
    accent: "purple",
  },
  booking: {
    kicker: "Reception",
    title: "Book Your Session",
    blurb: "Reserve your spot and start gaming.",
    accent: "magenta",
  },
};

/* -------------------------------------------------------------------- PCs */

export interface Spec {
  icon: LucideIcon;
  text: string;
}

export interface PcTier {
  id: "ultra" | "volt";
  name: string;
  premium?: boolean;
  specs: Spec[];
  /** Classic-site page with the full room gallery. */
  href: string;
}

export const PC_TIERS: PcTier[] = [
  {
    id: "ultra",
    name: "Ultra PC",
    premium: true,
    href: "/ultra-rooms",
    specs: [
      { icon: Armchair, text: "Cooler Master Gaming Chair" },
      { icon: Monitor, text: "240Hz Samsung Monitor" },
      { icon: Gauge, text: "NVIDIA RTX 4060" },
      { icon: Cpu, text: "Intel i5 12th Gen" },
    ],
  },
  {
    id: "volt",
    name: "Volt PC",
    href: "/volt-rooms",
    specs: [
      { icon: Armchair, text: "Standard Gaming Chair" },
      { icon: Monitor, text: "180Hz Acer Monitor" },
      { icon: Gauge, text: "NVIDIA RTX 3050" },
      { icon: Cpu, text: "Intel i5 12th Gen" },
    ],
  },
];

/* -------------------------------------------------------------- simulator */

export const SIM_EQUIPMENT: { icon: LucideIcon; name: string }[] = [
  { icon: CircleDot, name: "Moza R5 Wheel" },
  { icon: Hand, name: "Meca Evo Handbrake" },
  { icon: Cog, name: "ESR Shifter" },
];

export const SIM_STATIONS = [{ name: "Simulator 1" }, { name: "Simulator 2" }];

/* ----------------------------------------------------------------- offers */

export interface Offer {
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
  accent: "cyan" | "magenta" | "purple";
}

export const OFFERS: Offer[] = [
  {
    icon: Clock,
    title: "Happy Hour",
    description: "50% off on all setups every weekday from 10 AM to 1 PM.",
    badge: "Mon–Fri",
    accent: "purple",
  },
  {
    icon: Users,
    title: "Group Discount",
    description: "Book 4+ stations together and get 20% off for the whole squad.",
    badge: "4+ Players",
    accent: "cyan",
  },
  {
    icon: Trophy,
    title: "Weekend Tournament",
    description: "Join our weekly tournaments every Saturday. Prizes for top 3 players!",
    badge: "Saturdays",
    accent: "magenta",
  },
];

/* ------------------------------------------------------------- VIP rooms */

export interface RoomSpecs {
  cpu: string;
  gpu: string;
  ram: string;
  monitor: string;
  keyboard: string;
  mouse: string;
  chair: string;
}

export const ROOM_SPEC_ENTRIES: { key: keyof RoomSpecs; label: string; icon: LucideIcon }[] = [
  { key: "cpu", label: "CPU", icon: Cpu },
  { key: "gpu", label: "GPU", icon: Gauge },
  { key: "ram", label: "RAM", icon: MemoryStick },
  { key: "monitor", label: "Monitor", icon: Monitor },
  { key: "keyboard", label: "Keyboard", icon: Keyboard },
  { key: "mouse", label: "Mouse", icon: Mouse },
  { key: "chair", label: "Chair", icon: Armchair },
];

export interface RoomTier {
  id: "ultra" | "volt";
  label: string;
  specs: RoomSpecs;
  rooms: { name: string; pcCount: number }[];
  /** Classic-site page with photos for these rooms. */
  href: string;
}

export const ROOM_TIERS: RoomTier[] = [
  {
    id: "ultra",
    label: "Ultra Rooms",
    href: "/ultra-rooms",
    specs: {
      cpu: "i5-12400F",
      gpu: "RTX 4060",
      ram: "16GB",
      monitor: "Samsung G7 240Hz",
      keyboard: "Mechanical Red Switch",
      mouse: "Glorious Gaming Mouse",
      chair: "Cooler Master Gaming Chair",
    },
    rooms: [
      { name: "Ultra Room 1", pcCount: 5 },
      { name: "Ultra Room 2", pcCount: 12 },
      { name: "Ultra Room 3", pcCount: 5 },
      { name: "Ultra Room 4", pcCount: 5 },
    ],
  },
  {
    id: "volt",
    label: "Volt Rooms",
    href: "/volt-rooms",
    specs: {
      cpu: "i5-12th Gen",
      gpu: "RTX 3050",
      ram: "16GB",
      monitor: "Acer 180Hz",
      keyboard: "Mechanical",
      mouse: "Gaming Mouse",
      chair: "Standard Gaming Chair",
    },
    rooms: [
      { name: "Volt Room 1", pcCount: 14 },
      { name: "Volt Room 2", pcCount: 10 },
    ],
  },
];

/* ---------------------------------------------------------------- booking */

export const bookingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().min(5, "Phone number is required").max(20),
  setup: z.enum(["ultra", "volt", "simulator"], { required_error: "Select a setup" }),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.enum(["1", "2", "3"], { required_error: "Select duration" }),
});

export type BookingData = z.infer<typeof bookingSchema>;
export type SetupId = BookingData["setup"];

export const SETUP_OPTIONS: { value: SetupId; label: string }[] = [
  { value: "ultra", label: "Ultra PC" },
  { value: "volt", label: "Volt PC" },
  { value: "simulator", label: "Car Simulator" },
];

export const DURATIONS = ["1", "2", "3"] as const;

export const buildBookingMessage = (d: BookingData) => {
  const setup = SETUP_OPTIONS.find((o) => o.value === d.setup)?.label ?? d.setup;
  return [
    "Hello Volt Gaming Center,",
    "I would like to book a session:",
    `Name: ${d.name}`,
    `Phone: ${d.phone}`,
    `Setup: ${setup}`,
    `Date: ${d.date}`,
    `Time: ${d.time}`,
    `Duration: ${d.duration}h`,
  ].join("\n");
};
