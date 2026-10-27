import { site } from "@/config/site";

/** Brand kit page content: boilerplate, downloads, palette, type and usage rules. */

const kit = "/brand-kit";

export const brandKitZip = { href: `${kit}/mimi-brand-kit.zip`, size: "4.4 MB" };
export const stickersZip = { href: `${kit}/mimi-stickers.zip`, size: "4.1 MB" };

export const boilerplate = {
  oneLine: "Mimi is a team of AI agents on WhatsApp for FMCG distributors and brands in Nigeria.",
  short:
    "Mimi is a team of AI agents on WhatsApp for FMCG distributors and brands. It collects what shops owe, catches leaks on the route and shows brands what really sold, from one shop book that shops own. Shops use it free.",
  long: `Mimi is a team of AI agents on WhatsApp for FMCG distributors and brands in Nigeria. Reps and shops keep using the app they already use, while Mimi keeps one shared shop book of deliveries, payments and debts. A payment counts as verified only when the bank alert, the statement and the shop agree, so fake alerts get flagged. Mimi never holds or moves money, distributors set every credit limit, and shops own their data. Mimi is built by ${site.legalName} (${site.registration}) in ${site.location}.`,
};

export const brandFacts = [
  { k: "Name", v: "Mimi" },
  { k: "Company", v: `${site.legalName}, ${site.registration}` },
  { k: "Based in", v: site.location },
  { k: "Founder", v: site.founder },
  { k: "Press", v: site.contactEmail },
] as const;

export type BrandAsset = {
  name: string;
  note: string;
  preview: string;
  /** Background the preview tile sits on. */
  bg: "dark" | "light";
  wide?: boolean;
  files: { label: string; href: string }[];
};

export const brandAssets: BrandAsset[] = [
  {
    name: "Logo, on dark",
    note: "Default. Use on Obsidian or any dark surface.",
    preview: `${kit}/mimi-logo-on-dark.svg`,
    bg: "dark",
    wide: true,
    files: [
      { label: "SVG", href: `${kit}/mimi-logo-on-dark.svg` },
      { label: "PNG", href: `${kit}/mimi-logo-on-dark.png` },
    ],
  },
  {
    name: "Logo, on light",
    note: "For print, documents and light pages.",
    preview: `${kit}/mimi-logo-on-light.svg`,
    bg: "light",
    wide: true,
    files: [
      { label: "SVG", href: `${kit}/mimi-logo-on-light.svg` },
      { label: "PNG", href: `${kit}/mimi-logo-on-light.png` },
    ],
  },
  {
    name: "Mark, on dark",
    note: "Mimi alone, for avatars and small spaces.",
    preview: `${kit}/mimi-mark-on-dark.svg`,
    bg: "dark",
    files: [
      { label: "SVG", href: `${kit}/mimi-mark-on-dark.svg` },
      { label: "PNG", href: `${kit}/mimi-mark-on-dark.png` },
    ],
  },
  {
    name: "Mark, on light",
    note: "Mimi alone, on light surfaces.",
    preview: `${kit}/mimi-mark-on-light.svg`,
    bg: "light",
    files: [
      { label: "SVG", href: `${kit}/mimi-mark-on-light.svg` },
      { label: "PNG", href: `${kit}/mimi-mark-on-light.png` },
    ],
  },
  {
    name: "App icon",
    note: "Rounded tile for app stores and WhatsApp profiles.",
    preview: `${kit}/mimi-app-icon.svg`,
    bg: "light",
    files: [
      { label: "SVG", href: `${kit}/mimi-app-icon.svg` },
      { label: "PNG", href: `${kit}/mimi-app-icon.png` },
    ],
  },
];

export const palette = [
  { name: "Obsidian", hex: "#101010", use: "Canvas, dark" },
  { name: "Carbon", hex: "#1d1a18", use: "Raised surfaces" },
  { name: "Ash", hex: "#3d3a39", use: "Hairlines" },
  { name: "Granite", hex: "#8a8380", use: "Muted text" },
  { name: "Bone", hex: "#eeeeee", use: "Text on dark" },
  { name: "Chalk", hex: "#fafafa", use: "Canvas, light" },
  { name: "Signal", hex: "#ee6018", use: "Status and marks only" },
] as const;

export const mascotDo = [
  "One colour. Mimi takes the text colour of the surface she sits on.",
  "Keep the slight tilt, the eyes glancing up and right, and the small bow.",
  "Keep clear space of half her height on every side.",
  "Use her where she is working: empty states, waiting, a 404.",
];

