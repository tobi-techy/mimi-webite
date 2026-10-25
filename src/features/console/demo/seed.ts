import { seedAutomationsList } from "@/features/console/content/automations";
import { archiveConversations } from "@/features/console/demo/seed-archive";
import { answerConversations, answerDocs, hypoOpening } from "@/features/console/demo/seed-answers";
import type {
  CardRow,
  ComputerState,
  Conversation,
  DecisionCard,
  DemoState,
  Doc,
  HelperName,
  Reply,
  SideMessage,
  StatementRow,
  WorkPlan,
} from "@/features/console/demo/types";

/** Sample data for the Wigmore Trading demo. Times are Lagos time on Fri 23 Oct 2026. */
export const DEMO_VERSION = 8;
export const owner = { name: "Martin Nwike", first: "Martin", initials: "MN", company: "Wigmore Trading" };

const T = (h: number, m: number) => new Date(2026, 9, 23, h, m).getTime();

export const photo = {
  shelf: "/media/photos/photo2-shelf-480.webp",
  shop: "/media/photos/photo2-shop-480.webp",
  counter: "/media/photos/photo2-counter-480.webp",
} as const;

export const helperJobs: Record<HelperName, string> = {
  Order: "Takes orders",
  Collector: "Chases payments",
  Credit: "Watches limits",
  Stock: "Counts stock",
  Brand: "Reports to brands",
  Proof: "Checks receipts",
};

/** The five shops in the reminder plan (₦385,900 in all). */
export const planRows = (): CardRow[] => [
  { label: "Chuks & Sons", amount: 62400, tone: "Firm", days: 9 },
  { label: "Joy Supermarket", amount: 91000, tone: "Soft", days: 6 },
  { label: "Bright Star", amount: 58000, tone: "Soft", days: 5 },
  { label: "Ola & Daughters", amount: 54500, tone: "Soft", days: 4 },
  { label: "Kola Mart", amount: 120000, tone: "Firm", days: 3, flag: "Fake alert" },
];

/** Collector's summary of who owes what (markdown: renders as a list in the thread). */
export const OWED_LIST = [
  "5 shops owe **₦385,900** in all:",
  "",
  "- **Chuks & Sons** · ₦62,400 · 9 days, the oldest",
  "- **Joy Supermarket** · ₦91,000 · 6 days, says POS",
  "- **Bright Star** · ₦58,000 · 5 days",
  "- **Ola & Daughters** · ₦54,500 · 4 days",
  "- **Kola Mart** · ₦120,000 · 3 days",
].join("\n");

export const chuksMessage =
  "Good morning Mr Chuks. Your invoice of ₦62,400 from 14 Oct is now 9 days late. Please pay today to keep your next delivery on schedule. Thank you.";

export function reminderPlan(rows: CardRow[] = planRows()): DecisionCard {
  const live = rows.filter((r) => r.tone !== "Skip");
  const total = live.reduce((s, r) => s + (r.amount ?? 0), 0);
  return {
    kind: "plan",
    shop: `${live.length} shops`,
    amount: total,
    why: rows.some((r) => r.label === "Joy Supermarket") ? "Oldest is 9 days late" : "Joy verified, Kola Mart flagged",
    title: `Reminder plan · ${live.length} shops`,
    sub: `₦${total.toLocaleString("en-US")} · nothing sent yet`,
    rows,
    goal: `Get ₦${total.toLocaleString("en-US")} back this week without upsetting good customers.`,
    proof: rows.some((r) => r.label === "Joy Supermarket")
      ? [
          { label: "Ade Stores payment matched to GTB", verdict: "verified" },
          { label: "5 invoices signed on delivery", verdict: "verified" },
          { label: "Joy paid by POS", verdict: "self" },
        ]
      : [
          { label: "Ade Stores payment matched to GTB", verdict: "verified" },
          { label: "Joy's ₦91,000 POS payment landed in GTB", verdict: "verified" },
          { label: "Kola Mart's ₦120,000 alert has no money behind it", verdict: "fake" },
        ],
    message: { to: "Chuks & Sons", tone: "Firm", text: chuksMessage },
    primary: `Approve and send`,
    secondary: "Review",
    status: "needs",
    doneText: `Sent to ${live.length} shops on WhatsApp`,
  };
}

