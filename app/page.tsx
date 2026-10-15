import type { Metadata } from "next";

import { BentoBoard, type BentoItem } from "./components/sections/Boards";
import { FaqSection, GetStarted, Statement } from "./components/sections/Blocks";
import { AudienceSplit, NumberedCards, TrustLines, type Audience, type Numbered } from "./components/sections/Cards";
import { HomeHero } from "./components/sections/Heroes";
import { Section, SectionHead } from "./components/Section";
import { HOME_FAQ } from "@/content/faq";

export const metadata: Metadata = {
  title: "Mimi: your shop helper on WhatsApp",
  description:
    "Mimi reads your stock book, checks payment alerts and tells you when to restock, all inside WhatsApp.",
  alternates: { canonical: "/" },
};

const HOW: Numbered[] = [
  {
    n: "01",
    title: "Snap your stock book",
    body: "Send Mimi a photo of the page. She reads every line and keeps count, so the book becomes numbers you can trust.",
    sticker: { name: "stockbook", rotation: -9 },
  },
  {
    n: "02",
    title: "Forward any alert",
    body: "Got a transfer alert? Forward it. Mimi checks the money really landed before you release goods.",
    sticker: { name: "pos", rotation: 8 },
  },
  {
    n: "03",
    title: "Get told before you run out",
    body: "Mimi watches what sells fastest and tells you when to restock, while there's still time.",
    sticker: { name: "carton", rotation: -6 },
  },
];

const WHO: Audience[] = [
  {
    lab: "For shops",
    big: "Run your shop from WhatsApp.",
    tp: "Mimi reads your book, checks your alerts and tells you when to restock.",
    href: "/shops",
    cta: "Mimi for shops",
    pile: [
      { name: "stockbook", rotation: -7, size: "xl", at: "left-0 top-[10%]" },
      { name: "indomie", rotation: 9, size: "l", at: "right-0 top-0", delay: 120 },
      { name: "phone", rotation: -5, size: "m", at: "left-[34%] bottom-[-8%]", delay: 240 },
    ],
  },
  {
    lab: "For distributors",
    big: "Know which shops are really selling.",
    tp: "See sell-through and payment history from the shops you supply, and give credit with less guesswork.",
    href: "/distributors",
    cta: "Mimi for distributors",
    pile: [
      { name: "van", rotation: 5, size: "xl", at: "left-0 top-[4%]" },
      { name: "crate", rotation: -8, size: "l", at: "right-0 top-[22%]", delay: 120 },
      { name: "waybill", rotation: 7, size: "m", at: "left-[12%] bottom-[-4%]", delay: 240 },
    ],
  },
];

const PLATE: BentoItem[] = [
  {
    area: "a",
    lab: "Stock",
    big: "Your book, counted for you",
    tp: "Snap the page. Mimi reads every line and keeps the count.",
    split: true,
    stickers: [
      { name: "stockbook", rotation: -6, size: "xl", at: "left-0 top-[6%]" },
      { name: "ricesack", rotation: 5, size: "l", at: "right-[-4%] bottom-[6%]", delay: 140 },
    ],
  },
  {
    area: "b",
    lab: "Alerts",
    big: "Fake alerts, caught",
    tp: "Forward the alert. Mimi checks the money landed before goods leave.",
    stickers: [
      { name: "pos", rotation: 7, size: "l", at: "right-0 top-0" },
      { name: "naira", rotation: -10, size: "l", at: "left-[-2%] bottom-[4%]", delay: 140 },
    ],
  },
  {
    area: "c",
    lab: "Restock",
    big: "Never run out of your best sellers",
    pile: "short",
    stickers: [
      { name: "carton", rotation: -6, size: "m", at: "left-0 top-[4%]" },
      { name: "crate", rotation: 8, size: "m", at: "right-0 bottom-0", delay: 140 },
    ],
  },
  {
    area: "d",
    lab: "Voice",
    big: "Voice notes in Pidgin or English",
    stickers: [{ name: "phone", rotation: 9, size: "m", at: "left-0 right-0 top-0 bottom-0 m-auto" }],
  },
  {
    area: "e",
    lab: "Records",
    big: "Records that get you stock on credit",
    tp: "Clean weekly records you can show your distributor.",
    split: true,
    stickers: [
      { name: "receipt", rotation: -8, size: "l", at: "left-0 top-0" },
      { name: "calculator", rotation: 6, size: "m", at: "right-0 top-[10%]", delay: 120 },
      { name: "milk", rotation: -3, size: "m", at: "left-[36%] bottom-[-4%]", delay: 240 },
    ],
  },
];

const LOCK_PILE = [{ name: "padlock", rotation: -8, size: "xl", at: "left-0 right-0 top-0 bottom-0 m-auto" }] as const;

const LOCK_LINES = [
  {
    title: "You choose who sees what",
    body: "Shops decide what each distributor can see. Never your profit, never your customers, never another brand's sales.",
  },
  {
    title: "Money checked, not guessed",
    body: "Mimi confirms payments against your account before telling you they're real.",
  },
  {
    title: "Built for Nigeria",
    body: "Naira first, Pidgin friendly, works on any phone with WhatsApp.",
  },
];

export default function Home() {
  return (
    <>
      <HomeHero />
      <Statement />

      <Section id="how-it-works">
        <div data-reveal>
          <SectionHead eyebrow="How it works" title="Three things, every day." />
        </div>
        <NumberedCards items={[...HOW]} />
      </Section>

      <Section id="who">
        <div data-reveal>
          <SectionHead eyebrow="Who it's for" title="One helper. Both sides of the counter." />
        </div>
        <AudienceSplit items={[...WHO]} />
      </Section>

      <Section id="plate">
        <div data-reveal>
          <SectionHead eyebrow="What Mimi does" title="What Mimi takes off your plate" />
        </div>
        <BentoBoard variant="home" items={PLATE} />
      </Section>

      <Section id="your-data">
        <div data-reveal>
          <SectionHead eyebrow="Your data" title="Your book belongs to you." />
        </div>
        <TrustLines pile={[...LOCK_PILE]} lines={LOCK_LINES} />
      </Section>

      <FaqSection id="faq" eyebrow="FAQ" title="Questions shop owners ask" items={HOME_FAQ} />

      <Section id="get-started">
        <GetStarted
          title="Let Mimi keep the book."
          sub="We're onboarding the first shops and distributors now. Tell us who you are and we'll reach out on WhatsApp."
          companyLabel="Shop or company"
          defaultRole="I run a shop"
          submitLabel="Join the pilot"
        />
      </Section>
    </>
  );
}
