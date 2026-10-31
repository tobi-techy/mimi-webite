import type { HelperName } from "@/features/console/demo/types";

/**
 * The quiet right panel in a helper's own thread (Factory rebuild, 31 Oct 2026): what she is doing
 * right now as a short step list, one plain money sentence where it helps (Collector), and her
 * rules in three tiers. Sample data for the demo; the rules are the product's tiers in plain words.
 */
export type BriefStep = { text: string; state: "done" | "now" | "todo" };
export type RuleTier = "allowed" | "ask" | "never";
export type BriefRule = { text: string; tier: RuleTier };
export type Collections = {
  collected: number;
  due: number;
  parts: { label: string; amount: number; tone: "verified" | "likely" | "promised" | "late" }[];
};

export type HelperBriefContent = { steps: BriefStep[]; rules: BriefRule[]; collections?: Collections };

export const ruleTierLabel: Record<RuleTier, string> = { allowed: "Allowed", ask: "Always ask", never: "Never" };

export const helperBrief: Record<HelperName, HelperBriefContent> = {
  Collector: {
    steps: [
      { text: "Pulled 9 bank alerts since 12:00", state: "done" },
      { text: "Matched 6 to shops and invoices", state: "done" },
      { text: "Matching 3 more, one fits two shops", state: "now" },
      { text: "Ask you about the unclear one", state: "todo" },
    ],
    collections: {
      collected: 1240000,
      due: 2100000,
      parts: [
        { label: "Verified by bank", amount: 1240000, tone: "verified" },
        { label: "Likely, Proof checking", amount: 296000, tone: "likely" },
        { label: "Promised this week", amount: 354000, tone: "promised" },
        { label: "Late, 7 days+", amount: 210000, tone: "late" },
      ],
    },
    rules: [
      { text: "Soft reminders under ₦50k", tier: "allowed" },
      { text: "Firm tone, held deliveries", tier: "ask" },
      { text: "Move money, change amounts", tier: "never" },
    ],
  },
  Order: {
    steps: [
      { text: "Took 11 orders from WhatsApp today", state: "done" },
      { text: "Mama Bisi's 40 cartons packed", state: "done" },
      { text: "Planning Saturday for Van 2, 14 stops", state: "now" },
      { text: "Send you the run before it leaves", state: "todo" },
    ],
    rules: [
      { text: "Confirm orders in stock", tier: "allowed" },
      { text: "Orders over a shop's limit", tier: "ask" },
      { text: "Change prices", tier: "never" },
    ],
  },
  Credit: {
    steps: [
      { text: "Read 8 weeks of Iya Femi's payments", state: "done" },
      { text: "All 8 on time, avg 2 days early", state: "done" },
      { text: "Drafted a new limit of ₦150,000", state: "now" },
      { text: "Save it once you say yes", state: "todo" },
    ],
    rules: [
      { text: "Watch limits and flag risk", tier: "allowed" },
      { text: "Any limit change", tier: "ask" },
      { text: "Give credit to a new shop", tier: "never" },
    ],
  },
  Stock: {
    steps: [
      { text: "Read this week's sales", state: "done" },
      { text: "Indomie runs out Thursday", state: "done" },
      { text: "Counting Indomie Chicken in the warehouse", state: "now" },
      { text: "Draft a restock for Dufil", state: "todo" },
    ],
    rules: [
      { text: "Count stock and warn early", tier: "allowed" },
      { text: "Restock orders to suppliers", tier: "ask" },
      { text: "Pay suppliers", tier: "never" },
    ],
  },
  Brand: {
    steps: [
      { text: "Drafted the Hypo report", state: "done" },
      { text: "Gmail access expired", state: "now" },
      { text: "Send it once Gmail is back", state: "todo" },
    ],
    rules: [
      { text: "Share price lists with your shops", tier: "allowed" },
      { text: "Messages to every shop at once", tier: "ask" },
      { text: "Promise discounts", tier: "never" },
    ],
  },
  Proof: {
    steps: [
      { text: "Checked 12 payment alerts", state: "done" },
      { text: "Caught 1 fake alert", state: "done" },
      { text: "Checking GTBank for Joy Supermarket", state: "now" },
      { text: "Tell Collector what's real", state: "todo" },
    ],
    rules: [
      { text: "Read bank statements", tier: "allowed" },
      { text: "Mark a payment as fake", tier: "ask" },
      { text: "Move money", tier: "never" },
    ],
  },
};