/** GTBank statement as Proof sees it. */
export const statementRows = (): StatementRow[] => [
  { date: "23 Oct 08:42", narration: "ADE STORES / TRF", credit: "45,000.00" },
  { date: "23 Oct 08:31", narration: "POS SETTLEMENT JOY SUPERMKT", credit: "—" },
  { date: "23 Oct 07:58", narration: "BRIGHT STAR VENTURES", credit: "12,500.00" },
  { date: "22 Oct 18:20", narration: "OLA & DAUGHTERS", credit: "30,000.00" },
  { date: "22 Oct 16:05", narration: "NIP/ KOLA MART", credit: "—" },
  { date: "22 Oct 11:47", narration: "CHUKS AND SONS PART PAY", credit: "8,000.00" },
];

export const seedComputer = (): ComputerState => ({
  helper: "Proof",
  status: "live",
  activity: "reading GTB statement",
  url: "ibank.gtbank.com/statement",
  rows: statementRows().map((r, i) => (i === 1 ? { ...r, mark: "hl" } : r)),
  steps: [
    { label: "Opened the GTBank statement", detail: "Wigmore Trading Ltd · ****4471", at: "08:46", state: "done" },
    { label: "Matched Ade Stores ₦45,000", detail: "TRF 08:42 · Verified", at: "08:47", state: "done" },
    { label: "Looking for Joy Supermarket's POS payment", detail: "POS settlements land in batches", at: "08:48", state: "run" },
  ],
  tag: "Proof · Joy's ₦91,000?",
  cursorRow: 1,
});

export const idleComputer = (): ComputerState => ({
  helper: "Proof",
  status: "idle",
  activity: "waiting for a job",
  url: "ibank.gtbank.com/statement",
  rows: statementRows(),
  steps: [],
});

let n = 0;
const id = () => `s${++n}`;

/** Chips offered once the reminder plan is waiting (story step 2). */
export const planReplies = (joyChecked: boolean): Reply[] =>
  joyChecked
    ? [
        { label: "Approve and send", step: "col.approve" },
        { label: "Show me the plan", step: "col.review" },
        { label: "Why flag Kola Mart?", step: "col.kola" },
      ]
    : [
        { label: "Joy says she paid by POS", text: "Joy says she paid by POS. Can you check?", step: "col.joy" },
        { label: "Show me the plan", step: "col.review" },
        { label: "Go softer on Chuks", step: "col.soft" },
      ];

/** Reasoning and step copy shared by the seeded chase thread (the live run streams the same words). */
export const CHASE_THOUGHT =
  "Martin wants everyone over **₦50,000** chased this week: polite, but firm past 7 days.\n\n1. Check GTBank first, so nobody who already paid gets a reminder.\n2. Pull balances from the shop book and keep shops over ₦50,000.\n3. Firm for 7+ days late, Soft otherwise. Anything self-reported goes to Proof.\n\nNothing goes out before he approves.";

