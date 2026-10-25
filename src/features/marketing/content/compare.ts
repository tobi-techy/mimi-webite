/**
 * Compare pages: the /compare hub and one /compare/[slug] page per tool.
 * Source of truth: compare/compare-content.md and compare/sources.md (24 Oct 2026).
 * Every competitor fact here comes from their own public pages, listed in each page's `sources`.
 * Mimi is pre-launch: no customer claims, Collector and Proof run in pilots first.
 */

export const COMPARE_CHECKED = "24 Oct 2026";
export const COMPARE_CHECKED_ISO = "2026-10-24";

export type Cell = "Yes" | "No" | "Partial" | "Not listed";

export type SourceRef = { label: string; url: string; note?: string };

export type Comparison = {
  slug: string;
  /** Display name ("F6C Distro"). */
  name: string;
  /** Who makes it, shown under the name. */
  maker: string;
  /** Two or three letters for the hairline monogram tile (no hotlinked logos). */
  monogram: string;
  category: string;
  price: string;
  /** One honest line for the matrix and cards. */
  take: string;
  /** H1 is "{name} vs Mimi: {hook}". */
  hook: string;
  metaDescription: string;
  summary: string;
  verdict: string;
  /** By the numbers: `src` is the 1-based index into `sources`. */
  stats: { figure: string; caption: string; src: number }[];
  /** Side by side: Where it counts | them | Mimi. */
  rows: { label: string; them: string; mimi: string }[];
  without: { title: string; body: string };
  with: { title: string; body: string };
  deep: { eyebrow: string; title: string; body: string; bullets: string[] }[];
  faq: { q: string; a: string }[];
  related: string[];
  sources: SourceRef[];
};

/** Mimi's own pages, cited for Mimi facts (the internal brief is published on these pages). */
const mimiPricing: SourceRef = {
  label: "Mimi pricing (pilot pricing, to be confirmed with pilot distributors)",
  url: "/pricing",
};
const mimiSecurity: SourceRef = { label: "Mimi security and data", url: "/security" };
const mimiHome: SourceRef = { label: "Mimi home: the three witnesses", url: "/" };

