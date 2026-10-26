import type { NumberedItem } from "@/components/ui/Cards";
import type { PhotoSpec } from "@/components/ui/Photo";
import type { StickerSpec } from "@/components/ui/Sticker";
import type { AgentStatus } from "@/components/ui/Tag";

/* ---------- hero ---------- */

export const heroChannels = ["WhatsApp", "Voice notes", "Notebook photos", "Bank transfers"];

/** The draggable sticker cluster beside the hero headline. */
export const heroStickers = [
  { src: "sticker-crate", x: "26%", y: "26%", w: 210, r: "-8deg", z: 4, d: "7.2s", dl: "-1s" },
  { src: "sticker-cash", x: "74%", y: "24%", w: 190, r: "10deg", z: 4, d: "8.4s", dl: "-3s" },
  { src: "sticker-keke", x: "42%", y: "66%", w: 250, r: "-4deg", z: 5, d: "6.4s", dl: "-2.2s" },
  { src: "sticker-goods", x: "78%", y: "76%", w: 180, r: "6deg", z: 3, d: "6s", dl: "-1.6s" },
] as const;

/* ---------- 01 / choose your path ---------- */

type PathCard = { href: string; meta: string; title: string; photo: PhotoSpec; sticker: StickerSpec };

export const paths: PathCard[] = [
  {
    href: "/distributors",
    meta: "A / Distributors",
    title: "Collect what you're owed. Close every route clean.",
    photo: { src: "photo2-distributor", alt: "A distributor owner checking his phone in a bright warehouse" },
    sticker: { src: "sticker-keke", pos: "in", w: 120, r: "-10deg", ox: "-12px", oy: "-34px", lazy: true },
  },
  {
    href: "/brands",
    meta: "B / Brands",
    title: "See real sell-through, shop by shop.",
    photo: { src: "photo2-shelf", alt: "A hand straightening products on a colourful store shelf" },
    sticker: { src: "sticker-crate", pos: "in", w: 120, r: "9deg", ox: "-12px", oy: "-34px", lazy: true },
  },
  {
    href: "/shops",
    meta: "C / Shops",
    title: "Your shop in one chat. Free.",
    photo: { src: "photo2-shop", alt: "A smiling shop owner at her kiosk counter with her phone" },
    sticker: { src: "sticker-notebook", pos: "in", w: 120, r: "-7deg", ox: "-12px", oy: "-34px", lazy: true },
  },
];

/* ---------- 02 / the problem ---------- */

export const problems: NumberedItem[] = [
  {
    title: "Money goes missing between the van and the bank.",
    body: "Debts live in notebooks and WhatsApp threads. Nobody has the full picture.",
  },
  { title: "Fake alerts walk goods out of the shop.", body: "The screenshot says paid. The bank says no." },
  {
    title: "Brands pay for promos and sales they can't see.",
    body: "They see what distributors bought, not what shops sold.",
  },
];

/* ---------- 03 / three witnesses ---------- */

export const witnessesPhoto: PhotoSpec = {
  src: "photo2-route",
  alt: "Sales reps loading a delivery van at dawn",
};

export const witnesses: NumberedItem[] = [
  { title: "The rep", body: "What left the van." },
  { title: "The shop", body: "What arrived, confirmed in one tap." },
  { title: "The bank", body: "What landed, verified with the payment partner." },
];

/* ---------- the console ---------- */

export const consoleMock = {
  label:
    "The Mimi console showing three approvals waiting: a payment plan draft, a restock order ready to send, and a flagged transfer alert to check",
  host: "console.userail.money",
  nav: [
    { label: "+ New thread", className: "x-con__new" },
    { label: "Approvals", count: "3", on: true },
    { label: "Threads", count: "12" },
    { label: "Shops", count: "48" },
    { label: "Credit" },
  ],
  user: { initials: "TO", name: "Coral Lane Trading" },
  cards: [
    {
      chip: "Draft",
      warn: true,
      title: "Payment plan for Blessing Supermart",
      sub: "₦184,000 over 4 weeks",
      actions: true,
    },
    { chip: "Ready", title: "Restock order, Mushin route", sub: "12 shops" },
    { chip: "Check", warn: true, title: "Flagged transfer alert · Iya Basira Stores", sub: "₦45,000" },
  ],
  live: {
    title: "CORAL-02 · LIVE",
    bars: ["70%", "92%", "56%", "80%", "40%"],
    caption: "Checking Providus statement",
  },
  facts: ["Approve before anything sends", "Money never moves from Mimi", "Shops own their data"],
};

/* ---------- 04 / meet the agents ---------- */

export type AgentSummary = { status: AgentStatus; statusLabel: string; name: string; outcome?: string };

const live = { status: "live", statusLabel: "In pilot" } as const;
const next = { status: "next", statusLabel: "Next" } as const;

export const agentGroups: Array<{ title: string; count: string; agents: AgentSummary[] }> = [
  {
    title: "For distributors",
    count: "6 agents",
    agents: [
      { ...live, name: "Collector", outcome: "Gets money in without the phone calls." },
      { ...live, name: "Proof", outcome: "Catches leakage on the van before it becomes a loss." },
      { ...live, name: "Owner", outcome: "Your whole business in one WhatsApp message each morning." },
      { ...next, name: "Orders and Stock", outcome: "Takes orders the way shops already send them." },
      { ...next, name: "Credit and Cash", outcome: "Helps you decide who gets credit, and how much." },
      {
        status: "later",
        statusLabel: "Later",
        name: "Back Office",
        outcome: "Clears the paperwork from your inbox.",
      },
    ],
  },
  {
    title: "For brands",
    count: "5 agents · all next",
    agents: [
      { ...next, name: "Sell-through" },
      { ...next, name: "Promo Check" },
      { ...next, name: "Claims Check" },
      { ...next, name: "Shop Reach" },
      { ...next, name: "Safety" },
    ],
  },
];

/* ---------- tape: messages Mimi sends ---------- */

export const tapeMessages = [
  "Paid. Release goods.",
  "Your balance is ₦48,500, due Friday",
  "Route closed. 2 gaps found.",
  "Promo ran in 41 of 50 shops.",
  "Low on stock? Reorder in one tap.",
];

/* ---------- 05 / trust ---------- */

export const trustRules: NumberedItem[] = [
  {
    title: "Mimi never moves or holds money.",
    body: "It confirms and reconciles. Money settles to the distributor's own account.",
  },
  {
    title: "Big emails wait for the owner.",
    body: "Emails to manufacturers, brands and banks stay drafts until the owner approves.",
  },
  {
    title: "Routine messages follow your rules.",
    body: "Everyday shop messages run on rules the distributor sets.",
  },
  {
    title: "Shops own their data.",
    body: "Each distributor sees only its own products and payments, with consent. Nobody sees a shop's profit, its customers' debts or competitor sales.",
  },
];

/* ---------- quote ---------- */

export const founderQuote = {
  text: "“Shops shouldn't need an app or a laptop to be bankable. Their daily trade should be enough.”",
  name: "Tobiloba Omotade",
  role: "Founder, Rail Money",
};
