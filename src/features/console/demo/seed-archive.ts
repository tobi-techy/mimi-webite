import type { Conversation, HelperName, Message, Reaction, Reply, ThreadState } from "@/features/console/demo/types";

/**
 * The 12 older sample threads (first console build), moved onto the chat data model so every
 * /console/threads/* page uses the same view. Times are Lagos time, before Fri 23 Oct 2026.
 */
const T = (d: number, h: number, m: number) => new Date(2026, 9, d, h, m).getTime();

type Old = {
  slug: string;
  title: string;
  helper: HelperName | "Mimi";
  folder: Conversation["folder"];
  code: string;
  state: ThreadState;
  status: string;
  ago: string;
  day: number;
  dateLabel: string;
  ask: string;
  /** Seeded reactions on the owner's ask (helpers react too). */
  askReactions?: Reaction[];
  lines: [from: HelperName | "Mimi", text: string][];
  replies?: Reply[];
};

const OLD: Old[] = [
  {
    slug: "check-transfer-alerts",
    title: "Check 9 transfer alerts",
    helper: "Proof",
    folder: "Proof",
    code: "COL-2",
    state: "done",
    status: "2 fake alerts flagged",
    ago: "3h",
    day: 23,
    dateLabel: "Today 6:10 AM",
    ask: "Check this morning's 9 transfer alerts against GTB.",
    askReactions: [{ by: "Proof", r: "like" }],
    lines: [
      ["Proof", "Checked all 9 alerts against the GTB statement."],
      ["Proof", "7 verified, 2 fake. The fake ones were screenshots with no money behind them."],
      ["Proof", "I've held the next order for both shops until cash lands."],
    ],
    replies: [{ label: "Which shops sent fake alerts?", step: "arc.fakes" }],
  },
  {
    slug: "recover-idumota-balances",
    title: "Recover Idumota balances",
    helper: "Collector",
    folder: "Collections",
    code: "COL-3",
    state: "run",
    status: "chasing 6 shops",
    ago: "42m",
    day: 23,
    dateLabel: "Today 8:20 AM",
    ask: "Recover the old Idumota balances, 11 shops.",
    lines: [
      ["Collector", "Working through 11 Idumota shops, oldest balance first."],
      ["Collector", "₦612,000 recovered so far. 5 shops paid, 6 left."],
    ],
    replies: [{ label: "Any update?", step: "gen.update" }],
  },
  {
    slug: "payment-plans-review",
    title: "Payment plans review",
    helper: "Credit",
    folder: "Credit",
    code: "COL-4",
    state: "done",
    status: "3 approved, 1 declined",
    ago: "1d",
    day: 22,
    dateLabel: "Yesterday 4:30 PM",
    ask: "Review the 4 payment plans shops asked for.",
    askReactions: [{ by: "Credit", r: "like" }],
    lines: [
      ["Credit", "Reviewed 4 plans. You approved 3 and declined 1."],
      ["Credit", "The 3 approved plans are in the debt book with weekly due dates."],
    ],
  },
  {
    slug: "mushin-weekly-collections",
    title: "Mushin weekly collections",
    helper: "Collector",
    folder: "Collections",
    code: "COL-5",
    state: "done",
    status: "scheduled every Monday",
    ago: "1w",
    day: 19,
    dateLabel: "Monday 9:00 AM",
    ask: "Collect from the Mushin route every Monday.",
    lines: [
      ["Collector", "Monday run done: ₦1.9m collected from 14 shops."],
      ["Collector", "Every payment matched to GTB. Next run is Monday at 9am."],
    ],
  },
  {
    slug: "restock-mushin-route",
    title: "Restock plan for Mushin route",
    helper: "Stock",
    folder: "Stock",
    code: "RST-1",
    state: "run",
    status: "counting 22 shops",
    ago: "1h",
    day: 23,
    dateLabel: "Today 7:45 AM",
    ask: "Plan the restock for the Mushin route.",
    lines: [
      ["Stock", "Counting 22 Mushin shops from this week's orders."],
      ["Stock", "So far: 312 cartons, about ₦8.4m. I'll bring you the order before anything is placed."],
    ],
    replies: [{ label: "Any update?", step: "gen.update" }],
  },
  {
    slug: "peak-milk-shortage",
    title: "Peak Milk shortage check",
    helper: "Stock",
    folder: "Stock",
    code: "RST-2",
    state: "done",
    status: "3 suppliers checked",
    ago: "2d",
    day: 21,
    dateLabel: "Wednesday 11:10 AM",
    ask: "Are we short on Peak Milk?",
    lines: [
      ["Stock", "Yes. We're 140 cartons short for next week."],
      ["Stock", "I checked 3 suppliers. Two can deliver by Friday."],
    ],
  },
  {
    slug: "indomie-price-update",
    title: "Indomie price update to shops",
    helper: "Order",
    folder: "Orders",
    code: "RST-3",
    state: "done",
    status: "41 of 48 read",
    ago: "3d",
    day: 20,
    dateLabel: "Tuesday 10:00 AM",
    ask: "Tell every shop about the new Indomie price.",
    lines: [
      ["Order", "Sent the new Indomie price to all 48 shops on WhatsApp."],
      ["Order", "41 have read it. No complaints so far."],
    ],
  },
  {
    slug: "yaba-new-skus",
    title: "Yaba new SKUs",
    helper: "Stock",
    folder: "Stock",
    code: "RST-4",
    state: "done",
    status: "6 SKUs added",
    ago: "4d",
    day: 19,
    dateLabel: "Monday 2:15 PM",
    ask: "Add the new SKUs for the Yaba shops.",
    lines: [["Stock", "Added 6 new SKUs to the price list for 9 Yaba shops."]],
  },
  {
    slug: "onboard-ikeja-shops",
    title: "Onboard 6 new shops in Ikeja",
    helper: "Mimi",
    folder: "General",
    code: "ONB-1",
    state: "run",
    status: "4 of 6 joined",
    ago: "2d",
    day: 21,
    dateLabel: "Wednesday 9:30 AM",
    ask: "Onboard the 6 new Ikeja shops.",
    lines: [
      ["Mimi", "Invited all 6 Ikeja shops on WhatsApp."],
      ["Mimi", "4 have joined. I'll nudge the other 2 tomorrow morning."],
    ],
    replies: [{ label: "Any update?", step: "gen.update" }],
  },
  {
    slug: "surulere-shop-invites",
    title: "Surulere shop invites",
    helper: "Mimi",
    folder: "General",
    code: "ONB-2",
    state: "done",
    status: "7 of 8 joined",
    ago: "1w",
    day: 16,
    dateLabel: "Last Friday 3:00 PM",
    ask: "Invite the 8 Surulere shops.",
    lines: [["Mimi", "Sent 8 invites. 7 shops joined and are taking orders on WhatsApp."]],
  },
  {
    slug: "shop-consent-forms",
    title: "Collect shop consent forms",
    helper: "Mimi",
    folder: "General",
    code: "ONB-3",
    state: "done",
    status: "46 signed",
    ago: "1w",
    day: 16,
    dateLabel: "Last Friday 11:00 AM",
    ask: "Collect consent forms from every shop.",
    lines: [["Mimi", "46 of 48 shops signed. 2 opted out, so I won't message them."]],
  },
];