export const comparisons: Comparison[] = [
  {
    slug: "f6c-distro",
    name: "F6C Distro",
    maker: "F6 Commerce, Lagos",
    monogram: "F6",
    category: "AI sales agent on WhatsApp",
    price: "Free pilot, Growth ₦200k a month",
    take: "The closest tool to Mimi. Great at reorders and invoices. Mimi also checks the money and the route.",
    hook: "the order, and what happens after",
    metaDescription:
      "F6C Distro vs Mimi, checked 24 Oct 2026. Both work on WhatsApp. F6C is strong on reorders and invoices; Mimi also checks payments, routes and keeps one shop book.",
    summary:
      "F6C Distro is an AI sales agent on WhatsApp, built and run first on the founder's own FMCG brand. It learns each outlet's order rhythm, reaches out before they run out, takes the order and handles invoices and follow ups. Mimi does the chasing too, then checks what happens after: did the money land, did the goods arrive, does the rep's story match.",
    verdict:
      "Pick F6C if your main problem is missed reorders and order admin and you sell your own brand into outlets. Pick Mimi if you lose money to fake transfer alerts, unpaid credit or route leakage, or your shops buy from several distributors.",
    stats: [
      { figure: "20", caption: "Outlets in F6C's free pilot, on one rep or WhatsApp line", src: 1 },
      { figure: "₦200k", caption: "F6C Growth a month: up to 100 outlets and 5 reps or lines", src: 1 },
      {
        figure: "30 days",
        caption: "After this, F6C's agent hands an unpaid account back to your team",
        src: 1,
      },
    ],
    rows: [
      {
        label: "Works in WhatsApp for shops",
        them: "Yes. Outlets install nothing",
        mimi: "Yes. Shops reply on WhatsApp",
      },
      {
        label: "AI that does the work",
        them: "Yes. Check ins, orders, invoices, reminders",
        mimi: "Yes. Six helpers",
      },
      { label: "Catches fake transfer alerts", them: "Not listed", mimi: "Yes, in pilots first" },
      { label: "Route and rep leakage checks", them: "Not listed", mimi: "Yes, in pilots first" },
      { label: "Shared shop book across distributors", them: "Not listed", mimi: "Yes. The shop owns it" },
      {
        label: "Approval before anything is sent",
        them: "Partial. Invoices on order approval, reminders on your schedule",
        mimi: "Yes. Nothing goes out without a yes",
      },
      { label: "Never moves money", them: "Not listed", mimi: "Yes" },
      {
        label: "Price for 100 shops a month",
        them: "₦200,000 flat (Growth)",
        mimi: "₦200,000 (Growth, ₦2,000 per shop)",
      },
    ],
    without: {
      title: "With F6C on its own",
      body: "An agent learns each outlet's rhythm, takes the order on WhatsApp, typed or as a voice note, creates the invoice in your accounting tool and sends graduated reminders on a schedule you control, with your team copied. After 30 days it hands the account back to your team. Its page does not list checks on whether a transfer really landed or whether goods reached the shop.",
    },
    with: {
      title: "With Mimi",
      body: "Collector chases what is owed and Proof checks the route. Three witnesses, your rep, the shop and the bank, have to agree before a payment counts. Each shop keeps one book on WhatsApp that every distributor it buys from connects to, so credit decisions use the full picture. Mimi proposes, you approve, and Mimi never moves money. Mimi is pre-launch, so this starts as a pilot.",
    },
    deep: [
      {
        eyebrow: "Where F6C is strong",
        title: "Built on a real brand's routes",
        body: "F6C Distro was built and run first on the founder's own brand, Retaur: 50+ outlets across Lagos managed by a two-person operations team. It shows in the details.",
        bullets: [
          "Reads typed orders, voice notes, Pidgin and shorthand, with a menu fallback",
          "Predicts when an outlet is about to run out and checks in first",
          "Tracks batches, expiry and returns per outlet for perishable products",
        ],
      },
      {
        eyebrow: "Where Mimi is different",
        title: "Checking what happens after the order",
        body: "F6C focuses on getting the order and the invoice right. Mimi is built for the part after: the transfer, the delivery and the rep's report.",
        bullets: [
          "Three witnesses (rep, shop, bank) must agree, which is how fake alerts get caught",
          "One shop book, shared with every distributor the shop chooses",
          "Distributors set credit; payments go straight from shop to distributor",
        ],
      },
    ],
    faq: [
      {
        q: "Is F6C Distro cheaper than Mimi?",
        a: "At 100 shops they cost the same: F6C Growth is ₦200,000 a month flat and Mimi Growth is ₦2,000 per shop. F6C has a free pilot for up to 20 outlets. F6C says WhatsApp Business API fees are charged separately; Mimi passes WhatsApp fees on at cost.",
      },
      {
        q: "Which one fits if I sell my own brand?",
        a: "F6C's copy speaks to brands and was built on the founder's own brand. If missed reorders are your main problem, start there. If your problem is money that goes missing between the van, the shop and the bank, that is what Mimi is built for.",
      },
      {
        q: "Is Mimi live?",
        a: "Not yet. Mimi is pre-launch and starting with a small number of distributor pilots. Collector and Proof run in pilots first, before general release.",
      },
    ],
    related: [
      "F6C Distro pricing",
      "F6C Distro alternative",
      "WhatsApp ordering for distributors",
      "fake transfer alert check",
    ],
    sources: [
      { label: "F6C Distro product page and pricing", url: "https://www.f6commerce.com/f6c-distro" },
      { label: "F6 Commerce homepage (now the founder's portfolio)", url: "https://f6commerce.com" },
      mimiPricing,
    ],
  },
  {
    slug: "distroos",
    name: "DistroOS",
    maker: "VFG Digital and AI Solution",
    monogram: "DO",
    category: "Distributor ERP",
    price: "₦24,950 to ₦124,950 a month",
    take: "A full ERP that does a lot for the price. Mimi is the follow up and checking layer, not your stock ledger.",
    hook: "software you run, or helpers that chase",
    metaDescription:
      "DistroOS (VFG Distro) vs Mimi, checked 24 Oct 2026. DistroOS is a full distributor ERP from ₦24,950 a month. Mimi is the WhatsApp layer that chases, checks and proves.",
    summary:
      "DistroOS is a complete distributor ERP: inventory and warehouses, batch and expiry tracking, invoicing, ledgers, credit limits, a customer ordering portal, WhatsApp ordering and AI forecasting. It is software your team works in. Mimi is a set of helpers that do the follow up on WhatsApp and check it with three witnesses. VFG Distro and DistroOS are the same product.",
    verdict:
      "Pick DistroOS if you need one system to run inventory, invoicing and accounts. Pick Mimi if you already keep your books somewhere and need help collecting money, checking payments and catching leakage on routes. Some distributors may use both.",
    stats: [
      { figure: "₦24,950", caption: "DistroOS Basic a month: 500 SKUs, 1 warehouse, 5 staff", src: 1 },
      { figure: "14 days", caption: "DistroOS free trial, no card needed", src: 1 },
      {
        figure: "₦124,950",
        caption: "DistroOS Premium a month: adds DMS, routes and unlimited staff",
        src: 1,
      },
    ],
    rows: [
      {
        label: "Works in WhatsApp for shops",
        them: "Yes. Customers order via WhatsApp chat",
        mimi: "Yes. Shops reply on WhatsApp",
      },
      {
        label: "AI that does the work",
        them: "Partial. Forecasting, reorder suggestions, chatbot",
        mimi: "Yes. Six helpers",
      },
      {
        label: "Inventory, warehouses, accounts",
        them: "Yes. Multi-warehouse, batch, expiry, ledgers",
        mimi: "No. Keep your books where they are",
      },
      { label: "Catches fake transfer alerts", them: "Not listed", mimi: "Yes, in pilots first" },
      {
        label: "Route and rep leakage checks",
        them: "Partial. Routes and delivery tracking on Premium",
        mimi: "Yes, in pilots first",
      },
      { label: "Shared shop book across distributors", them: "Not listed", mimi: "Yes. The shop owns it" },
      { label: "Never moves money", them: "Not listed", mimi: "Yes" },
      {
        label: "Price for 100 shops a month",
        them: "₦64,950 Professional, ₦124,950 Premium (flat)",
        mimi: "₦200,000 (Growth, ₦2,000 per shop)",
      },
    ],
    without: {
      title: "With DistroOS on its own",
      body: "Your team runs stock, warehouses, invoices, ledgers and credit limits in one system, and customers can order through a portal or WhatsApp chat. Route management, field agent ordering and delivery tracking come on Premium. Someone on your team still does the chasing, and its page does not list checks for fake alerts or leakage.",
    },
    with: {
      title: "With Mimi",
      body: "Mimi does not try to be your stock ledger or accounting system. Its helpers chase what is owed on WhatsApp, check that each payment really arrived and matches what the rep and shop say, and wait for your yes before anything goes out. Mimi never moves money. It is pre-launch, so it starts as a pilot on one route.",
    },
    deep: [
      {
        eyebrow: "Where DistroOS is strong",
        title: "One system for stock, invoices and credit",
        body: "For running a warehouse and its books, DistroOS does a lot for the price, and the 14-day trial makes it easy to try.",
        bullets: [
          "Multi-warehouse inventory with batch tracking and expiry alerts",
          "Credit management, ledgers and aging, with credit limits and pricing tiers",
          "A customer ordering portal plus WhatsApp ordering on Professional and above",
        ],
      },
      {
        eyebrow: "Where Mimi is different",
        title: "Helpers that do the follow up",
        body: "DistroOS is software your team works in. Mimi is the layer that chases, checks and proves what happens between your warehouse and the shop.",
        bullets: [
          "Chasing and reminders done on WhatsApp, approved by you first",
          "Three witnesses (rep, shop, bank) before a payment counts",
          "One shop book the shop owns, shared with the distributors it chooses",
        ],
      },
    ],
    faq: [
      {
        q: "Is DistroOS cheaper than Mimi?",
        a: "As a flat fee, yes. DistroOS Professional is ₦64,950 a month; Mimi Growth for 100 shops is ₦200,000. They are different kinds of tool: DistroOS runs your warehouse and books, Mimi chases, checks and proves.",
      },
      {
        q: "Are VFG Distro and DistroOS the same?",
        a: "Yes. DistroOS is built by VFG Digital and AI Solution and lives at distro.vfgtechnology.com.",
      },
      {
        q: "Do I need to switch from my ERP to use Mimi?",
        a: "No. Keep it. Mimi is the WhatsApp layer next to it, and during a pilot we work out with you how records should move between the two.",
      },
    ],
    related: ["VFG Distro", "DistroOS pricing", "distributor ERP Nigeria", "DistroOS alternative"],
    sources: [
      { label: "DistroOS product page, modules and pricing", url: "https://distro.vfgtechnology.com/" },
      {
        label: "VFG Technology, DistroOS product page",
        url: "https://www.vfgtechnology.com/products/distroos",
        note: "checked via search excerpt",
      },
      mimiPricing,
    ],
  },
  {
    slug: "zotok",
    name: "ZöTok",
    maker: "Zono Tradetech, India",
    monogram: "Zö",
    category: "WhatsApp order to cash (India)",
    price: "Not listed",
    take: "Mature and capable, built for India's UPI and Tally world. Mimi is built for Nigerian transfers, credit and routes.",
    hook: "built for India, built for Nigeria",
    metaDescription:
      "ZöTok vs Mimi, checked 24 Oct 2026. ZöTok is a mature WhatsApp order to cash platform built for India. Mimi is built for Nigerian distributors: transfers, credit and routes.",
    summary:
      "ZöTok is a mature WhatsApp order to cash platform. It turns WhatsApp messages, voice notes, handwritten notes and images into structured orders, runs targeted campaigns and reconciles payments against ERPs like Tally and SAP. It is built for India. Mimi is built for how Nigerian distribution works: bank transfers, fake alert screenshots, van routes and credit to small shops.",
    verdict:
      "Pick ZöTok if you operate in India or run a large network on Indian ERPs. Pick Mimi if you distribute in Nigeria and want help with transfers, credit and route checks.",
    stats: [
      {
        figure: "500+",
        caption: "Buyers on automated ordering in 3 months (Surana Group case study)",
        src: 2,
      },
      { figure: "500+", caption: "Retailers on a loyalty programme (Birla Nu case study)", src: 2 },
      { figure: "4", caption: "ERPs named for payment reconciliation: Tally, Marg, Focus, SAP", src: 1 },
    ],
    rows: [
      {
        label: "Works in WhatsApp for shops",
        them: "Yes. Buyers order through WhatsApp",
        mimi: "Yes. Shops reply on WhatsApp",
      },
      {
        label: "AI that does the work",
        them: "Yes. Orders from messages, voice notes, images",
        mimi: "Yes. Six helpers",
      },
      {
        label: "Catches fake transfer alerts",
        them: "Partial. Reads payment references from images",
        mimi: "Yes, in pilots first",
      },
      { label: "Route and rep leakage checks", them: "Not listed", mimi: "Yes, in pilots first" },
      {
        label: "Approval before anything is sent",
        them: "Partial. Rule based approvals on orders",
        mimi: "Yes. Nothing goes out without a yes",
      },
      { label: "Never moves money", them: "No. Offers ZöPay collection and payment links", mimi: "Yes" },
      {
        label: "Payments it is built around",
        them: "UPI, NEFT, RTGS, card",
        mimi: "Nigerian bank transfers",
      },
      { label: "Price", them: "Not listed", mimi: "₦2,000 per shop a month (Growth)" },
    ],
    without: {
      title: "With ZöTok on its own",
      body: "Orders arrive on WhatsApp in any shape and become structured orders with quotations, confirmations, invoices and payment links. Payment details are read from images and reconciled with your ERP, and outstanding amounts are tracked by customer, route and due date. It is designed around UPI, Tally and Indian ERPs.",
    },
    with: {
      title: "With Mimi",
      body: "Mimi is built for transfers and fake alert screenshots, not UPI. Three witnesses, your rep, the shop and the bank, have to agree before a payment counts, and Proof checks van routes. Each shop keeps one book that its distributors connect to. Mimi never touches the money. It is pre-launch and starting with pilots.",
    },
    deep: [
      {
        eyebrow: "Where ZöTok is strong",
        title: "Messy WhatsApp in, clean orders out",
        body: "ZöTok has case studies of hundreds of buyers ordering through it, and it handles the way people really send orders.",
        bullets: [
          "WhatsApp messages, voice notes, handwritten notes, CSV or images become orders",
          "Targeted WhatsApp campaigns to buyers",
          "Payment details parsed from images and reconciled with Tally, Marg, Focus or SAP",
        ],
      },
      {
        eyebrow: "Where Mimi is different",
        title: "Built around Nigerian transfers and routes",
        body: "ZöTok links a distributor to many principals. Mimi links a shop to all the distributors it buys from, and checks the money without holding it.",
        bullets: [
          "Fake transfer alerts caught by three witnesses, not one screenshot",
          "Van routes and credit to small shops checked by Proof and Collector",
          "Mimi never moves money; ZöTok offers its own payment collection",
        ],
      },
    ],
    faq: [
      {
        q: "Does ZöTok work in Nigeria?",
        a: "We cannot say. Its public site is built around India: UPI payments, Tally and Indian ERPs, and partner criteria in rupees. Ask ZöTok directly.",
      },
      {
        q: "Does ZöTok hold money?",
        a: "Its site offers ZöPay payment options and payment links. It does not say it holds funds. Mimi never moves money; shops pay distributors directly.",
      },
      {
        q: "How much does ZöTok cost?",
        a: "Pricing is not listed on its distributor page or homepage. Mimi's pilot pricing is on our pricing page.",
      },
    ],
    related: [
      "ZöTok alternative",
      "WhatsApp order to cash",
      "payment reconciliation from screenshots",
      "distributor app Nigeria",
    ],
    sources: [
      { label: "ZöTok for distributors", url: "https://www.zotok.ai/distributors" },
      {
        label: "ZöTok homepage, case studies",
        url: "https://www.zotok.ai/",
        note: "checked via search excerpt",
      },
      { label: "ZöTok for brands", url: "https://www.zotok.ai/brands", note: "checked via search excerpt" },
      { label: "ZöTok partners", url: "https://www.zotok.ai/partners", note: "checked via search excerpt" },
    ],
  },
  {
    slug: "the-old-way",
    name: "The old way",
    maker: "Notebook, WhatsApp groups and Excel",
    monogram: "OW",
    category: "Notebook, WhatsApp, Excel",
    price: "Staff time and phones",
    take: "Cheap, familiar and fully in your hands. It starts to slip once reps are on routes and shops are on credit.",
    hook: "notebook and WhatsApp, or helpers that check",
    metaDescription:
      "The old way (notebook, WhatsApp groups and Excel) vs Mimi. What it does well, where money slips, and when Mimi starts to help.",
    summary:
      "Notebooks, Excel and WhatsApp groups cost almost nothing, everyone already knows them, and nothing is sent without a person choosing to send it. They depend on people remembering, typing and checking by hand. Mimi keeps the same WhatsApp your shops already use, does the chasing and checking, and still waits for your yes.",
    verdict:
      "If you have a few shops and see every one yourself, the old way may be fine. Once you have reps on routes and shops on credit, Mimi is built to catch what slips.",
    stats: [
      { figure: "3", caption: "Witnesses Mimi needs to agree on a payment: rep, shop, bank", src: 2 },
      { figure: "₦0", caption: "What shops pay for Mimi. They use the WhatsApp they have", src: 1 },
      { figure: "1 route", caption: "Where a Mimi pilot starts, before you decide", src: 1 },
    ],
    rows: [
      {
        label: "Works in WhatsApp for shops",
        them: "Partial. Groups and chats, all by hand",
        mimi: "Yes. Shops reply on WhatsApp",
      },
      { label: "AI that does the work", them: "No", mimi: "Yes. Six helpers" },
      {
        label: "Catches fake transfer alerts",
        them: "No. A person checks the bank app",
        mimi: "Yes, in pilots first",
      },
      { label: "Route and rep leakage checks", them: "No", mimi: "Yes, in pilots first" },
      { label: "Shared shop book across distributors", them: "No", mimi: "Yes. The shop owns it" },
      {
        label: "Approval before anything is sent",
        them: "Yes. Every step is by hand, so it is slow",
        mimi: "Yes. Nothing goes out without a yes",
      },
      { label: "Never moves money", them: "Yes", mimi: "Yes" },
      {
        label: "What it costs",
        them: "Staff time and phones",
        mimi: "Per shop, monthly minimum. Shops free",
      },
    ],
    without: {
      title: "Without Mimi",
      body: "Someone types the reminders, scrolls the bank app to match each transfer and copies the notebook into Excel at night. A fake alert can look real. A notebook can go missing. A rep's report can go unchecked for weeks, and nobody sees it until the money is short.",
    },
    with: {
      title: "With Mimi",
      body: "Your shops keep the same WhatsApp. Collector drafts the reminders and checks payments, Proof checks the route, and three witnesses have to agree before a payment counts. You still say yes before anything goes out, and Mimi never moves money. Mimi is pre-launch, so it starts as a pilot on one route.",
    },
    deep: [
      {
        eyebrow: "Where it is strong",
        title: "Cheap, known, and nothing goes out by itself",
        body: "There is a reason most distributors still run on a notebook and WhatsApp. It works when the owner can see everything.",
        bullets: [
          "Costs almost nothing beyond staff time and phones",
          "Everyone, from reps to shop owners, already knows how to use it",
          "Nothing is sent without a person choosing to send it",
        ],
      },
      {
        eyebrow: "Where it slips",
        title: "It runs on memory",
        body: "The old way depends on people remembering, typing and checking by hand. As routes and credit grow, gaps open between what the rep says, what the shop says and what the bank shows.",
        bullets: [
          "A fake transfer alert can look exactly like a real one",
          "A notebook can go missing, and the record goes with it",
          "A rep's report can go unchecked for weeks",
        ],
      },
    ],
    faq: [
      {
        q: "Do my shops have to pay or download anything?",
        a: "No. Shops are free. They use WhatsApp, which they already have, and join by replying YES on a delivery receipt or scanning a QR sticker.",
      },
      {
        q: "Will I lose control of what gets sent?",
        a: "No. Mimi proposes, code checks, and you approve. Nothing goes out without a yes.",
      },
      {
        q: "When is the old way enough?",
        a: "If you have a few shops and see every one yourself, it may be fine. Mimi helps once you have reps on routes and shops on credit.",
      },
    ],
    related: [
      "track shop credit on WhatsApp",
      "fake transfer alert Nigeria",
      "distributor notebook to app",
      "rep leakage on routes",
    ],
    sources: [mimiPricing, mimiHome, mimiSecurity],
  },
];

