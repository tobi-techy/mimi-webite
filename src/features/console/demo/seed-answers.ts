import type { Conversation, Doc, Message, WorkLine } from "@/features/console/demo/types";
import { shopHref } from "@/features/console/config";

/**
 * Threads whose helper replies are structured answers (25 Oct 2026): Worked for, the one-line
 * answer, stat cards, a data table with score meters, highlights with citations and sources,
 * and deliverables. Shop names match the shop book (content/shops.ts) so entity chips link.
 * Times are Lagos time on Fri 23 Oct 2026, like the rest of the demo.
 */

const T = (h: number, m: number) => new Date(2026, 9, 23, h, m).getTime();

/* ---------- Collector · why collections dropped on Ikeja ---------- */

const ikejaWork = (): WorkLine[] => [
  { id: "ik-w1", kind: "step", from: "Collector", at: T(9, 2), variant: "tool", icon: "landmark", state: "done", text: "Read the GTBank statement · 12 to 23 Oct", meta: "· 412 credits" },
  { id: "ik-w2", kind: "step", from: "Collector", at: T(9, 2), variant: "tool", icon: "book-text", state: "done", text: "Read the shop book for Ikeja, Mushin and Oshodi" },
  {
    id: "ik-w3",
    kind: "thought",
    from: "Collector",
    at: T(9, 2),
    secs: 6,
    text: "Ikeja is down but Mushin and Oshodi aren't, so it isn't a bank delay. The empty days are **Tuesday** and **Thursday**, which are the Allen Avenue and Ogba runs. Check the van log before blaming the shops.",
  },
  {
    id: "ik-w4",
    kind: "step",
    from: "Collector",
    at: T(9, 3),
    variant: "tool",
    icon: "truck",
    state: "done",
    text: "Checked the van log · Van 3 off the road Tue and Thu",
    detail: { type: "table", head: ["Day", "Van 3", "Stops"], rows: [["Mon 19", "Ikeja loop", "14"], ["Tue 20", "Broke down at Ojota", "3"], ["Wed 21", "Ikeja loop", "13"], ["Thu 22", "In the workshop", "0"], ["Fri 23", "Ikeja loop", "12"]] },
  },
  { id: "ik-w5", kind: "step", from: "Collector", at: T(9, 3), variant: "handoff", to: "Proof", state: "done", text: "Collector asked **Proof** about Kola Mart's alert" },
  { id: "ik-w6", kind: "step", from: "Proof", at: T(9, 3), variant: "tool", icon: "shield-check", state: "done", text: "No money behind Kola Mart's ₦120,000 alert" },
  { id: "ik-w7", kind: "step", from: "Collector", at: T(9, 3), variant: "tool", icon: "sheet", state: "done", text: "Made the collections list · 31 Ikeja shops" },
];

