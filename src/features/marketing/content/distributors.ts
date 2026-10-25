import type { AgentDetailSpec } from "@/features/marketing/components/AgentDetail";
import type { NumberedItem } from "@/components/ui/Cards";
import type { PhotoSpec } from "@/components/ui/Photo";

export const distributorsHero = {
  label: "For distributors",
  title: "Know where every naira and every carton is. Every day.",
  lead: "Mimi runs on WhatsApp. It reminds shops what they owe, confirms every transfer with the bank, and checks each van against what shops say they received. You get paid sooner and see every gap before the day ends.",
  photo: {
    src: "photo2-distributor",
    alt: "A distributor owner checking his phone in a bright warehouse",
  } satisfies PhotoSpec,
};

export const distributorsOutcomes: NumberedItem[] = [
  {
    title: "Collect without chasing",
    body: "Shops get their balance and their own account number on WhatsApp, and you see the money the moment it lands.",
  },
  {
    title: "No more fake alerts",
    body: "Every payment is confirmed with the payment partner before goods leave.",
  },
  {
    title: "Close every route clean",
    body: "Van stock, cash and transfers matched to what shops confirmed, with gaps flagged and proof attached.",
  },
];

const live = { status: "live", statusLabel: "In pilot" } as const;
const next = { status: "next", statusLabel: "Next" } as const;

export const distributorAgents: AgentDetailSpec[] = [
  {
    ...live,
    name: "Collector",
    outcome: "Gets money in without the phone calls.",
    does: [
      "WhatsApps each shop its balance, due date and its own account number, in English, Yoruba, Hausa or Igbo. Text or voice note.",
      "A one-time, exact-amount account for each debt.",
      "Confirms payment the moment it lands and sends a receipt.",
      "Matches payments to invoices daily. Unmatched money goes to a review tray.",
      "Flags fake alerts.",
      "Escalates overdue shops to the rep or owner, with the history.",
    ],
  },
  {
    ...live,
    name: "Proof",
    outcome: "Catches leakage on the van before it becomes a loss.",
    photo: { src: "photo2-route", alt: "Sales reps loading a delivery van at dawn" },
    sticker: { src: "sticker-van", pos: "br", w: 130, r: "9deg", ox: "-22px", oy: "-34px", lazy: true },
    does: [
      "A morning load-out list for each van.",
      "Shops confirm drops and payments in one tap.",
      "At day-end, compares van stock, cash and transfers with shop confirmations, and flags gaps with evidence.",
      "Tomorrow's visit list: who owes, who's low, who hasn't ordered.",
    ],
    coming: "Ghost-visit checks from location pins. Cash-carry safety.",
  },
  {
    ...live,
    name: "Owner",
    outcome: "Your whole business in one WhatsApp message each morning.",
    does: ["A morning brief: cash in, debts, gaps, stock-outs."],
    coming:
      "A 60-second voice brief in English, Yoruba, Hausa or Igbo. Apprentice mode, with limits, while the owner travels.",
  },
  {
    ...next,
    name: "Orders and Stock",
    outcome: "Takes orders the way shops already send them.",
    does: [
      "Orders by text, voice note or a photo of a list.",
      "Invoices in QuickBooks, Zoho or Sage.",
      "Reorder nudges and near-expiry flags.",
      "Drafts the PO to the manufacturer.",
      "Pushes price changes and confirms each shop saw them.",
    ],
  },
  {
    ...next,
    name: "Credit and Cash",
    outcome: "Helps you decide who gets credit, and how much.",
    does: [
      "A suggested credit limit for each shop. The distributor decides.",
      "Warns about or blocks over-limit orders.",
      "Weekly receivables aging.",
    ],
  },
  {
    status: "later",
    statusLabel: "Later · flat add-on",
    name: "Back Office",
    outcome: "Clears the paperwork from your inbox.",
    does: [
      "Reads the inbox: supplier invoices, scheme circulars, bank alerts, order emails.",
      "Drafts claims and POs for the owner to approve.",
    ],
  },
];

export const paymentsPhoto: PhotoSpec = {
  src: "photo2-counter",
  alt: "Hands with a phone, a ledger and naira notes on a shop counter",
};

export const paymentSteps: NumberedItem[] = [
  { title: "Connect your account once.", body: "Each shop gets its own account number." },
  { title: "Bill on WhatsApp.", body: "With every order or reminder." },
  { title: "Confirmed with the payment partner.", body: "Before Mimi says anything. No screenshots." },
  { title: "“Paid. Release goods.”", body: "And the debt book updates itself." },
];

export const pilotWeeks = [
  { when: "Week 0", title: "Pick one route.", body: "Up to 20 shops." },
  { when: "Week 1", title: "Shops join.", body: "Through a WhatsApp link or QR code." },
  { when: "Weeks 1–2", title: "Quiet mode.", body: "Mimi learns and sends nothing to reps." },
  {
    when: "Weeks 3–4",
    title: "Go live.",
    body: "Reports, reminders and route checks switch on. Then you decide.",
  },
];

/** Beyond collections: the money you make, not just the money you collect. */
export const distributorsGrow = {
  label: "Beyond collections",
  title: "Sell more. Run every shop from one place.",
  columns: [
    {
      title: "Grow sales",
      points: [
        {
          title: "Reorders on WhatsApp.",
          body: "Shops order by text, voice note or a photo of their list. It lands as an order, not a chat.",
        },
        {
          title: "Stock-out alerts.",
          body: "Mimi flags shops about to run out of your lines, so your rep gets there first.",
        },
        {
          title: "Promos that land.",
          body: "Push a new price or promo to the right shops and see who saw it.",
        },
      ],
    },
    {
      title: "Manage shops",
      points: [
        { title: "Every shop on one screen.", body: "What each shop buys, pays and owes." },
        { title: "Rep visits.", body: "Who was visited, who is overdue, who hasn't ordered." },
        { title: "Credit you control.", body: "A suggested limit for each shop. You decide." },
      ],
    },
  ],
  note: "Collector, Proof and the owner brief run in the pilot. Reorders, stock-out alerts and credit limits are rolling out next.",
} as const;
