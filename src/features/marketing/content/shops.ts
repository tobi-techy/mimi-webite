import type { NumberedItem } from "@/components/ui/Cards";
import type { PhotoSpec } from "@/components/ui/Photo";

export const shopsHero = {
  label: "For shops · Free",
  title: "Your shop, in one chat.",
  lead: "Mimi lives in WhatsApp. Snap your book, forward an alert, send a voice note. Free for shops, no app to download.",
  ask: "Ask your distributor for their Mimi link or QR code.",
  photo: {
    src: "photo2-shop",
    alt: "A smiling shop owner at her kiosk counter with her phone",
  } satisfies PhotoSpec,
};

export const shopJobs = [
  { title: "Keeps your stock book", body: "Snap the page and Mimi reads every line." },
  { title: "Checks every transfer", body: "When you pay your distributor, Mimi confirms the money landed." },
  { title: "Warns before you run out", body: "Mimi watches what sells fast." },
  { title: "Reorders in one tap", body: "Approve it and your distributor sees it right away." },
  { title: "Remembers who owes you", body: "A simple debt book, with gentle reminders." },
  { title: "Weekly report", body: "Every Monday: what sold, what's slow, what came in." },
];

/**
 * Debt book example. Rows fill in at `t` ms; paid rows strike through and swap Owes for Paid at
 * `paidAt`; the total counts down from `total.from` through each step.
 */
export const debtBookExample = {
  customers: "4 customers",
  rows: [
    { name: "Mama Tunde", item: "2 crates Pepsi", amount: "₦9,600", t: 0 },
    { name: "Chinedu", item: "1 bag rice, 5kg", amount: "₦4,500", t: 80, paidAt: 700 },
    { name: "Aunty Bisi", item: "1 carton Indomie", amount: "₦6,400", t: 160, paidAt: 1200 },
    { name: "Musa", item: "6 sachets Milo", amount: "₦3,000", t: 240 },
  ],
  total: { from: "23500", steps: "700:19000,1200:12600", final: "₦12,600" },
};

export const shopsDataPhoto: PhotoSpec = {
  src: "photo2-counter",
  alt: "Hands with a phone, a ledger and naira notes on a shop counter",
};

export const shopsDataRules: NumberedItem[] = [
  { title: "You choose who sees what." },
  { title: "Never your profit, your customers' debts or another brand's sales." },
  { title: "Your money stays in your bank." },
];
