import { CONTACT, PRICING, ROOMS, SIMULATOR, TIERS, type PcSpecs, type SmokingRule } from "@/volt/content";
import type { Lang } from "@/i18n";

/** How a scene hands over to the next one. Mirrors the two moves in the reference video. */
export type TransitionMode = "warp" | "dive";

export type GroupId = "intro" | "ultra" | "volt" | "sim" | "book";

/** A section of the film. Its copy stays on screen while you scroll through its rooms. */
export interface Group {
  id: GroupId;
  /** Name in the section nav; omitted for the intro and booking screens. */
  nav?: string;
  accent: string;
  kicker: string;
  title: [string, string];
  body?: string;
  specs?: SpecRow[];
  /** Total shown next to the title, e.g. "27 PCs". */
  total?: string;
  /** Price list shown for the whole section (same price in every room of a tier). */
  price?: keyof typeof PRICING;
}

/** Element id the home page uses to link to a section of the film (see Navbar). */
export const sectionAnchor = (id: GroupId) => (id === "sim" ? "sim-racing" : id);

/** One spec line. `key` marks tier specs that a single room may override (see Room.specs). */
export interface SpecRow {
  label: string;
  value: string;
  key?: keyof PcSpecs;
}

/** One scroll stop: one photo. */
export interface Scene {
  id: string;
  group: GroupId;
  image: string;
  /** Point the camera pushes toward, in image coordinates (0..1, top-left origin). */
  focal: [number, number];
  /** Present when this stop is a bookable room. */
  room?: {
    name: string;
    /** Name on the room chip, e.g. "Storm". */
    short: string;
    pcs?: number;
    unit?: string;
    note: string;
    bookAs: string;
    hype?: string[];
    smoking?: SmokingRule;
  };
  /** Persistent radial speed lines (0..1). */
  speed?: number;
  /** Overrides the section accent while this stop is on screen (e.g. to match a room's lighting). */
  accent?: string;
}

/** Purple to match the lighting in Ultra Rooms 3 and 4. */
const ROOM_PURPLE = "hsl(280 95% 70%)";

const room = (id: string) => ROOMS.find((r) => r.id === id)!;
const totalPcs = (tier: "ultra" | "volt") =>
  ROOMS.filter((r) => r.tier === tier).reduce((n, r) => n + r.pcCount, 0);

const fmtSpec = (key: keyof PcSpecs, v: string) =>
  key === "gpu" ? v.replace("NVIDIA ", "") : key === "cpu" ? v.replace("Intel ", "") : v;

/**
 * Arabic for spec values. Model and brand names (RTX 4060, Fantech, Samsung...) stay as they are;
 * only the words around them are translated. Values not listed here are shown unchanged.
 */
const AR_VALUES: Record<string, string> = {
  "i5 12th gen": "i5 جيل 12",
  "Samsung G7, 240Hz": "Samsung G7، 240 هرتز",
  "Acer, 180Hz": "Acer، 180 هرتز",
  "Cooler Master R1 gaming chair": "Cooler Master R1",
  "Standard gaming chair": "كرسي جيمنج عادي",
  "Moza R5 wheel": "Moza R5",
  "ESR shifter": "ESR",
  '3 × LG 27" 2K 165Hz': '3 شاشات LG مقاس 27" بدقة 2K و165 هرتز',
};
const localValue = (lang: Lang, v: string) => (lang === "ar" ? (AR_VALUES[v] ?? v) : v);

/** "5 PCs" / "5 أجهزة", "12 جهاز" (Arabic: 3-10 take the plural, 11+ the singular). */
export const pcsLabel = (lang: Lang, n: number) =>
  lang === "en" ? `${n} PCs` : n >= 3 && n <= 10 ? `${n} أجهزة` : `${n} جهاز`;

const SPEC_LABELS: [keyof PcSpecs, Record<Lang, string>][] = [
  ["gpu", { en: "GPU", ar: "كارت الشاشة" }],
  ["cpu", { en: "CPU", ar: "البروسيسور" }],
  ["monitor", { en: "Monitor", ar: "الشاشة" }],
  ["keyboard", { en: "Keyboard", ar: "الكيبورد" }],
  ["mouse", { en: "Mouse", ar: "الماوس" }],
  ["chair", { en: "Chair", ar: "الكرسي" }],
];