const ikejaAnswer = (): Message => ({
  id: "ik-ans",
  kind: "answer",
  from: "Collector",
  at: T(9, 3),
  worked: { secs: 41, work: ikejaWork() },
  cites: {
    1: { kind: "whatsapp", name: "WhatsApp · Van 3 driver" },
    2: { kind: "sheet", name: "Collections list · week of Oct 19", docId: "doc-col-oct19" },
    3: { kind: "bank", name: "GTBank statement · 23 Oct", docId: "doc-gtb" },
  },
  blocks: [
    {
      type: "text",
      lead: true,
      text: "Ikeja is down ₦374,000 this week because Van 3 broke down on Tuesday and missed the Allen Avenue and Ogba runs, where shops pay the driver on delivery.",
    },
    {
      type: "stats",
      items: [
        { label: "Ikeja route", value: "₦433,000", delta: "−₦374,000", tone: "bad", spark: [142, 168, 131, 176, 190, 184, 151, 38, 129, 31, 84], markFrom: 7, caption: "12 → 23 Oct · Mon to Sat" },
        { label: "Mushin route", value: "₦1.13m", delta: "+₦18,000", tone: "good", spark: [218, 231, 204, 226, 240, 191, 222, 236, 211, 229, 230], caption: "12 → 23 Oct · Mon to Sat" },
        { label: "Oshodi route", value: "₦968,500", delta: "−₦12,500", tone: "flat", spark: [190, 201, 188, 197, 205, 176, 192, 199, 184, 196, 197], caption: "12 → 23 Oct · Mon to Sat" },
      ],
    },
    {
      type: "highlights",
      items: [
        { text: "The drop starts **Tuesday 20 Oct**, when [[route:Van 3]] broke down at Ojota and skipped Allen Avenue", cite: [1] },
        { text: "[[shop:Ifeoma Enterprises]] and [[shop:Joy Provisions]] pay cash on delivery. They paid **₦0** this week against **₦186,000** last week", cite: [2] },
        { text: "[[shop:Kola Mart]]'s **₦120,000** alert on Thursday never landed, so it isn't counted. [[helper:Proof]] flagged it", cite: [3] },
        { text: "Mushin and Oshodi are flat, so this is a van problem, not a shop problem", sources: [{ kind: "sheet", name: "Shop list · Lagos mainland", docId: "doc-shops" }, { kind: "tool", name: "Van log" }] },
      ],
    },
    {
      type: "deliverables",
      cards: [
        { title: "Collections list · week of Oct 19", type: "Sheet", docId: "doc-col-oct19" },
        { title: "Ikeja route note · week of Oct 19", type: "Doc", docId: "doc-ikeja-note" },
      ],
    },
  ],
});

/* ---------- Credit · shops at risk this week ---------- */

const riskWork = (): WorkLine[] => [
  { id: "rk-w1", kind: "step", from: "Credit", at: T(8, 51), variant: "tool", icon: "file-text", state: "done", text: "Read **credit-rules.md**" },
  { id: "rk-w2", kind: "step", from: "Credit", at: T(8, 51), variant: "tool", icon: "landmark", state: "done", text: "Checked GTBank for late payments", meta: "· 48 shops" },
  { id: "rk-w3", kind: "step", from: "Credit", at: T(8, 52), variant: "tool", icon: "message-square", state: "done", text: "Read promise history on WhatsApp", meta: "· 19 chats" },
  {
    id: "rk-w4",
    kind: "thought",
    from: "Credit",
    at: T(8, 52),
    secs: 5,
    text: "Rule 3 says two broken promises in a row means **at risk**. Joy and Ade & Kemi hit that. Rule 5 adds anyone over 21 days late on more than ₦300,000, which brings in Alhaji Musa and Sule.",
  },
  { id: "rk-w5", kind: "step", from: "Credit", at: T(8, 52), variant: "tool", icon: "sheet", state: "done", text: "Saved the at-risk list" },
];