export const mascotDont = [
  "No lashes, blush, tail or extra features.",
  "No multicolour bow, no orange Mimi.",
  "Don't stretch, outline, shadow or rotate her further.",
  "Don't place her on busy photos. Use a plain dark or light surface.",
];

export const voiceRules = [
  {
    title: "Say what it does.",
    body: "Collects what shops owe. Flags fake alerts. Plain verbs, no buzzwords.",
  },
  { title: "Short sentences.", body: "Written like a good rep talks: direct, calm, specific." },
  {
    title: "No hype, no invented numbers.",
    body: "Only claims we can show. Estimates are labelled as estimates.",
  },
  { title: "People decide.", body: "Mimi informs and drafts. Owners approve. Say so." },
];

/* ---------- helpers (v6 rig, final set) ---------- */

const helperKit = `${kit}/helpers`;

export type BrandHelper = {
  key: "order" | "collector" | "credit" | "stock" | "brand" | "proof";
  name: string;
  job: string;
  /** The Nigerian cue built into the outline. */
  cue: string;
  /** Its one signature move. */
  move: string;
};

/** Mimi's six helpers, in team order. Names match the console. */
export const brandHelpers: BrandHelper[] = [
  {
    key: "order",
    name: "Order",
    job: "Takes orders",
    cue: "A hawker's tray worn as a crown, three oranges in the dish.",
    move: "The oranges wobble.",
  },
  {
    key: "collector",
    name: "Collector",
    job: "Chases payments",
    cue: "An abeti-aja fila with its tip folded over the brow, a nylon market bag at the hip.",
    move: "The fila tip nods, the bag swings a beat behind.",
  },
  {
    key: "credit",
    name: "Credit",
    job: "Watches limits",
    cue: "The shop's credit jotter: spiral bites down the spine, one dog-eared page.",
    move: "The page corner flips.",
  },
  {
    key: "stock",
    name: "Stock",
    job: "Counts stock",
    cue: "A provisions carton with one flap sprung open.",
    move: "The flap lifts like a lid.",
  },
  {
    key: "brand",
    name: "Brand",
    job: "Reports to brands",
    cue: "The town crier's agogo: two bells under one loop, one eye per bell.",
    move: "Ting-ting: a quick rock on each strike.",
  },
  {
    key: "proof",
    name: "Proof",
    job: "Checks receipts",
    cue: "A loupe in one eye, for checking proof of payment.",
    move: "The loupe scans side to side.",
  },
];

export const helperStates = [
  { key: "idle", label: "Idle", note: "Breathes, blinks, glances. The signature move now and then." },
  { key: "working", label: "Working", note: "Quick hops, eyes busy. Orange dot." },
  { key: "waiting", label: "Waiting on owner", note: "Stretched up, eyes up, slow sway. Orange ring." },
  { key: "done", label: "Done", note: "One pop and happy eyes, then quiet." },
] as const;

export const helperExpressionLabels = [
  "idle",
  "glance",
  "happy",
  "content",
  "wink",
  "determined",
  "surprised",
  "dizzy",
  "error",
  "excited",
  "sleepy",
  "heart",
] as const;

/** Per helper: rigged SVG (all 12 expression layers inside) and 1024px PNG, on light and on dark, plus a colour tile. */
export const helperFiles = (key: string) => [
  { label: "SVG", href: `${helperKit}/${key}-on-light.svg` },
  { label: "PNG", href: `${helperKit}/${key}-on-light.png` },
  { label: "Dark", href: `${helperKit}/${key}-on-dark.png` },
  ...(key === "mimi" ? [] : [{ label: "Tile", href: `${helperKit}/${key}-tile.png` }]),
];

export const helpersZip = { href: `${helperKit}/mimi-helpers.zip`, size: "1.8 MB" };
export const helpersMotion = { href: `${helperKit}/mimi-helpers-motion.mp4`, size: "0.8 MB" };
export const helpersSystem = { href: `${helperKit}/mimi-helpers-system.pdf`, size: "0.3 MB" };

export const helperDo = [
  "Each helper has its own bright, smooth colour in product UI, a touch deeper on light. Eyes stay near-black, cuts take the surface colour.",
  "Orange only for status: a dot while working, a ring while waiting on you. No helper is orange.",
  "Mimi keeps her own mark. One colour (the text colour) is for print and single-ink use.",
  "Keep motion quick and small. Hold still under reduced motion.",
];