const specRows = (lang: Lang, s: PcSpecs): SpecRow[] =>
  SPEC_LABELS.map(([key, label]) => ({ key, label: label[lang], value: localValue(lang, fmtSpec(key, s[key])) }));

/** Arabic room names: the English name written in Arabic letters. */
const AR_ROOM: Record<string, { name: string; short: string }> = {
  "ultra-1": { name: "ألترا ستورم", short: "ستورم" },
  "ultra-2": { name: "ألترا ثاندر", short: "ثاندر" },
  "ultra-3": { name: "ألترا بلازما", short: "بلازما" },
  "ultra-4": { name: "ألترا سيرج", short: "سيرج" },
  "volt-1": { name: "فولت سبارك", short: "سبارك" },
  "volt-2": { name: "فولت تشارج", short: "تشارج" },
};

/** Section copy in one language. */
export const groupsFor = (lang: Lang): Record<GroupId, Group> => {
  const ar = lang === "ar";
  return {
    intro: {
      id: "intro",
      accent: "hsl(185 80% 55%)",
      kicker: ar ? "جيمنج سنتر · القاهرة الجديدة" : `Gaming center · ${CONTACT.area}`,
      title: ar ? ["فولت", "جيمنج سنتر"] : ["VOLT", "GAMING CENTER"],
      body: ar
        ? "أوض ألترا وأوض فولت وسيميوليتور سباقات، كله في مكان واحد."
        : "Ultra rooms, Volt rooms and racing simulators under one roof.",
      specs: [
        { label: ar ? "جهاز جيمنج" : "Gaming PCs", value: String(totalPcs("ultra") + totalPcs("volt")) },
        { label: ar ? "أوضة" : "Rooms", value: String(ROOMS.length) },
        { label: ar ? "سيميوليتور" : "Racing sims", value: String(SIMULATOR.stations.length) },
      ],
    },
    ultra: {
      id: "ultra",
      nav: ar ? "ألترا" : "Ultra",
      accent: "hsl(195 95% 60%)",
      kicker: ar ? "أجهزة ألترا · أعلى فئة" : `${TIERS.ultra.pcName} · top tier`,
      title: ar ? ["غرف", "ألترا"] : ["ULTRA", "ROOMS"],
      total: pcsLabel(lang, totalPcs("ultra")),
      price: "ultra",
      specs: specRows(lang, TIERS.ultra.specs),
    },
    volt: {
      id: "volt",
      nav: ar ? "فولت" : "Volt",
      accent: "hsl(28 100% 58%)",
      kicker: ar ? `أجهزة فولت · ${pcsLabel(lang, totalPcs("volt"))}` : `${TIERS.volt.pcName} · ${totalPcs("volt")} PCs`,
      title: ar ? ["غرف", "فولت"] : ["VOLT", "ROOMS"],
      total: pcsLabel(lang, totalPcs("volt")),
      price: "volt",
      specs: specRows(lang, TIERS.volt.specs),
    },
    sim: {
      id: "sim",
      nav: ar ? "سيم ريسينج" : "Sim racing",
      accent: "hsl(345 90% 60%)",
      kicker: ar ? "سيميوليتور سباقات" : "Racing simulators",
      title: ar ? ["سيم", "ريسينج"] : ["SIM", "RACING"],
      price: "simulator",
      specs: [
        { label: ar ? "الدركسيون" : "Wheel", value: localValue(lang, SIMULATOR.equipment[0]) },
        { label: ar ? "الهاند بريك" : "Handbrake", value: SIMULATOR.equipment[1].replace(/\s*handbrake$/i, "") },
        { label: ar ? "الفتيس" : "Shifter", value: localValue(lang, SIMULATOR.equipment[2]) },
        { label: ar ? "الشاشات في كل محطة" : "Screens per station", value: localValue(lang, SIMULATOR.screens) },
      ],
    },
    book: {
      id: "book",
      accent: "hsl(263 80% 68%)",
      kicker: ar ? `كلمنا أو ابعت واتساب ${CONTACT.phoneDisplay}` : `Call or WhatsApp ${CONTACT.phoneDisplay}`,
      title: ar ? ["مكانك", "جاهز"] : ["YOUR SEAT", "IS READY"],
      body: ar
        ? "قولنا الأوضة والميعاد وإنتو كام، وإحنا نحجزلكم الأجهزة."
        : "Tell us the room, the time and how many of you. We'll hold the PCs.",
    },
  };
};