const riskAnswer = (): Message => ({
  id: "rk-ans",
  kind: "answer",
  from: "Credit",
  at: T(8, 52),
  worked: { secs: 34, work: riskWork() },
  blocks: [
    { type: "text", lead: true, text: "Four shops are at risk this week, with **₦1,495,900** owed between them:" },
    {
      type: "table",
      label: "Shops at risk this week",
      columns: [{ label: "Shop" }, { label: "Credit score" }, { label: "Late" }, { label: "Owes", align: "right" }, { label: "Shop page" }],
      rows: [
        [{ entity: { kind: "shop", label: "Joy Provisions" } }, { score: 44 }, { status: "overdue", text: "33 days" }, { money: 259000 }, { link: "Open", href: shopHref("joy-provisions") }],
        [{ entity: { kind: "shop", label: "Ade & Kemi Ventures" } }, { score: 49 }, { status: "overdue", text: "35 days" }, { money: 336900 }, { link: "Open", href: shopHref("ade-and-kemi-ventures") }],
        [{ entity: { kind: "shop", label: "Alhaji Musa & Sons" } }, { score: 58 }, { status: "overdue", text: "29 days" }, { money: 412000 }, { link: "Open", href: shopHref("alhaji-musa-and-sons") }],
        [{ entity: { kind: "shop", label: "Sule & Co Wholesale" } }, { score: 61 }, { status: "overdue", text: "22 days" }, { money: 488000 }, { link: "Open", href: shopHref("sule-and-co-wholesale") }],
      ],
      files: [{ kind: "file", name: "credit-rules.md", docId: "doc-credit-rules" }],
    },
    {
      type: "highlights",
      items: [
        { text: "[[shop:Joy Provisions]] and [[shop:Ade & Kemi Ventures]] both broke two promises in a row, Joy twice this month", sources: [{ kind: "whatsapp", name: "WhatsApp · Joy Provisions" }] },
        { text: "[[shop:Alhaji Musa & Sons]] owes **₦412,000**, the biggest balance on the Oshodi route, and hasn't paid since **24 Sep**", sources: [{ kind: "bank", name: "GTBank statement · 23 Oct", docId: "doc-gtb" }] },
        { text: "[[shop:Sule & Co Wholesale]] isn't on WhatsApp, so reminders go through the Van 2 driver", sources: [{ kind: "sheet", name: "Shop list · Lagos mainland", docId: "doc-shops" }] },
      ],
    },
    {
      type: "deliverables",
      visible: 3,
      rows: [
        { title: "At-risk shops · week of Oct 19", type: "Sheet", docId: "doc-risk-oct19" },
        { title: "credit-rules.md", type: "Doc", docId: "doc-credit-rules" },
        { title: "Payment plan draft · Ade & Kemi Ventures", type: "Doc", docId: "doc-plan-ade" },
        { title: "GTBank statement · 23 Oct", type: "PDF", docId: "doc-gtb" },
        { title: "Shop list · Lagos mainland", type: "Sheet", docId: "doc-shops" },
      ],
    },
  ],
});

/* ---------- Brand · Hypo weekly sell-out (reworked opening) ---------- */

export const hypoOpening = (): Message[] => [
  { id: "hy-d", kind: "date", label: "Today" },
  { id: "hy-me", kind: "text", from: "me", text: "Pull this week's sell-out for [[brand:Hypo]]", at: T(7, 48), read: true },
  {
    id: "hy-ans",
    kind: "answer",
    from: "Brand",
    at: T(7, 50),
    worked: {
      secs: 52,
      work: [
        { id: "hy-w1", kind: "step", from: "Brand", at: T(7, 49), variant: "tool", icon: "bar-chart", state: "done", text: "Read sell-out from 214 shops", meta: "· 4 areas" },
        { id: "hy-w2", kind: "step", from: "Brand", at: T(7, 49), variant: "tool", icon: "refresh-cw", state: "done", text: "Compared with last week" },
        { id: "hy-w3", kind: "step", from: "Brand", at: T(7, 50), variant: "tool", icon: "file-text", state: "done", text: "Drafted the report in Hypo's format" },
      ],
    },
    blocks: [
      { type: "text", lead: true, text: "[[brand:Hypo]] sold **1,326 cartons** across 214 shops this week, up 5%. Idumota grew fastest after the new van route." },
      {
        type: "stats",
        items: [
          { label: "Mushin", value: "412", delta: "+8%", tone: "good", spark: [52, 58, 55, 61, 57, 63, 66] },
          { label: "Oshodi", value: "365", delta: "+3%", tone: "flat", spark: [50, 52, 51, 53, 52, 54, 53] },
          { label: "Ojota", value: "298", delta: "−2%", tone: "bad", spark: [46, 45, 44, 43, 42, 40, 38], markFrom: 4 },
          { label: "Idumota", value: "251", delta: "+11%", tone: "good", spark: [28, 30, 33, 35, 38, 41, 46], markFrom: 4 },
        ],
      },
      {
        type: "deliverables",
        cards: [
          { title: "Hypo weekly sell-out report", type: "Doc", docId: "doc-hypo" },
          { title: "Sell-out by shop · week of Oct 19", type: "Sheet", docId: "doc-hypo-shops" },
        ],
      },
    ],
  },
];