const chaseMessages = (): Conversation["messages"] => {
  const planId = id();
  return [
    { id: id(), kind: "date", label: "Today 8:41 AM" },
    {
      id: id(),
      kind: "text",
      from: "me",
      at: T(8, 41),
      read: true,
      text: "Chase everyone over ₦50k this week. Polite, but firm past a week.",
      reactions: [{ by: "Collector", r: "like" }],
    },
    { id: id(), kind: "thought", from: "Collector", at: T(8, 41), secs: 6, text: CHASE_THOUGHT },
    { id: id(), kind: "text", from: "Collector", at: T(8, 42), text: "On it. Checking the bank first so we don't chase anyone who already paid." },
    {
      id: id(),
      kind: "step",
      from: "Collector",
      at: T(8, 42),
      variant: "tool",
      icon: "search",
      state: "done",
      text: "Read the GTBank statement",
      meta: "· 38 credits since Monday",
      detail: { type: "kv", rows: [["Account", "Wigmore Trading Ltd · ****4471"], ["Range", "19 to 23 Oct"], ["Credits", "38 · ₦2,914,500"]] },
    },
    {
      id: id(),
      kind: "step",
      from: "Collector",
      at: T(8, 43),
      variant: "tool",
      icon: "receipt",
      state: "done",
      text: "Matched **1** credit alert",
      detail: { type: "table", head: ["Time", "Narration", "Credit"], rows: [["08:42", "TRF/ADE STORES/INV-2207", "₦45,000"]] },
    },
    {
      id: id(),
      kind: "step",
      from: "Collector",
      at: T(8, 43),
      variant: "group",
      icon: "folder",
      state: "done",
      text: "Explored 3 sources",
      detail: {
        type: "list",
        items: [
          { icon: "landmark", text: "GTBank statement", meta: "38 credits" },
          { icon: "book-text", text: "Shop book", meta: "48 shops · 9 owe over ₦50k" },
          { icon: "message-square", text: "WhatsApp chats", meta: "6 replies this week" },
        ],
      },
    },
    {
      id: id(),
      kind: "step",
      from: "Collector",
      at: T(8, 43),
      variant: "tool",
      icon: "book-text",
      state: "done",
      text: "Opened shop book · Chuks & Sons",
      detail: { type: "kv", rows: [["Owes", "₦62,400"], ["Days late", "9"], ["Last paid", "14 Oct · ₦30,000"], ["Promise", "None on file"]] },
    },
    { id: id(), kind: "step", from: "Collector", at: T(8, 44), variant: "handoff", to: "Proof", state: "done", text: "Collector asked **Proof** to check Ade Stores" },
    {
      id: id(),
      kind: "step",
      from: "Proof",
      at: T(8, 44),
      variant: "error",
      icon: "landmark",
      state: "failed",
      text: "GTBank timed out",
      meta: "· after 8.0s",
      detail: { type: "code", label: "Error", text: "GET ibank.gtbank.com/statement?ref=TRF-0842\n504 Gateway Timeout after 8.0s" },
    },
    { id: id(), kind: "step", from: "Proof", at: T(8, 44), variant: "retry", icon: "refresh-cw", state: "done", text: "Retried · alert loaded", meta: "· 1.2s" },
    {
      id: id(),
      kind: "proof",
      from: "Proof",
      at: T(8, 45),
      title: "GTBank credit alert",
      meta: "Ade Stores · 08:42",
      amount: 45000,
      stamp: "Landed",
      foot: "Ade Stores already paid",
      footSub: "Matched to your GTB account",
      verdict: "verified",
      reactions: [{ by: "Collector", r: "bang" }],
    },
    { id: id(), kind: "text", from: "Proof", at: T(8, 45), text: "Took them off the list.", reactions: [{ by: "Collector", r: "like" }, { by: "me", r: "heart" }] },
    { id: id(), kind: "photos", from: "Proof", at: T(8, 47), label: "3 Photos · Joy Supermarket", photos: [photo.shelf, photo.shop, photo.counter] },
    { id: id(), kind: "text", from: "Proof", at: T(8, 47), text: "Joy says they paid by POS, slip `POS 2281`. ==Self-reported== until it lands in GTB." },
    { id: id(), kind: "voice", from: "Proof", at: T(8, 48), seconds: 14, caption: "Voice note from Joy Supermarket" },
    { id: id(), kind: "date", label: "Today 8:52 AM" },
    {
      id: id(),
      kind: "poll",
      from: "Collector",
      at: T(8, 52),
      question: "How firm with Chuks & Sons?",
      options: ["Firm, mention next delivery", "Soft reminder again", "Call him instead"],
      voted: 0,
      reply: "{choice}. I've set Chuks & Sons to that in the plan.",
    },
    {
      id: id(),
      kind: "thought",
      from: "Collector",
      at: T(8, 52),
      secs: 3,
      text: "5 shops left over ₦50,000. Chuks & Sons is 9 days late, so **Firm**. Joy says POS, so **Soft** until Proof sees it land. Kola Mart's alert looks off: keep Firm and flag it.",
    },
    {
      id: id(),
      kind: "step",
      from: "Collector",
      at: T(8, 52),
      variant: "tool",
      icon: "pen",
      state: "done",
      text: "Drafted 5 reminders",
      detail: {
        type: "table",
        head: ["Shop", "Owes", "Tone"],
        rows: [
          ["Chuks & Sons", "₦62,400", "Firm"],
          ["Joy Supermarket", "₦91,000", "Soft"],
          ["Bright Star", "₦58,000", "Soft"],
          ["Ola & Daughters", "₦54,500", "Soft"],
          ["Kola Mart", "₦120,000", "Firm"],
        ],
      },
    },
    { id: id(), kind: "text", from: "Collector", at: T(8, 52), text: OWED_LIST },
    { id: planId, kind: "card", from: "Collector", at: T(8, 52), card: reminderPlan() },
    { id: id(), kind: "step", from: "Collector", at: T(8, 52), variant: "gate", icon: "hand", state: "wait", text: "Waiting on you to approve", link: planId },
  ];
};