type RoomCopy = { en: string; ar: string };
const NOTES: Record<string, RoomCopy> = {
  "ultra-1": { en: "Cloud ceiling and RGB towers on the wall.", ar: "سقف سحاب وأبراج RGB على الحيطة." },
  "ultra-2": { en: "The big one. Bring the whole team and take it over.", ar: "الأوضة الكبيرة. هات التيم كله واقفلوها عليكم." },
  "ultra-3": { en: "A smaller room for a tight squad.", ar: "أوضة أصغر لشلة صغيرة." },
  "ultra-4": { en: "Same setup as Plasma, for a tight squad.", ar: "نفس تجهيز بلازما، لشلة صغيرة." },
  "volt-1": { en: "One long row under the orange light strip.", ar: "صف طويل تحت الإضاءة البرتقاني." },
  "volt-2": { en: "Room for your group, side by side.", ar: "مكان لشلتك كلها، جنب بعض." },
};

/** Room block for a scene, in one language. */
const roomCopy = (lang: Lang, id: string): NonNullable<Scene["room"]> => {
  const r = room(id);
  const name = lang === "ar" ? AR_ROOM[id].name : r.name;
  return {
    name,
    short: lang === "ar" ? AR_ROOM[id].short : r.name.replace(/^(Ultra|Volt) /, ""),
    pcs: r.pcCount,
    note: NOTES[id][lang],
    bookAs: name,
    smoking: r.smoking,
  };
};

/** Every scroll stop, in film order, in one language. A Film picks some or all of them. */
export const scenesFor = (lang: Lang): Scene[] => {
  const ar = lang === "ar";
  return [
    { id: "intro", group: "intro", image: "/photos/cine/hall.webp", focal: [0.5, 0.45] },
    { id: "ultra-1", group: "ultra", image: "/photos/cine/ultra-1.webp", focal: [0.42, 0.5], room: roomCopy(lang, "ultra-1") },
    // The big hall with 12 PCs (confirmed by the client as Ultra Room 2).
    { id: "ultra-2", group: "ultra", image: "/photos/cine/hall.webp", focal: [0.5, 0.45], room: roomCopy(lang, "ultra-2") },
    { id: "ultra-3", group: "ultra", image: "/photos/cine/ultra-3.webp", focal: [0.6, 0.48], accent: ROOM_PURPLE, room: roomCopy(lang, "ultra-3") },
    // Placeholder: a copy of Room 3's photo until the client sends Room 4's. Replace the file to update.
    { id: "ultra-4", group: "ultra", image: "/photos/cine/ultra-4.webp", focal: [0.55, 0.5], accent: ROOM_PURPLE, room: roomCopy(lang, "ultra-4") },
    { id: "volt-1", group: "volt", image: "/photos/cine/volt.webp", focal: [0.6, 0.3], room: roomCopy(lang, "volt-1") },
    { id: "volt-2", group: "volt", image: "/photos/cine/volt-2.webp", focal: [0.6, 0.5], room: roomCopy(lang, "volt-2") },
    {
      id: "sim",
      group: "sim",
      image: "/photos/cine/sim.webp",
      focal: [0.45, 0.55],
      speed: 1,
      room: {
        name: ar ? "غرف السيم" : "Sim rooms",
        short: ar ? "السيم" : "Sim",
        pcs: SIMULATOR.stations.length,
        unit: ar ? "محطات سباق" : "Racing stations",
        hype: ar ? ["فورمولا 1", "دريفت", "GT"] : ["Formula 1", "Drift", "GT"],
        note: ar
          ? "اكسر أزمنة لفات F1، أو اعمل دريفت ورا صاحبك، أو نافس بعربيات GT في Assetto Corsa. أو انطلق في طرق Forza Horizon 6."
          : "Chase F1 lap times, link drift lines or battle in GT cars in Assetto Corsa. Or hit the open roads in Forza Horizon 6.",
        bookAs: ar ? "السيميوليتور" : "the racing simulator",
      },
    },
    { id: "book", group: "book", image: "/photos/cine/players.webp", focal: [0.5, 0.5] },
  ];
};

