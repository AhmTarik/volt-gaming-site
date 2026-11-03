/**
 * All real Volt content for the redesign, in one place. Source: the classic site
 * (src/components, src/pages). Do not invent facts: prices, address and hours are
 * unknown and intentionally absent. See docs/redesign-plan.md §1.
 */

export const CONTACT = {
  phoneDisplay: "01500732070",
  /** Egypt country code, no + or spaces (wa.me format). */
  whatsappNumber: "201500732070",
  telHref: "tel:+201500732070",
  mapsHref: "https://maps.app.goo.gl/7fjgL28b1Fx3qKQa6",
  /** Resolved from the Maps link. Street address not supplied yet. */
  area: "New Cairo",
  feedbackFormHref: "https://forms.gle/3re3qsN4VcqLSdR39",
  /** Unknown until the client supplies them — render nothing rather than placeholders. */
  address: null as string | null,
  hours: null as string | null,
};

/**
 * Opening hours (client confirmed 2026-11-03): open 24 hours, except Friday, which opens at 5 PM.
 * Used by the booking form to only offer times when Volt is open.
 */
export const OPENING = {
  /** 0 = Sunday ... 5 = Friday. Hour of the day (0-23) the place opens on that weekday; missing = open all day. */
  opensAt: { 5: 17 } as Partial<Record<number, number>>,
};

export type TierId = "ultra" | "volt";

export interface PcSpecs {
  cpu: string;
  gpu: string;
  ram: string;
  monitor: string;
  keyboard: string;
  mouse: string;
  chair: string;
}

export const TIERS: Record<TierId, { name: string; pcName: string; href: string; specs: PcSpecs }> = {
  ultra: {
    name: "Ultra rooms",
    pcName: "Ultra PC",
    href: "/next/ultra-rooms",
    specs: {
      cpu: "Intel i5-12400F",
      gpu: "NVIDIA RTX 4060",
      ram: "16GB",
      monitor: "Samsung G7, 240Hz",
      keyboard: "Fantech Atom 63",
      // Rooms 2-4. Room 1 overrides it (see ROOMS).
      mouse: "Fantech Blake S Wireless",
      chair: "Cooler Master R1 gaming chair",
    },
  },
  volt: {
    name: "Volt rooms",
    pcName: "Volt PC",
    href: "/next/volt-rooms",
    specs: {
      cpu: "Intel i5 12th gen",
      gpu: "NVIDIA RTX 3050",
      ram: "16GB",
      monitor: "Acer, 180Hz",
      keyboard: "Redragon K552",
      mouse: "Redragon M711 Cobra",
      chair: "Standard gaming chair",
    },
  },
};

export interface Room {
  /** URL-safe id, e.g. "ultra-2". Used as ?room= on the room page. */
  id: string;
  tier: TierId;
  name: string;
  pcCount: number;
  /** Where this room differs from its tier's standard PC specs. */
  specs?: Partial<PcSpecs>;
  /** Smoking rule, when the client has confirmed it. */
  smoking?: SmokingRule;
}

/** "vape-only": no cigarettes, e-cigarettes allowed. "allowed": any kind of smoking. */
export type SmokingRule = "vape-only" | "allowed";

export const ROOMS: Room[] = [
  {
    id: "ultra-1",
    tier: "ultra",
    name: "Ultra Storm",
    pcCount: 5,
    specs: { mouse: "Fantech Helios II Pro XD3V3 Wireless" },
    smoking: "vape-only",
  },
  // ultra-2-03 vs ultra-2-01: client to confirm both show Room 2.
  {
    id: "ultra-2",
    tier: "ultra",
    name: "Ultra Thunder",
    pcCount: 12,
    // Client confirmed 2026-11-02: Room 2 has different peripherals from the other Ultra rooms.
    specs: { keyboard: "Redragon K552" },
    smoking: "vape-only",
  },
  { id: "ultra-3", tier: "ultra", name: "Ultra Plasma", pcCount: 5, smoking: "allowed" },
  // No photos of Room 4 yet.
  { id: "ultra-4", tier: "ultra", name: "Ultra Surge", pcCount: 5, smoking: "allowed" },
  // Which Volt room each photo shows is unconfirmed; split for now.
  {
    id: "volt-1",
    tier: "volt",
    name: "Volt Spark",
    pcCount: 14,
    smoking: "allowed",
  },
  { id: "volt-2", tier: "volt", name: "Volt Charge", pcCount: 10, smoking: "allowed" },
];


export const SIMULATOR = {
  stations: [
    { id: "sim-1", name: "Simulator 1" },
    { id: "sim-2", name: "Simulator 2" },
    // Client confirmed 3 racing sims (2026-11-02).
    { id: "sim-3", name: "Simulator 3" },
  ],
  equipment: ["Moza R5 wheel", "Meca Evo handbrake", "ESR shifter"],
  /** Per station: three screens each. */
  screens: '3 × LG 27" 2K 165Hz',
};

/** From the classic OffersSection, which is currently commented out on the live home. Client to confirm. */
export const OFFERS = [
  { id: "happy-hour", text: "Half price on weekdays, 10 AM to 1 PM.", detail: "Every setup, Monday to Friday." },
  { id: "group", text: "4 or more PCs together: 20% off.", detail: "For the whole group." },
  { id: "tournament", text: "Saturday tournament.", detail: "Top three win prizes." },
];
export const OFFERS_CONFIRMED = false;

export const DURATIONS = [1, 2, 3] as const;

/**
 * Prices in EGP, per PC (per station for the simulator). Client confirmed 2026-11-03.
 * Same price for every room in a tier (assumed; client to confirm).
 */
export interface PricePackage {
  /** Length in minutes. */
  minutes: number;
  price: number;
}

export const PRICING: Record<TierId | "simulator", { hourly: number; packages: PricePackage[] }> = {
  ultra: {
    hourly: 45,
    packages: [
      { minutes: 60, price: 45 },
      { minutes: 300, price: 200 },
      { minutes: 600, price: 370 },
    ],
  },
  volt: {
    hourly: 30,
    packages: [
      { minutes: 60, price: 30 },
      { minutes: 300, price: 130 },
      { minutes: 600, price: 220 },
    ],
  },
  simulator: {
    hourly: 250,
    packages: [
      { minutes: 30, price: 125 },
      { minutes: 60, price: 250 },
    ],
  },
};

/** New-member bonus. Said to the admin at the counter while registering. */
export const WELCOME_OFFER = {
  code: "VOLT3",
  /** Last day of the offer (inclusive). The section and its navbar link hide after it (client: until 30 Nov 2026). */
  lastDay: new Date(2026, 10, 30),
};

/** True until the end of the offer's last day. */
export const welcomeOfferActive = (now = new Date()) =>
  now < new Date(WELCOME_OFFER.lastDay.getTime() + 86_400_000);