/** The chase thread's checklist as seeded: everything up to the approval is done. */
const chasePlan = (): WorkPlan => ({
  title: "Chase everyone over ₦50k",
  items: [
    { label: "Check the bank for payments", state: "done" },
    { label: "Read the shop book", state: "done" },
    { label: "Ask Proof to verify alerts", state: "done" },
    { label: "Draft the reminders", state: "done" },
    { label: "Get your approval", state: "wait" },
    { label: "Send on WhatsApp", state: "todo" },
  ],
});

const simple = (helper: HelperName, lines: [from: "me" | HelperName, text: string][], start: number): Conversation["messages"] => [
  { id: id(), kind: "date", label: "Today" },
  ...lines.map(([from, text], i) => ({ id: id(), kind: "text" as const, from, text, at: start + i * 60000 })),
];

export const seedConversations = (): Conversation[] => {
  const [first, ...rest] = liveConversations();
  return [first!, ...answerConversations(), ...rest, ...archiveConversations()];
};

const liveConversations = (): Conversation[] => [
  {
    slug: "chase-over-50k",
    title: "Chase everyone over ₦50k this week",
    helper: "Collector",
    folder: "Collections",
    code: "COL-14",
    state: "needs",
    status: "plan waiting on you",
    working: false,
    ago: "2m",
    preview: "Reminder plan for 5 shops · ₦385,900 owed in all",
    replies: [
      { label: "Check Joy's POS on GTBank", text: "Joy says she paid by POS. Can you check?", step: "col.joy" },
      { label: "Show me the plan", step: "col.review" },
      { label: "Go softer on Chuks", step: "col.soft" },
    ],
    plan: chasePlan(),
    messages: chaseMessages(),
  },
  {
    slug: "joy-callback",
    title: "Calling back Joy Supermarket",
    helper: "Collector",
    folder: "Collections",
    code: "COL-15",
    state: "run",
    status: "trying the backup number",
    working: true,
    ago: "4m",
    preview: "Their number was off, trying the backup",
    replies: [{ label: "Any update?", step: "gen.update" }],
    messages: simple(
      "Collector",
      [
        ["me", "Call Joy back about the POS payment."],
        ["Collector", "Their main number was off. Trying the backup number on file now."],
      ],
      T(8, 49),
    ),
  },
  {
    slug: "chuks-friday",
    title: "Chuks & Sons promised Friday",
    helper: "Collector",
    folder: "Collections",
    code: "COL-12",
    state: "idle",
    status: "follow-up Friday 10am",
    working: false,
    ago: "1d",
    preview: "Follow-up Friday 10am · I'll check GTB first",
    replies: [{ label: "Remind him today instead", step: "col.chuksnow" }],
    messages: simple(
      "Collector",
      [
        ["Collector", "Mr Chuks promised to pay ₦62,400 on Friday."],
        ["Collector", "I'll check GTB first on Friday at 10am, then remind him only if nothing landed."],
      ],
      T(9, 0) - 86400000,
    ),
  },
  {
    slug: "mama-bisi-40",
    title: "Mama Bisi wants 40 cartons",
    helper: "Order",
    folder: "Orders",
    code: "ORD-88",
    state: "needs",
    status: "waiting on you",
    working: false,
    ago: "32m",
    preview: "Bigger than her usual 25",
    replies: [
      { label: "Confirm 40 cartons", step: "ord.confirm" },
      { label: "Make it 30", text: "Make it 30 cartons instead", step: "ord.thirty" },
      { label: "Why so many?", text: "Why is she ordering so many?", step: "ord.why" },
    ],
    messages: [
      { id: id(), kind: "date", label: "Today" },
      { id: id(), kind: "step", from: "Order", at: T(8, 20), variant: "tool", icon: "message-square", state: "done", text: "Read Mama Bisi's WhatsApp order", detail: { type: "code", label: "WhatsApp · 8:19", text: "Good morning. Send 40 cartons of Indomie Chicken for Saturday please." } },
      {
        id: id(),
        kind: "thought",
        from: "Order",
        at: T(8, 20),
        secs: 4,
        text: "40 cartons is bigger than her usual **25**. Before drafting: check her last orders, how fast she pays, and whether the warehouse covers it without starving the Mushin route.",
      },
      {
        id: id(),
        kind: "step",
        from: "Order",
        at: T(8, 20),
        variant: "tool",
        icon: "receipt",
        state: "done",
        text: "Checked her last 6 orders",
        meta: "· usually 25 cartons",
        detail: { type: "table", head: ["Week", "Cartons", "Paid in"], rows: [["14 Sep", "25", "2 days"], ["21 Sep", "25", "1 day"], ["28 Sep", "24", "2 days"], ["5 Oct", "25", "3 days"], ["12 Oct", "25", "2 days"], ["19 Oct", "26", "2 days"]] },
      },
      { id: id(), kind: "step", from: "Order", at: T(8, 21), variant: "tool", icon: "package", state: "done", text: "Checked stock · 86 cartons in the warehouse" },
      { id: id(), kind: "step", from: "Order", at: T(8, 21), variant: "handoff", to: "Credit", state: "done", text: "Order asked **Credit** about her limit" },
      { id: id(), kind: "step", from: "Credit", at: T(8, 21), variant: "tool", icon: "landmark", state: "done", text: "Limit has room · ₦128,000 of ₦200,000", detail: { type: "kv", rows: [["Limit", "₦200,000"], ["Owes now", "₦0"], ["This order", "₦128,000"]] } },
      { id: id(), kind: "text", from: "Order", at: T(8, 21), text: "Mama Bisi asked for 40 cartons of Indomie Chicken on WhatsApp. That's bigger than her usual 25." },
      { id: id(), kind: "text", from: "Order", at: T(8, 22), text: "She's paid on time for 6 weeks. I drafted the order but haven't confirmed it." },
      {
        id: "mb-card",
        kind: "card",
        from: "Order",
        at: T(8, 22),
        card: {
          kind: "order",
          shop: "Mama Bisi Provisions",
          amount: 128000,
          why: "Bigger than her usual 25 cartons",
          title: "Order · Mama Bisi Provisions",
          sub: "₦128,000 · delivery Saturday",
          rows: [
            { label: "Indomie Chicken 70g (40)", amount: 128000, note: "40 cartons" },
            { label: "Usual order", note: "25 cartons" },
          ],
          primary: "Confirm order",
          secondary: "Decline",
          status: "needs",
          doneText: "Confirmed with Mama Bisi on WhatsApp",
        },
      },
      { id: id(), kind: "step", from: "Order", at: T(8, 22), variant: "gate", icon: "hand", state: "wait", text: "Waiting on you to approve", link: "mb-card" },
    ],
  },
  {
    slug: "van-2-route",
    title: "Van 2 route for Saturday",
    helper: "Order",
    folder: "Orders",
    code: "ORD-86",
    state: "run",
    status: "planning Saturday's stops",
    working: true,
    ago: "3h",
    preview: "Planning Saturday, 14 stops so far",
    replies: [{ label: "Any update?", step: "gen.update" }],
    messages: simple("Order", [["Order", "Planning Saturday for Van 2. 14 stops so far, Mushin first to beat traffic."]], T(7, 58)),
  },
  {
    slug: "iya-femi-limit",
    title: "Raise Iya Femi to ₦150,000?",
    helper: "Credit",
    folder: "Credit",
    code: "CRD-9",
    state: "needs",
    status: "waiting on you",
    working: false,
    ago: "5m",
    preview: "Paid on time 8 weeks in a row",
    replies: [
      { label: "Approve ₦150,000", step: "crd.approve" },
      { label: "Make it ₦125,000", step: "crd.125" },
      { label: "Show her payments", step: "crd.why" },
    ],
    messages: [
      ...simple(
        "Credit",
        [
          [
            "Credit",
            "Iya Femi has paid every invoice in 3 days or less for 8 weeks, and she hits her ₦100,000 limit most Fridays.",
          ],
          ["Credit", "I'd raise her to ₦150,000, not more, until she's done 4 weeks at the new limit."],
        ],
        T(8, 40),
      ),
      {
        id: id(),
        kind: "card",
        from: "Credit",
        at: T(8, 41),
        card: {
          kind: "credit",
          shop: "Iya Femi Provisions",
          amount: 150000,
          why: "Paid on time 8 weeks in a row",
          title: "New limit · Iya Femi Provisions",
          sub: "₦100,000 → ₦150,000",
          rows: [
            { label: "Paid on time", note: "8 of 8 weeks" },
            { label: "Hits her limit", note: "Most Fridays" },
            { label: "Average invoice", amount: 84000 },
          ],
          primary: "Approve limit",
          secondary: "Decline",
          status: "needs",
          doneText: "Limit raised to ₦150,000",
        },
      },
    ],
  },
  {
    slug: "hypo-weekly",
    title: "Hypo weekly sell-out report",
    helper: "Brand",
    folder: "Brands",
    code: "BRD-4",
    state: "needs",
    status: "draft waiting on you",
    working: false,
    ago: "1h",
    preview: "Draft ready for Hypo's area manager",
    replies: [
      { label: "Send it to Hypo", step: "brd.send" },
      { label: "Add a note on Idumota", text: "Add a note that Idumota grew because of the new van route", step: "brd.note" },
      { label: "Open the report", step: "brd.open" },
    ],
    messages: [
      ...hypoOpening(),
      {
        id: id(),
        kind: "card",
        from: "Brand",
        at: T(7, 52),
        card: brandCard("Hypo"),
      },
    ],
  },
  {
    slug: "kola-mart-alert",
    title: "Kola Mart's ₦120,000 alert",
    helper: "Proof",
    folder: "Proof",
    code: "PRF-7",
    state: "needs",
    status: "waiting on you",
    working: false,
    ago: "12m",
    preview: "Alert has no money behind it",
    replies: [
      { label: "Hold their orders", step: "prf.hold" },
      { label: "Check GTBank again", step: "prf.recheck" },
      { label: "Draft a message to Kola Mart", step: "prf.msg" },
    ],
    messages: [
      ...simple(
        "Proof",
        [["Proof", "Kola Mart sent a ₦120,000 transfer alert yesterday at 16:05. Nothing landed in GTB."]],
        T(8, 36),
      ),
      {
        id: id(),
        kind: "proof",
        from: "Proof",
        at: T(8, 37),
        title: "NIP transfer alert",
        meta: "Kola Mart · 22 Oct 16:05",
        amount: 120000,
        stamp: "No money",
        foot: "Fake alert caught",
        footSub: "Nothing landed in GTB",
        verdict: "fake",
      },
      { id: id(), kind: "card", from: "Proof", at: T(8, 38), card: flagCard() },
    ],
  },
  {
    slug: "indomie-low",
    title: "Indomie running low",
    helper: "Stock",
    folder: "Stock",
    code: "STK-3",
    state: "run",
    status: "counting the warehouse",
    working: true,
    ago: "18m",
    preview: "Warehouse runs out Thursday at this pace",
    replies: [
      { label: "Draft a restock", text: "Draft a restock from Dufil", step: "stk.draft" },
      { label: "Which shops are low?", step: "stk.which" },
    ],
    messages: simple(
      "Stock",
      [["Stock", "Indomie Chicken is moving fast. At 21 cartons a day the warehouse runs out Thursday."]],
      T(8, 30),
    ),
  },
];