let n = 0;
const id = () => `a${++n}`;

function build(o: Old): Conversation {
  const start = T(o.day, 9, 0);
  const messages: Message[] = [
    { id: id(), kind: "date", label: o.dateLabel },
    { id: id(), kind: "text", from: "me", text: o.ask, at: start, read: true, reactions: o.askReactions },
    ...o.lines.map(([from, text], i): Message => ({ id: id(), kind: "text", from, text, at: start + (i + 1) * 60000 })),
  ];
  const last = o.lines.at(-1)?.[1] ?? o.title;
  return {
    slug: o.slug,
    title: o.title,
    helper: o.helper,
    folder: o.folder,
    code: o.code,
    state: o.state,
    status: o.status,
    working: o.state === "run",
    ago: o.ago,
    preview: last.replace(/\*\*|==/g, ""),
    replies: o.replies,
    messages,
  };
}

/** The old Oshodi thread: the one that had a full conversation, now with its payment plan card. */
function oshodi(): Conversation {
  const t = (h: number, m: number) => T(23, h, m);
  return {
    slug: "chase-oshodi-shops",
    title: "Chase Oshodi shops for payment",
    helper: "Collector",
    folder: "Collections",
    code: "COL-1",
    state: "needs",
    status: "waiting on you",
    working: false,
    ago: "2m",
    preview: "Blessing Supermart asked for a payment plan",
    replies: [
      { label: "Approve the plan", step: "gen.approve" },
      { label: "Ask for a bigger first payment", step: "osh.bigger" },
    ],
    messages: [
      { id: id(), kind: "date", label: "Today 8:58 AM" },
      {
        id: id(),
        kind: "text",
        from: "me",
        at: t(8, 58),
        read: true,
        text: "Chase the Oshodi shops that are over a week late.",
        reactions: [{ by: "Collector", r: "like" }],
      },
      {
        id: id(),
        kind: "text",
        from: "Collector",
        at: t(9, 0),
        text: "6 Oshodi shops are past 7 days, ₦864,850 in all. Sent one polite WhatsApp reminder to each.",
        reactions: [
          { by: "Iya Tunde Stores", r: "like" },
          { by: "Mama Chidinma", r: "heart" },
          { by: "me", r: "bang" },
        ],
      },
      {
        id: id(),
        kind: "proof",
        from: "Proof",
        at: t(9, 41),
        title: "Providus transfer",
        meta: "Iya Tunde Stores · 09:40",
        amount: 58200,
        stamp: "Landed",
        foot: "Iya Tunde paid",
        footSub: "Matched on the Providus statement",
        verdict: "verified",
      },
      { id: id(), kind: "text", from: "Collector", at: t(9, 44), text: "Mama Chidinma will pay today. Alhaji Musa promised Friday. Ade & Kemi haven't replied, I'll remind them Friday." },
      { id: id(), kind: "text", from: "Collector", at: t(9, 50), text: "Blessing Supermart asked to split ₦312,750 into weekly payments." },
      {
        id: id(),
        kind: "card",
        from: "Collector",
        at: t(9, 51),
        card: {
          kind: "credit",
          shop: "Blessing Supermart",
          amount: 312750,
          why: "Asked to pay weekly",
          title: "Payment plan · Blessing Supermart",
          sub: "₦312,750 over 4 weeks",
          rows: [
            { label: "Week 1 (today)", amount: 84000 },
            { label: "Weeks 2 to 4", amount: 228750, note: "₦76,250 a week" },
            { label: "Paid on time before", note: "9 of 10 weeks" },
          ],
          primary: "Approve plan",
          secondary: "Decline",
          status: "needs",
          doneText: "Plan sent to Blessing Supermart",
        },
      },
    ],
  };
}

export function archiveConversations(): Conversation[] {
  n = 0;
  return [oshodi(), ...OLD.map(build)];
}

/** Slugs of the migrated threads (all prerendered at /console/threads/[slug]). */
export const archiveSlugs = ["chase-oshodi-shops", ...OLD.map((o) => o.slug)];
