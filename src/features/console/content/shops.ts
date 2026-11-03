import type { ProofGrade } from "@/features/console/lib/proof";
export type ShopStatus = "g" | "w" | "o";
/** Sample routes; shops from the API are grouped by their rep instead ("Rep 1"). */
export type Route = "Oshodi" | "Mushin" | "Ikeja" | (string & {});

/**
 * What the MIMI-AGENT API knows about a shop beyond the shared fields. Present only on shops from
 * the API, which have no sell-through, score or weekly sales: screens show a dash for those.
 */
export type LiveShopExtra = {
  creditLimit: number;
  overdue: number;
  /** Days since the oldest overdue invoice fell due (newer APIs). */
  overdueDays?: number;
  openInvoices: number;
  shopType: string;
  threadId?: string;
  receivables?: { id: string; due: string; daysOverdue: number; outstanding: number }[];
  disputes?: string[];
};

/** `via` is how it came in ("GTBank transfer", "Moniepoint POS"): where it landed when verified, where the shop says it sent from when self-reported. The API has no bank yet. */
export type ShopPayment = {
  date: string;
  amount: number;
  verified: boolean;
  via?: string;
  /** How sure the payment is (API proof_grade); sample rows fall back to `verified`. */
  proof?: ProofGrade;
};

export type Shop = {
  id: string;
  name: string;
  area: string;
  route: Route;
  owner: string;
  /** Empty when the shop is not on WhatsApp. */
  whatsapp: string;
  sellThrough: number;
  owed: number;
  score: number;
  lastPayment: string;
  status: ShopStatus;
  salesThisWeek: number;
  avgDaysToPay: number;
  payments: readonly ShopPayment[];
  live?: LiveShopExtra;
};

export const shopStatus: Record<
  ShopStatus,
  { tone: "green" | "amber" | "red"; label: "Good" | "Watch" | "Overdue" }
> = {
  g: { tone: "green", label: "Good" },
  w: { tone: "amber", label: "Watch" },
  o: { tone: "red", label: "Overdue" },
};

export const routes: readonly Route[] = ["Oshodi", "Mushin", "Ikeja"];

type Row = [
  string,
  string,
  string,
  Route,
  string,
  string,
  number,
  number,
  number,
  string,
  ShopStatus,
  number,
  number,
  string,
];