export function brandCard(name: string): DecisionCard {
  return {
    kind: "brand",
    shop: `${name} area manager`,
    why: "Weekly sell-out, 214 shops",
    title: `Send to ${name} · weekly report`,
    sub: "Email draft · nothing sent yet",
    rows: [
      { label: "To", note: `${name} area manager` },
      { label: "Attached", note: "Weekly report PDF" },
      { label: "Best area", note: "Idumota +11%" },
    ],
    primary: `Send to ${name}`,
    secondary: "Decline",
    status: "needs",
    doneText: `Sent to ${name}'s area manager`,
  };
}

export function flagCard(): DecisionCard {
  return {
    kind: "flag",
    shop: "Kola Mart",
    amount: 120000,
    why: "Transfer alert with no money behind it",
    title: "Flagged payment · Kola Mart",
    sub: "₦120,000 · fake alert",
    rows: [
      { label: "Alert sent", note: "22 Oct 16:05" },
      { label: "In GTB", note: "Nothing landed", flag: "Fake alert" },
      { label: "Next order", amount: 86000, note: "Saturday" },
    ],
    primary: "Hold their orders",
    secondary: "Decline",
    status: "needs",
    doneText: "Kola Mart's orders on hold until cash lands",
  };
}

/** Shop list (CSV) as exported from the debt book. */
export const shopListCsv = `Shop,Area,Owner,Owes (₦),Days late,Status
Chuks & Sons,Ojota,Chuka Okeke,62400,9,Overdue
Joy Supermarket,Mushin,Joy Adeyemi,0,0,Paid (POS verified)
Bright Star,Oshodi,Tunde Bello,58000,5,Watch
Ola & Daughters,Idumota,Ola Martins,54500,4,Watch
Kola Mart,Ikeja,Kola Ojo,120000,3,Fake alert
Iya Femi Provisions,Mushin,Femi Adebayo,0,0,Good
Mama Bisi Provisions,Oshodi,Bisi Lawal,0,0,Good
Ade Stores,Ojota,Ade Coker,0,0,Paid (verified)`;

