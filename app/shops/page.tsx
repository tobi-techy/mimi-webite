import type { Metadata } from "next";

import { pillClass } from "../components/Pill";
import { BentoBoard, type BentoItem } from "../components/sections/Boards";
import { FaqSection, GetStarted, PriceBand } from "../components/sections/Blocks";
import { DayRows, NopeList, type DayRow } from "../components/sections/Cards";
import { PageHero } from "../components/sections/Heroes";
import { Section, SectionHead, Eyebrow } from "../components/Section";
import { SHOPS_FAQ } from "@/content/faq";

export const metadata: Metadata = {
  title: "Mimi for shops: your shop, in one chat",
  description:
    "Snap your stock book. Forward your alerts. Mimi does the counting, checking and reminding, right inside WhatsApp.",
  alternates: { canonical: "/shops" },
};

const HERO_STICKERS = [
  { name: "stockbook", rotation: -8, size: "xl", at: "left-0 top-[4%]" },
  { name: "indomie", rotation: 10, size: "l", at: "right-0 top-0", delay: 100 },
  { name: "naira", rotation: -14, size: "l", at: "left-[22%] top-[38%]", delay: 200 },
  { name: "milk", rotation: 6, size: "m", at: "right-[2%] top-[42%]", delay: 300 },
  { name: "receipt", rotation: -5, size: "m", at: "left-0 bottom-0", delay: 400 },
  { name: "phone", rotation: 8, size: "m", at: "left-[44%] bottom-[-4%]", delay: 500 },
] as const;

const DAY: DayRow[] = [
  {
    time: "7:00 AM",
    title: "Open shop, snap last night's page.",
    body: "Mimi counts 42 items and tells you what moved.",
    stickers: [{ name: "stockbook", rotation: -6, size: "xl", at: "left-0 right-0 top-0 bottom-0 m-auto" }],
  },
  {
    time: "10:30 AM",
    title: "A customer pays by transfer.",
    body: "Forward the alert. Mimi tells you if the money really landed before the goods leave.",
    stickers: [
      { name: "pos", rotation: 7, size: "l", at: "right-[4%] top-0" },
      { name: "naira", rotation: -9, size: "l", at: "left-[2%] bottom-[6%]", delay: 140 },
    ],
  },
  {
    time: "2:00 PM",
    title: "Running low.",
    body: "Indomie Chicken will finish by Friday. Mimi asks if you want to reorder.",
    stickers: [
      { name: "carton", rotation: -5, size: "l", at: "left-0 top-[2%]" },
      { name: "indomie", rotation: 11, size: "l", at: "right-0 bottom-0", delay: 140 },
    ],
  },
  {
    time: "6:00 PM",
    title: "Close up.",
    body: "A short summary of the day: sales, best seller, what to order.",
    stickers: [
      { name: "receipt", rotation: 6, size: "l", at: "left-[6%] top-0" },
      { name: "calculator", rotation: -8, size: "m", at: "right-[2%] bottom-[2%]", delay: 140 },
    ],
  },
];

const GET: BentoItem[] = [
  {
    area: "a",
    lab: "Stock",
    big: "Stock count you can trust",
    tp: "Every snap of the book updates the count, line by line.",
    split: true,
    stickers: [
      { name: "stockbook", rotation: 5, size: "xl", at: "left-0 top-[4%]" },
      { name: "milk", rotation: -7, size: "m", at: "right-[2%] bottom-0", delay: 140 },
    ],
  },
  {
    area: "b",
    lab: "Alerts",
    big: "Fake alert checks",
    stickers: [
      { name: "naira", rotation: 9, size: "l", at: "right-[-2%] top-[4%]" },
      { name: "pos", rotation: -6, size: "m", at: "left-0 bottom-0", delay: 140 },
    ],
  },
  {
    area: "c",
    lab: "Restock",
    big: "Restock reminders",
    stickers: [
      { name: "crate", rotation: -7, size: "m", at: "left-0 top-0" },
      { name: "carton", rotation: 6, size: "m", at: "right-0 bottom-0", delay: 140 },
    ],
  },
  {
    area: "d",
    lab: "Voice",
    big: "Voice notes",
    tp: "In Pidgin, Yoruba-English mix or English.",
    stickers: [{ name: "phone", rotation: -8, size: "m", at: "left-0 right-0 top-0 bottom-0 m-auto" }],
  },
  {
    area: "e",
    lab: "Records and credit",
    big: "Weekly records you can show your distributor",
    tp: "Good records mean stock on credit, with better terms.",
    stickers: [
      { name: "receipt", rotation: 7, size: "m", at: "left-0 top-0" },
      { name: "van", rotation: -5, size: "l", at: "right-[-6%] bottom-[4%]", delay: 140 },
    ],
  },
];

const NOPE_PILE = [{ name: "phone", rotation: 8, size: "l", at: "left-0 right-0 top-0 bottom-0 m-auto" }] as const;

export default function ShopsPage() {
  return (
    <>
      <PageHero
        eyebrow="For shop owners"
        title="Your shop, in one chat."
        titleId="shops-title"
        sub="Snap your stock book. Forward your alerts. Mimi does the counting, checking and reminding, right inside WhatsApp."
        ctas={
          <>
            <a className={pillClass("ink")} href="/shops#get-started">
              Join the pilot
            </a>
            <span className={pillClass("ghost", "cursor-default text-muted hover:bg-transparent")} aria-disabled="true">
              Chat on WhatsApp (coming soon)
            </span>
          </>
        }
        stickers={[...HERO_STICKERS]}
      />

      <Section id="day">
        <div data-reveal>
          <SectionHead eyebrow="A day with Mimi" title="From opening to closing, she dey with you." />
        </div>
        <DayRows items={[...DAY]} />
      </Section>

      <Section id="get">
        <div data-reveal>
          <SectionHead eyebrow="What you get" title="Less counting. More selling." />
        </div>
        <BentoBoard variant="five" items={GET} />
      </Section>

      <Section id="dont-need">
        <div data-reveal>
          <Eyebrow>What you don&apos;t need</Eyebrow>
        </div>
        <NopeList pile={[...NOPE_PILE]} />
        <PriceBand>Free for shops during the pilot.</PriceBand>
      </Section>

      <FaqSection id="faq" eyebrow="FAQ" title="Shop owners ask" items={SHOPS_FAQ} />

      <Section id="get-started">
        <GetStarted
          title="Let Mimi keep your book."
          sub="We're onboarding the first shops now. Tell us who you are and we'll reach out on WhatsApp."
          companyLabel="Shop name"
          defaultRole="I run a shop"
          submitLabel="Join the pilot"
        />
      </Section>
    </>
  );
}