export const getComparison = (slug: string) => comparisons.find((c) => c.slug === slug);

/** Three other comparisons for "Keep reading". */
export const otherComparisons = (slug: string) => comparisons.filter((c) => c.slug !== slug).slice(0, 3);

/* ---------- hub ---------- */

export const compareHub = {
  eyebrow: "Comparisons",
  title: "Mimi vs the tools distributors use",
  sub: "There are good tools for distributors in Nigeria. Here is an honest look at what each one does, where Mimi is different, and who should pick what.",
  intro: [
    "Most tools do one job well: take the order, send the invoice, run the warehouse. Mimi does the chasing too. Our bet is helpers on WhatsApp that do the follow up work, check it with three witnesses, and wait for your yes.",
    "Every comparison is researched on each company's own website and cited, with real prices and real strengths. Mimi is pre-launch, and we say so wherever it matters.",
  ],
  shortVersion: [
    {
      title: "It checks the money.",
      body: "Three witnesses (your rep, the shop and the bank) have to agree. That is how Mimi catches fake transfer alerts and goods or cash that go missing on a route.",
    },
    {
      title: "One shop book, shared.",
      body: "A shop keeps one book on WhatsApp, and every distributor it buys from connects to it. The shop owns that book.",
    },
    {
      title: "You approve first.",
      body: "Mimi proposes, code checks, the owner approves. Nothing goes out without a yes.",
    },
    {
      title: "Mimi never moves money.",
      body: "Distributors set credit. Payments go straight from shop to distributor, the way they do today.",
    },
  ],
};

