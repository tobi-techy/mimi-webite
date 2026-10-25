export type ScreenKind = "bank" | "chat" | "sheet" | "idle";

export type Computer = {
  name: string;
  role: string;
  running: boolean;
  task: string;
  uptime: string;
  screen: ScreenKind;
  url: string;
};

export const computers: readonly Computer[] = [
  {
    name: "wigmore-01",
    role: "Payments",
    running: true,
    task: "Checking Providus statement",
    uptime: "Up 2h 14m",
    screen: "bank",
    url: "ibank.providusbank.com",
  },
  {
    name: "wigmore-02",
    role: "Collector",
    running: true,
    task: "Sending reminders to 6 shops",
    uptime: "Up 1h 02m",
    screen: "chat",
    url: "web.whatsapp.com",
  },
  {
    name: "wigmore-03",
    role: "Stock",
    running: true,
    task: "Updating Mushin route sheet",
    uptime: "Up 48m",
    screen: "sheet",
    url: "docs.google.com/spreadsheets",
  },
  {
    name: "wigmore-04",
    role: "Order",
    running: false,
    task: "Nothing running",
    uptime: "Asleep 3h",
    screen: "idle",
    url: "about:blank",
  },
  {
    name: "wigmore-05",
    role: "Spare",
    running: false,
    task: "Nothing running",
    uptime: "Asleep 1d",
    screen: "idle",
    url: "about:blank",
  },
];

export const statementRows = [
  { time: "09:12", who: "Grace Cosmetics", amount: "₦20,000" },
  { time: "08:47", who: "Okafor Mini Mart", amount: "₦45,300" },
  { time: "08:31", who: "Iya Tunde Stores", amount: "₦58,200", hit: true },
  { time: "Yest.", who: "POS settlement", amount: "₦112,900" },
  { time: "Yest.", who: "Femi Groceries", amount: "₦31,000" },
] as const;

export const chatRows = [
  { who: "Mama Chidinma", text: "Your balance of ₦184,500…", on: true },
  { who: "Alhaji Musa", text: "I will pay on Friday" },
  { who: "Ade & Kemi", text: "Good morning sir…" },
  { who: "Grace Cosmetics", text: "Thank you, received" },
  { who: "Blessing Supermart", text: "Can we split it?" },
] as const;

export const chatBubbles = [
  { text: "Good morning, who is this?" },
  { text: "This is Mimi from Wigmore. Your balance of ₦184,500 is now 12 days late.", me: true },
  { text: "Ok, I will send it today" },
] as const;

export const sheetRows = [
  { shop: "Ola Stores", cartons: 24, value: "₦648k", day: "Tue" },
  { shop: "Mama Bisi", cartons: 18, value: "₦486k", day: "Tue" },
  { shop: "Kola Mart", cartons: 36, value: "₦972k", day: "Wed", active: true },
  { shop: "Ifeoma Ent.", cartons: 12, value: "₦324k", day: "Wed" },
  { shop: "Sule & Co", cartons: 30, value: "₦810k", day: "Thu" },
  { shop: "Joy Provisions", cartons: 20, value: "₦540k", day: "Thu" },
] as const;