const rows: Row[] = [
  [
    "mama-chidinma-provisions",
    "Mama Chidinma Provisions",
    "Oshodi Market",
    "Oshodi",
    "Chidinma Okeke",
    "+234 803 412 7781",
    81,
    184500,
    74,
    "Oct 2",
    "w",
    1240000,
    9,
    "Oct 2:150000:v:GTBank transfer|Sep 22:210000:v:GTBank transfer|Sep 15:40000:s:OPay transfer",
  ],
  [
    "alhaji-musa-and-sons",
    "Alhaji Musa & Sons",
    "Oshodi, Brown St",
    "Oshodi",
    "Musa Abdullahi",
    "+234 802 551 0934",
    64,
    412000,
    58,
    "Sep 24",
    "o",
    1610000,
    16,
    "Sep 24:180000:v:GTBank transfer|Sep 9:95000:s:UBA transfer|Aug 28:220000:v:GTBank transfer",
  ],
  [
    "blessing-supermart",
    "Blessing Supermart",
    "Oshodi, Bolade",
    "Oshodi",
    "Blessing Nwosu",
    "+234 806 220 4417",
    72,
    268000,
    66,
    "Sep 29",
    "w",
    980000,
    11,
    "Sep 29:120000:v:Moniepoint POS|Sep 17:80000:v:GTBank transfer|Sep 6:60000:s:OPay transfer",
  ],
  [
    "iya-tunde-stores",
    "Iya Tunde Stores",
    "Oshodi, Arena",
    "Oshodi",
    "Funke Adebayo",
    "+234 805 778 1290",
    88,
    58200,
    85,
    "Today",
    "g",
    860000,
    6,
    "Today:58200:v|Oct 7:140000:v|Sep 30:96000:v",
  ],
  [
    "ade-and-kemi-ventures",
    "Ade & Kemi Ventures",
    "Oshodi, Mafoluku",
    "Oshodi",
    "Adewale & Kemi Ojo",
    "+234 809 314 6652",
    54,
    336900,
    49,
    "Sep 18",
    "o",
    720000,
    18,
    "Sep 18:90000:s:OPay transfer|Sep 1:150000:v:GTBank transfer|Aug 20:75000:v:GTBank transfer",
  ],
  [
    "grace-cosmetics",
    "Grace Cosmetics",
    "Oshodi, Isolo Rd",
    "Oshodi",
    "Grace Eze",
    "+234 813 090 2245",
    76,
    96000,
    79,
    "Today",
    "g",
    410000,
    7,
    "Today:20000:v|Oct 5:45000:v|Sep 26:38000:s",
  ],
  [
    "olumide-mini-mart",
    "Olumide Mini Mart",
    "Mushin, Idi-Araba",
    "Mushin",
    "Olumide Bakare",
    "+234 807 662 3018",
    83,
    142000,
    82,
    "Oct 11",
    "g",
    940000,
    7,
    "Oct 11:110000:v:GTBank transfer|Oct 3:95000:v:Moniepoint POS|Sep 24:130000:v:GTBank transfer",
  ],
  [
    "mama-bisi-provisions",
    "Mama Bisi Provisions",
    "Mushin, Ladipo",
    "Mushin",
    "Bisi Adeleke",
    "+234 816 405 7723",
    79,
    121500,
    77,
    "Oct 10",
    "g",
    690000,
    8,
    "Oct 10:70000:v:Moniepoint POS|Oct 1:85000:s:UBA transfer|Sep 21:90000:v:GTBank transfer",
  ],
  [
    "sule-and-co-wholesale",
    "Sule & Co Wholesale",
    "Mushin, Palm Ave",
    "Mushin",
    "Sule Ibrahim",
    "",
    61,
    488000,
    61,
    "Oct 1",
    "w",
    2080000,
    12,
    "Oct 1:300000:v:GTBank transfer|Sep 18:250000:v:GTBank transfer|Sep 4:180000:s:OPay transfer",
  ],
  [
    "kola-mart",
    "Kola Mart",
    "Ikeja, Computer Village",
    "Ikeja",
    "Kolawole Adeyemi",
    "+234 803 927 4410",
    91,
    210000,
    88,
    "Oct 12",
    "g",
    1380000,
    5,
    "Oct 12:240000:v:GTBank transfer|Oct 5:210000:v:Moniepoint POS|Sep 28:190000:v:GTBank transfer",
  ],
  [
    "ifeoma-enterprises",
    "Ifeoma Enterprises",
    "Ikeja, Allen Ave",
    "Ikeja",
    "Ifeoma Chukwu",
    "+234 810 233 8861",
    68,
    175400,
    69,
    "Oct 6",
    "w",
    760000,
    10,
    "Oct 6:90000:v:GTBank transfer|Sep 25:60000:s:UBA transfer|Sep 14:110000:v:Moniepoint POS",
  ],
  [
    "joy-provisions",
    "Joy Provisions",
    "Ikeja, Ogba",
    "Ikeja",
    "Joy Okon",
    "+234 814 506 1197",
    47,
    259000,
    44,
    "Sep 20",
    "o",
    530000,
    19,
    "Sep 20:60000:s:Moniepoint POS|Sep 2:85000:v:GTBank transfer|Aug 19:70000:v:GTBank transfer",
  ],
];

export const shops: readonly Shop[] = rows.map(
  ([
    id,
    name,
    area,
    route,
    owner,
    whatsapp,
    sellThrough,
    owed,
    score,
    lastPayment,
    status,
    salesThisWeek,
    avgDaysToPay,
    pay,
  ]) => ({
    id,
    name,
    area,
    route,
    owner,
    whatsapp,
    sellThrough,
    owed,
    score,
    lastPayment,
    status,
    salesThisWeek,
    avgDaysToPay,
    payments: pay.split("|").map((p) => {
      const [date = "", amount = "0", v = "s", via] = p.split(":");
      return { date, amount: Number(amount), verified: v === "v", via };
    }),
  }),
);

export const findShop = (id: string): Shop | undefined => shops.find((s) => s.id === id);

/** Best sellers for the busiest shop; other shops scale by their weekly sales. */
export const bestSellers = [
  { name: "Peak Milk 400g", short: "Peak Milk", qty: 96, unit: "tins" },
  { name: "Indomie Chicken 70g carton", short: "Indomie", qty: 34, unit: "cartons" },
  { name: "Golden Penny Semovita 1kg", short: "Semovita", qty: 60, unit: "bags" },
  { name: "Coca-Cola 50cl crate", short: "Coca-Cola", qty: 22, unit: "crates" },
] as const;
export const BEST_SELLER_BASE_SALES = 1240000;

/** Why a shop has its credit score: [reason, positive]. */
export function scoreReasons(s: Shop): ReadonlyArray<readonly [string, boolean]> {
  const pays = `Pays within ${s.avgDaysToPay} days on average`;
  if (s.status === "g")
    return [
      [pays, true],
      ["Sales steady for 8 weeks", true],
      ["No late payments this quarter", true],
    ];
  if (s.status === "w")
    return [
      [pays, true],
      ["Sales steady for 8 weeks", true],
      ["One late payment in September", false],
    ];
  return [
    [pays, false],
    [`Sell-through down to ${s.sellThrough}% this week`, false],
    ["Two late payments since August", false],
  ];
}