/** Feature by feature. Columns: Mimi, the old way, F6C Distro, DistroOS, ZöTok. */
export const featureColumns = ["Mimi", "The old way", "F6C Distro", "DistroOS", "ZöTok"] as const;

export const featureRows: { label: string; cells: (Cell | string)[]; marks?: (string | undefined)[] }[] = [
  { label: "Works in WhatsApp for shops", cells: ["Yes", "Partial", "Yes", "Yes", "Yes"] },
  { label: "AI helpers that do the work", cells: ["Yes", "No", "Yes", "Partial", "Yes"] },
  {
    label: "Catches fake transfer alerts",
    cells: ["Yes", "No", "Not listed", "Not listed", "Partial"],
    marks: ["1"],
  },
  {
    label: "Route and rep leakage checks",
    cells: ["Yes", "No", "Not listed", "Partial", "Not listed"],
    marks: ["1"],
  },
  {
    label: "Shared shop book across distributors",
    cells: ["Yes", "No", "Not listed", "Not listed", "Not listed"],
  },
  { label: "Brand sell-through", cells: ["Yes", "No", "Partial", "Not listed", "Partial"] },
  {
    label: "Approval before anything is sent",
    cells: ["Yes", "Yes", "Partial", "Not listed", "Partial"],
    marks: [undefined, "2"],
  },
  { label: "Never moves money", cells: ["Yes", "Yes", "Not listed", "Not listed", "No"] },
  { label: "Shop owns its data", cells: ["Yes", "Partial", "Not listed", "Not listed", "Not listed"] },
  {
    label: "Free for shops",
    cells: ["Yes", "Yes", "Yes", "Yes", "Not listed"],
    marks: [undefined, undefined, "3", "3"],
  },
  {
    label: "Pricing model",
    cells: [
      "Per shop, monthly minimum",
      "Staff time and phones",
      "Flat monthly by plan",
      "Flat monthly by plan",
      "Not listed",
    ],
  },
];