/** Scroll lengths, in viewport heights. */
export const HOLD = 1.0;
export const TRANS = 0.85;
export const SEGMENT = HOLD + TRANS;

export interface TimelineState {
  a: number;
  b: number;
  /** Transition progress from a to b, 0 while holding on a. */
  p: number;
  /** How far through its hold scene a is (0..1). */
  hold: number;
}

/** A spec line as shown in a section: one value per group of rooms that share it. */
export interface SpecCell {
  label: string;
  variants: { value: string; scenes: number[] }[];
}

/** One playable sequence of scroll stops, with everything the page needs to drive it. */
export interface Film {
  scenes: Scene[];
  /** Sections in film order, each with the scene indices it covers. */
  groups: { group: Group; scenes: number[] }[];
  /** Scroll length in viewport heights. */
  total: number;
  sceneStart: (i: number) => number;
  timelineAt: (u: number) => TimelineState;
  /** Moving between rooms of one section is a warp; jumping to a new section is a dive. */
  exitOf: (i: number) => TransitionMode;
  /** Accent colour for a scroll stop: its own, or its section's. */
  accentOf: (i: number) => string;
  specCells: (g: GroupId) => SpecCell[];
  groupIndexOf: (scene: number) => number;
}

export const createFilm = (lang: Lang, ids?: string[]): Film => {
  const GROUPS = groupsFor(lang);
  const all = scenesFor(lang);
  const scenes = ids ? all.filter((s) => ids.includes(s.id)) : all;
  const n = scenes.length;
  const total = n * HOLD + (n - 1) * TRANS;

  const groups: Film["groups"] = [];
  scenes.forEach((s, i) => {
    const last = groups[groups.length - 1];
    if (last && last.group.id === s.group) last.scenes.push(i);
    else groups.push({ group: GROUPS[s.group], scenes: [i] });
  });

  const timelineAt = (u: number): TimelineState => {
    const x = Math.min(Math.max(u, 0), total);
    const i = Math.min(n - 1, Math.floor(x / SEGMENT));
    const local = x - i * SEGMENT;
    if (i === n - 1 || local <= HOLD) {
      return { a: i, b: Math.min(i + 1, n - 1), p: 0, hold: Math.min(local / HOLD, 1) };
    }
    return { a: i, b: i + 1, p: (local - HOLD) / TRANS, hold: 1 };
  };

  const specCells = (g: GroupId): SpecCell[] => {
    const roomScenes = scenes.flatMap((s, i) => (s.group === g && s.room ? [i] : []));
    return (GROUPS[g].specs ?? []).map((row) => {
      const key = row.key;
      if (!key || roomScenes.length === 0) return { label: row.label, variants: [{ value: row.value, scenes: roomScenes }] };
      const byValue = new Map<string, number[]>();
      for (const i of roomScenes) {
        const override = ROOMS.find((r) => r.id === scenes[i].id)?.specs?.[key];
        const value = override ? localValue(lang, fmtSpec(key, override)) : row.value;
        byValue.set(value, [...(byValue.get(value) ?? []), i]);
      }
      return { label: row.label, variants: [...byValue].map(([value, scenes]) => ({ value, scenes })) };
    });
  };

  return {
    scenes,
    groups,
    total,
    sceneStart: (i) => i * SEGMENT,
    timelineAt,
    exitOf: (i) => (scenes[i + 1] && scenes[i + 1].group === scenes[i].group ? "warp" : "dive"),
    accentOf: (i) => scenes[i].accent ?? GROUPS[scenes[i].group].accent,
    specCells,
    groupIndexOf: (scene) => groups.findIndex((g) => g.scenes.includes(scene)),
  };
};

const HOME_IDS = scenesFor("en")
  .filter((s) => s.group !== "intro" && s.group !== "book")
  .map((s) => s.id);

/** /experience: intro, every room, booking screen. */
export const FULL_FILM: Record<Lang, Film> = { en: createFilm("en"), ar: createFilm("ar") };

/** Home page (behind the homeExperience flag): rooms only. The hero above and the booking section below already cover the rest. */
export const HOME_FILM: Record<Lang, Film> = { en: createFilm("en", HOME_IDS), ar: createFilm("ar", HOME_IDS) };