export const seedDocs = (): Doc[] => [...baseDocs(), ...answerDocs()];

const baseDocs = (): Doc[] => [
  {
    id: "doc-plan",
    title: "Reminder plan · 5 shops",
    kind: "MD",
    by: "Collector",
    at: "8:52",
    thread: "chase-over-50k",
    body: { type: "plan", rows: planRows(), total: 385900 },
    note: "Polite, but firm past a week.",
    versions: [{ v: 1, by: "Collector", at: "8:52", note: "First plan" }],
  },
  {
    id: "doc-gtb",
    title: "GTBank statement · 23 Oct",
    kind: "PDF",
    by: "Proof",
    at: "8:49",
    thread: "chase-over-50k",
    body: { type: "pdf", src: "/console-demo/statement.pdf" },
    note: "Downloaded from ibank.gtbank.com",
    versions: [{ v: 1, by: "Proof", at: "8:49", note: "Saved from GTBank" }],
  },
  {
    id: "doc-inv-2291",
    title: "Invoice INV-2291 · Chuks & Sons",
    kind: "PDF",
    by: "Collector",
    at: "8:47",
    thread: "chase-over-50k",
    body: { type: "pdf", src: "/console-demo/invoice-inv-2291.pdf" },
    note: "Due 21 Oct 2026",
    noteEdited: true,
    versions: [
      { v: 2, by: "you", at: "8:55", note: "Changed the due date" },
      { v: 1, by: "Collector", at: "8:47", note: "Drafted from the debt book" },
    ],
  },
  {
    id: "doc-shops",
    title: "Shop list · Lagos mainland",
    kind: "CSV",
    by: "you",
    at: "Yesterday",
    body: { type: "csv", text: shopListCsv },
    note: "Exported from the debt book",
    versions: [{ v: 1, by: "you", at: "Yesterday", note: "Uploaded" }],
  },
  {
    id: "doc-photo",
    title: "Delivery photo · Chuks & Sons",
    kind: "IMG",
    by: "you",
    at: "8:30",
    thread: "chase-over-50k",
    body: { type: "image", src: "/console-demo/delivery-photo.jpg" },
    note: "Signed by C. Okeke on delivery",
    versions: [{ v: 1, by: "you", at: "8:30", note: "Uploaded" }],
  },
  {
    id: "doc-hypo",
    title: "Hypo weekly sell-out report",
    kind: "MD",
    by: "Brand",
    at: "Yesterday",
    thread: "hypo-weekly",
    body: {
      type: "report",
      rows: [
        { area: "Mushin", cartons: 412, change: "+8%" },
        { area: "Oshodi", cartons: 365, change: "+3%" },
        { area: "Ojota", cartons: 298, change: "−2%" },
        { area: "Idumota", cartons: 251, change: "+11%" },
      ],
    },
    note: "Draft for Hypo's area manager",
    versions: [{ v: 1, by: "Brand", at: "Yesterday", note: "Weekly draft" }],
  },
  {
    id: "doc-wa",
    title: "WhatsApp message · Chuks & Sons",
    kind: "TXT",
    by: "Collector",
    at: "8:52",
    thread: "chase-over-50k",
    body: { type: "text", text: `To: Chuks & Sons (WhatsApp)\nTone: Firm\n\n${chuksMessage}` },
    note: "Draft. Nothing sent yet.",
    versions: [{ v: 1, by: "Collector", at: "8:52", note: "Drafted" }],
  },
  {
    id: "doc-dufil",
    title: "Distributor agreement · Dufil",
    kind: "DOCX",
    by: "you",
    at: "Mon",
    body: { type: "file", src: "/console-demo/dufil-agreement.docx", name: "dufil-agreement.docx" },
    note: "Signed copy is with the accountant",
    versions: [{ v: 1, by: "you", at: "Mon", note: "Uploaded" }],
  },
];

export const seedSide = (): SideMessage[] => [
  { id: "m1", from: "me", quote: "Chuks & Sons is the oldest at 9 days.", text: "Is Chuks usually late, or is this new?", at: T(8, 56) },
  { id: "m2", from: "Mimi", text: "New. He paid on time for 11 of the last 12 weeks.", at: T(8, 56) },
  {
    id: "m3",
    from: "Mimi",
    text: "He also took a bigger order than usual on 14 Oct. Might be slow stock, not a bad payer.",
    at: T(8, 56),
  },
];

export const seedAutomations = (): Record<string, boolean> => ({
  "morning-alerts": true,
  "friday-reminders": true,
  "low-stock": false,
  "brand-report": true,
});

export function seedState(): DemoState {
  n = 0;
  return {
    version: DEMO_VERSION,
    conversations: seedConversations(),
    docs: seedDocs(),
    computer: seedComputer(),
    side: seedSide(),
    panel: { open: false, tab: "Computer", full: false },
    typing: null,
    sideTyping: false,
    sheet: null,
    draft: null,
    playing: false,
    counter: 100,
    automations: seedAutomations(),
    autos: seedAutomationsList(),
  };
}