export const answerConversations = (): Conversation[] => [
  {
    slug: "ikeja-collections-drop",
    title: "Why collections dropped on Ikeja",
    helper: "Collector",
    folder: "Collections",
    code: "COL-16",
    state: "done",
    status: "answered",
    working: false,
    ago: "14m",
    preview: "Van 3 broke down and missed two Ikeja runs",
    replies: [
      { label: "Add them to Monday's run", text: "Add Ifeoma and Joy to Monday's Van 3 run", step: "ans.ikeja.monday" },
      { label: "Open the collections list", step: "ans.ikeja.open" },
    ],
    messages: [
      { id: "ik-d", kind: "date", label: "Today" },
      { id: "ik-me", kind: "text", from: "me", text: "Why did collections drop this week on [[route:Ikeja route]]?", at: T(9, 2), read: true, reactions: [{ by: "Collector", r: "like" }] },
      ikejaAnswer(),
    ],
  },
  {
    slug: "shops-at-risk",
    title: "Shops at risk this week",
    helper: "Credit",
    folder: "Credit",
    code: "CRD-10",
    state: "done",
    status: "4 shops flagged",
    working: false,
    ago: "26m",
    preview: "4 shops at risk · ₦1,495,900 owed",
    replies: [
      { label: "Hold Joy's next order", text: "Hold Joy Provisions' next order until she pays", step: "ans.risk.hold" },
      { label: "Draft a plan for Ade & Kemi", text: "Draft a payment plan for Ade & Kemi", step: "ans.risk.plan" },
    ],
    messages: [
      { id: "rk-d", kind: "date", label: "Today" },
      { id: "rk-me", kind: "text", from: "me", text: "Which shops are at risk of missing payment this week? Use [[file:credit-rules.md]]", at: T(8, 51), read: true },
      riskAnswer(),
    ],
  },
];

/* ---------- the files the answers point at ---------- */

const collectionsCsv = `Shop,Route,Pays,Last week (₦),This week (₦),Change (₦)
Ifeoma Enterprises,Ikeja · Allen Ave,On delivery,104000,0,-104000
Joy Provisions,Ikeja · Ogba,On delivery,82000,0,-82000
Kola Mart,Ikeja · Computer Village,Transfer,120000,0,-120000
Allen Ave Stores,Ikeja · Allen Ave,On delivery,46000,0,-46000
Ogba Fresh Mart,Ikeja · Ogba,On delivery,38500,16500,-22000
Opebi Provisions,Ikeja · Opebi,Transfer,61000,61000,0
Oregun Wholesale,Ikeja · Oregun,Transfer,94000,94000,0`;

const riskCsv = `Shop,Route,Credit score,Owes (₦),Days late,Why
Joy Provisions,Ikeja,44,259000,33,Two broken promises
Ade & Kemi Ventures,Oshodi,49,336900,35,Two broken promises
Alhaji Musa & Sons,Oshodi,58,412000,29,Over 21 days on ₦300k+
Sule & Co Wholesale,Mushin,61,488000,22,Over 21 days on ₦300k+`;

const hypoShopsCsv = `Shop,Area,Cartons,Last week,Change
Olumide Mini Mart,Mushin,38,34,+12%
Mama Bisi Provisions,Mushin,26,25,+4%
Iya Tunde Stores,Oshodi,31,30,+3%
Blessing Supermart,Oshodi,29,29,0%
Ola & Daughters,Idumota,24,19,+26%
Chuks & Sons,Ojota,18,20,-10%`;