export const featureNotes = [
  "1. Mimi is pre-launch. Collector (payments) and Proof (route and delivery checks) run in pilots first before general release.",
  "2. With the old way, a person does every step by hand, so nothing is sent without someone choosing to send it. It is just slow.",
  "3. Their pricing is paid by the seller, and their sites say outlets or customers do not need to install anything or pay. They do not say “free for shops” in those words.",
];

export const costRows: { plan: string; price: string; included: string; fees: string; mimi?: boolean }[] = [
  {
    plan: "Mimi Growth",
    price: "₦200,000 (₦2,000 per shop, minimum ₦100,000)",
    included: "Six helpers, shared shop book, three-witness checks",
    fees: "Passed on at cost",
    mimi: true,
  },
  {
    plan: "Mimi Pro",
    price: "₦350,000 (₦3,500 per shop, minimum ₦200,000)",
    included: "Everything in Growth, plus Pro features",
    fees: "Passed on at cost",
    mimi: true,
  },
  {
    plan: "F6C Distro Growth",
    price: "₦200,000 flat",
    included: "Up to 100 outlets and 5 reps or WhatsApp lines. Free pilot for up to 20 outlets",
    fees: "Charged separately by Meta",
  },
  {
    plan: "DistroOS Professional",
    price: "₦64,950 flat",
    included: "Full ERP, WhatsApp automation, AI forecasting, 20 staff. 14-day free trial",
    fees: "Not listed",
  },
  {
    plan: "DistroOS Premium",
    price: "₦124,950 flat",
    included: "Adds routes (DMS), custom branding, API, unlimited staff",
    fees: "Not listed",
  },
  { plan: "ZöTok", price: "Not listed", included: "Not listed", fees: "Not listed" },
];

