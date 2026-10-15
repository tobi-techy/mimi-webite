import type { Metadata } from "next";

import { pillClass } from "../components/Pill";
import { BentoBoard, type BentoItem } from "../components/sections/Boards";
import { FaqSection, GetStarted, PriceBand } from "../components/sections/Blocks";
import { ConsentPanel, FourSteps, ThreeTiles, type FourStep, type ThreeTile } from "../components/sections/Cards";
import { PageHero } from "../components/sections/Heroes";
import { Section, SectionHead } from "../components/Section";
import { DISTRIBUTORS_FAQ } from "@/content/faq";

export const metadata: Metadata = {
  title: "Mimi for distributors and brands",
  description:
    "See sell-through, stock left and payment history for your products in the shops you supply, so you restock the right shops and give credit with confidence.",
  alternates: { canonical: "/distributors" },
};

const HERO_STICKERS = [
  { name: "van", rotation: -5, size: "xl", at: "left-0 top-[2%]" },
  { name: "crate", rotation: 8, size: "l", at: "right-0 top-[14%]", delay: 100 },
  { name: "ricesack", rotation: -3, size: "l", at: "left-[6%] top-[44%]", delay: 200 },
  { name: "carton", rotation: 7, size: "m", at: "right-[4%] bottom-[2%]", delay: 300 },
  { name: "waybill", rotation: -9, size: "m", at: "left-[30%] bottom-[-4%]", delay: 400 },
] as const;

const PROBLEM: ThreeTile[] = [
  {
    big: "You only see what you deliver, not what sells.",
    stickers: [{ name: "carton", rotation: -7, size: "l", at: "left-0 right-0 top-0 bottom-0 m-auto" }],
  },
  {
    big: "Credit is a guess based on who you know.",
    stickers: [{ name: "naira", rotation: 9, size: "l", at: "left-0 right-0 top-0 bottom-0 m-auto" }],
  },
  {
    big: "Reps' reports come late and patchy.",
    stickers: [{ name: "waybill", rotation: -5, size: "l", at: "left-0 right-0 top-0 bottom-0 m-auto" }],
  },
];

const SEE: BentoItem[] = [
  {
    area: "a",
    lab: "Sell-through",
    big: "Sell-through by shop",
    tp: "How fast your products leave each shelf, shop by shop.",
    split: true,
    stickers: [
      { name: "crate", rotation: -6, size: "xl", at: "left-0 top-[2%]" },
      { name: "receipt", rotation: 8, size: "m", at: "right-0 bottom-0", delay: 140 },
    ],
  },
  {
    area: "b",
    lab: "Stock",
    big: "Stock left on the shelf",
    stickers: [{ name: "stockbook", rotation: 7, size: "l", at: "left-0 right-0 top-0 bottom-0 m-auto" }],
  },
  {
    area: "c",
    lab: "Credit",
    big: "Payment history and a credit score",
    tp: "A simple score, with the reasons behind it.",
    stickers: [
      { name: "naira", rotation: -9, size: "m", at: "left-0 top-[6%]" },
      { name: "calculator", rotation: 6, size: "m", at: "right-0 bottom-0", delay: 140 },
    ],
  },
  {
    area: "d",
    lab: "Restock",
    big: "Restock requests",
    tp: "Straight from the shop's chat to you.",
    stickers: [
      { name: "van", rotation: 5, size: "m", at: "right-[-4%] bottom-[4%]", delay: 140 },
      { name: "phone", rotation: -8, size: "m", at: "left-0 top-0" },
    ],
  },
  {
    area: "e",
    lab: "Risk",
    big: "Fewer bad debts",
    stickers: [{ name: "padlock", rotation: -6, size: "l", at: "left-0 right-0 top-0 bottom-0 m-auto" }],
  },
];

const PILOT: FourStep[] = [
  {
    n: "1",
    body: "Pick 10 to 30 shops you already supply.",
    stickers: [{ name: "crate", rotation: -6, size: "m", at: "left-0 right-0 top-0 bottom-0 m-auto" }],
  },
  {
    n: "2",
    body: "We onboard them on WhatsApp in a day, free for the shops.",
    stickers: [{ name: "phone", rotation: 7, size: "m", at: "left-0 right-0 top-0 bottom-0 m-auto" }],
  },
  {
    n: "3",
    body: "Mimi tracks deliveries, stock counts and payments for 4 weeks.",
    stickers: [{ name: "stockbook", rotation: -4, size: "m", at: "left-0 right-0 top-0 bottom-0 m-auto" }],
  },
  {
    n: "4",
    body: "You get a weekly report on sell-through and payment behaviour, and decide on credit.",
    stickers: [{ name: "receipt", rotation: 6, size: "m", at: "left-0 right-0 top-0 bottom-0 m-auto" }],
  },
];

const CONSENT_PILE = [{ name: "padlock", rotation: 7, size: "xl", at: "left-0 right-0 top-0 bottom-0 m-auto" }] as const;

const CONSENT_SEE = [
  "Your own products' sales and stock",
  "Payments made to you",
  "A credit score with reasons",
  "The shop's total debt across suppliers (amount only)",
];

const CONSENT_NEVER = ["Their profit", "Their customers", "Another brand's sales"];

export default function DistributorsPage() {
  return (
    <>
      <PageHero
        eyebrow="For distributors and brands"
        title="See which shops are really selling."
        titleId="distributors-title"
        sub="Mimi runs inside the shops you supply. With their permission, you see sell-through, stock left and payment history for your products, so you restock the right shops and give credit with confidence."
        ctas={
          <a className={pillClass("ink")} href="/distributors#get-started">
            Run a pilot with us
          </a>
        }
        stickers={[...HERO_STICKERS]}
      />

      <Section id="problem">
        <div data-reveal>
          <SectionHead eyebrow="The problem" title="You deliver blind." />
        </div>
        <ThreeTiles items={PROBLEM} />
      </Section>

      <Section id="see">
        <div data-reveal>
          <SectionHead eyebrow="What you see" title="Real numbers from the shelf, not the van." />
        </div>
        <BentoBoard variant="five" items={SEE} />
      </Section>

      <Section id="pilot">
        <div data-reveal>
          <SectionHead eyebrow="How a pilot works" title="Four weeks, four steps." />
        </div>
        <FourSteps items={PILOT} />
      </Section>

      <Section id="consent">
        <ConsentPanel pile={[...CONSENT_PILE]} see={CONSENT_SEE} never={CONSENT_NEVER} />
        <PriceBand>
          Distributors pay to run Mimi with their shops.{" "}
          <span className="text-faint">Pilot pricing on request.</span>
        </PriceBand>
      </Section>

      <FaqSection id="faq" eyebrow="FAQ" title="Distributors ask" items={DISTRIBUTORS_FAQ} />

      <Section id="get-started">
        <GetStarted
          title="Run a pilot with us."
          sub="Tell us about your business and we'll reach out on WhatsApp to plan a pilot with your shops."
          companyLabel="Company"
          defaultRole="I'm a distributor"
          submitLabel="Run a pilot with us"
        />
      </Section>
    </>
  );
}