export const answerDocs = (): Doc[] => [
  {
    id: "doc-col-oct19",
    title: "Collections list · week of Oct 19",
    kind: "CSV",
    by: "Collector",
    at: "9:03",
    thread: "ikeja-collections-drop",
    body: { type: "csv", text: collectionsCsv },
    note: "Ikeja shops that paid less than last week",
    versions: [{ v: 1, by: "Collector", at: "9:03", note: "Made from GTBank and the shop book" }],
  },
  {
    id: "doc-ikeja-note",
    title: "Ikeja route note · week of Oct 19",
    kind: "MD",
    by: "Collector",
    at: "9:03",
    thread: "ikeja-collections-drop",
    body: {
      type: "markdown",
      text: `# Ikeja route · week of Oct 19

**Down ₦374,000** against last week (₦433,000 vs ₦807,000, Mon to Fri).

## What happened
- Van 3 broke down at Ojota on **Tuesday 20 Oct** and was in the workshop on **Thursday 22 Oct**.
- The Allen Avenue and Ogba runs were missed. Shops there pay the driver cash on delivery.
- Kola Mart's ₦120,000 alert on Thursday never landed. Proof flagged it.

## What I'd do
1. Add Ifeoma Enterprises and Joy Provisions to Monday's Van 3 run.
2. Send each a WhatsApp reminder on Sunday evening.
3. Hold Kola Mart's next order until the ₦120,000 lands.`,
    },
    note: "For the Monday route meeting",
    versions: [{ v: 1, by: "Collector", at: "9:03", note: "First draft" }],
  },
  {
    id: "doc-credit-rules",
    title: "credit-rules.md",
    kind: "MD",
    by: "you",
    at: "Mon",
    body: {
      type: "markdown",
      text: `# Credit rules · Coral Lane Trading

1. New shops start at ₦50,000 for 4 weeks.
2. Raise a limit only after 8 on-time weeks, and by no more than 50%.
3. Two broken promises in a row means **at risk**: no new credit until they pay.
4. Never chase on Sundays.
5. Over 21 days late on more than ₦300,000 means **at risk**.
6. Ask me before holding any order over ₦200,000.`,
    },
    note: "Credit reads this before every check",
    versions: [{ v: 1, by: "you", at: "Mon", note: "Written" }],
  },
  {
    id: "doc-risk-oct19",
    title: "At-risk shops · week of Oct 19",
    kind: "CSV",
    by: "Credit",
    at: "8:52",
    thread: "shops-at-risk",
    body: { type: "csv", text: riskCsv },
    note: "Checked against credit-rules.md",
    versions: [{ v: 1, by: "Credit", at: "8:52", note: "Saved" }],
  },
  {
    id: "doc-plan-ade",
    title: "Payment plan draft · Ade & Kemi Ventures",
    kind: "MD",
    by: "Credit",
    at: "8:53",
    thread: "shops-at-risk",
    body: {
      type: "markdown",
      text: `# Payment plan · Ade & Kemi Ventures

Owes **₦336,900**, 35 days late.

| When | Amount |
| --- | --- |
| This Friday | ₦120,000 |
| Fri 30 Oct | ₦72,300 |
| Fri 6 Nov | ₦72,300 |
| Fri 13 Nov | ₦72,300 |

No new credit until the first payment lands. Nothing sent yet.`,
    },
    note: "Draft. Nothing sent yet.",
    versions: [{ v: 1, by: "Credit", at: "8:53", note: "Drafted" }],
  },
  {
    id: "doc-hypo-shops",
    title: "Sell-out by shop · week of Oct 19",
    kind: "CSV",
    by: "Brand",
    at: "7:50",
    thread: "hypo-weekly",
    body: { type: "csv", text: hypoShopsCsv },
    note: "Top shops per area",
    versions: [{ v: 1, by: "Brand", at: "7:50", note: "Saved" }],
  },
];