export const costNote =
  "Mimi yearly plans: pay for 10 months on your minimum, get 12. Shops never pay. DistroOS is cheaper as a flat fee. It is also a different kind of tool: an ERP for running your warehouse and books. Mimi is the layer that chases, checks and proves what happens between your warehouse and the shop.";

export const alongside: { tool: string; what: string; next: string }[] = [
  {
    tool: "OmniRetail",
    what: "A B2B network linking manufacturers, distributors and over 160,000 retailers, with buy-now-pay-later credit for retailers and its own POS (OmniPay)",
    next: "OmniRetail can supply stock and credit. Mimi helps a distributor run its own routes, credit and collections with its own shops.",
  },
  {
    tool: "TradeDepot",
    what: "A marketplace and distribution network for global brands, with BNPL for merchants",
    next: "A source of products and a sales channel. Mimi works on the distributor's own shop relationships.",
  },
  {
    tool: "Duplo",
    what: "B2B payments, expense management, invoicing and reconciliation for businesses",
    next: "Duplo moves and reconciles money. Mimi never moves money. It checks that payments match what the rep and shop say.",
  },
  {
    tool: "BeatRoute, FieldAssist, 1Channel",
    what: "Sales force and distributor management software (apps for reps, routes, orders, schemes). FieldAssist and 1Channel price by quote",
    next: "Built mainly for brands and large sales teams using an app. Mimi works on WhatsApp for distributors and their shops.",
  },
  {
    tool: "Moniebook (by Moniepoint)",
    what: "Inventory, sales and POS for shops. Core ₦6,000 and Pro ₦8,500 a month at launch",
    next: "Helps a shop run its till and stock. Mimi's shop book is free and connects the shop to its distributors.",
  },
  {
    tool: "Bumpa",
    what: "Online store, inventory and sales records for small businesses, from ₦5,000 a month (billed quarterly)",
    next: "Helps a shop sell online. Mimi is about the shop's buying, credit and payments with distributors.",
  },
  {
    tool: "Sage, QuickBooks, Zoho",
    what: "General accounting and ERP software",
    next: "Keep your books where they are. Mimi does the WhatsApp follow up and checking that these tools do not.",
  },
];

export const alongsideNote =
  "As listed on each company's website, checked 24 Oct 2026. Moniebook prices are from Moniepoint's launch announcement (Dec 2025). Pricing may have changed.";

export const tableNote =
  "As listed on each company's website, checked 24 Oct 2026. Pricing and features may have changed. “Not listed” means we could not find it on their public site. It does not mean they lack it.";

export const compareFaq: { q: string; a: string }[] = [
  {
    q: "Is Mimi live?",
    a: "Not yet. Mimi is pre-launch and we are starting with a small number of distributor pilots. Collector and Proof run in pilots first, before general release.",
  },
  {
    q: "Does Mimi hold or move my money?",
    a: "No. Mimi never moves money. Shops pay you the way they do today. Mimi checks that a payment really arrived and matches what the rep and the shop say.",
  },
  {
    q: "Do my shops have to pay or download anything?",
    a: "No. Shops are free. They use WhatsApp, which they already have. They join by replying YES on a delivery receipt or scanning a QR sticker.",
  },
  {
    q: "Who can see a shop's data?",
    a: "The shop owns its book. Each distributor sees only what the shop shares with it, such as purchases and payments with that distributor. Distributors set their own credit limits.",
  },
  {
    q: "I already use an ERP or accounting software. Do I need to switch?",
    a: "No. Keep it. Mimi is the WhatsApp layer that chases, checks and proves what happens between your warehouse and your shops. We will work out with you during the pilot how records should move between the two.",
  },
];

export const compareCta = {
  title: "See it on your own routes",
  sub: "Start with a pilot on one route. We will show you what Mimi catches before you decide.",
  button: "Book a pilot",
  href: "/contact",
  small: "Shops are always free.",
};
