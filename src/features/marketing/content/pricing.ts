/**
 * Pilot pricing (per active shop, per month). These are proposals to be confirmed with pilot
 * distributors, not a live price list. The money-saved calculator reads the same numbers.
 */
export type PlanId = "growth" | "pro";

type Plan = {
  id: PlanId;
  name: string;
  perShop: number;
  monthlyMinimum: number;
  /** Optional first line that reads "Everything in X, plus". */
  includes?: string;
  features: (string | { text: string; soon?: boolean })[];
  popular?: boolean;
};

export const plans: Plan[] = [
  {
    id: "growth",
    name: "Growth",
    perShop: 2000,
    monthlyMinimum: 100000,
    popular: true,
    features: [
      "Collector: payment matching and follow ups",
      "Fake-alert checks",
      "WhatsApp reorders",
      "Stock-out alerts",
      "Owner brief and weekly report",
      "Shops reach you on the Mimi WhatsApp number",
      "WhatsApp fees at cost",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    perShop: 3500,
    monthlyMinimum: 200000,
    includes: "Everything in Growth, plus",
    features: [
      "Proof: van checks and rep visit list",
      "Credit-limit suggestions",
      "Receivables aging",
      "Price and promo rollout",
      "Exports and API",
      "Email agent: drafts claims, POs and brand replies for approval",
      { text: "Back Office: bank reconciliation, rep pay, rebates", soon: true },
      "Cloud computer for bank and supplier portals, 40 hours a month",
    ],
  },
];

/**
 * Calculator assumptions. ESTIMATES, not guarantees: what Mimi typically fixes.
 * The free pilot measures real numbers.
 */
const savingsAssumptions = {
  /** Mimi reminders bring owed cash in 25% sooner. */
  collectFaster: 0.25,
  /** Cost of money tied up in credit, per month. */
  costOfMoney: 0.03,
  /** Share of monthly bad debt avoided. */
  badDebtCut: 0.3,
  /** Share of fake transfer alerts caught. */
  alertCatch: 0.9,
  /** Share of route leakage stopped. */
  leakCut: 0.5,
} as const;

/** "₦1,500" (en-US grouping, as on the plan cards). */
export const formatPlanNaira = (n: number): string => "₦" + n.toLocaleString("en-US");

/** Calculator inputs, with the defaults shown on load. */
export const calculatorFields = [
  { id: "cShops", label: "Active shops", value: 50, min: 1, step: 1, inputMode: "numeric" },
  {
    id: "cOrders",
    label: "Avg monthly orders per shop, ₦",
    value: 300000,
    min: 1,
    step: 1000,
    inputMode: "numeric",
  },
  {
    id: "cOwed",
    label: "Credit owed by shops right now, ₦",
    value: 7500000,
    min: 0,
    step: 10000,
    inputMode: "numeric",
  },
  {
    id: "cBad",
    label: "Bad debt written off a month, ₦",
    value: 200000,
    min: 0,
    step: 1000,
    inputMode: "numeric",
  },
  {
    id: "cAlerts",
    label: "Lost to fake transfer alerts a month, ₦",
    value: 100000,
    min: 0,
    step: 1000,
    inputMode: "numeric",
  },
  {
    id: "cLeak",
    label: "Stock or cash lost on the route, % of sales",
    value: 1,
    min: 0,
    step: 0.1,
    inputMode: "decimal",
  },
] as const;

export const defaultPlan: PlanId = "growth";

/** Plain-language versions of savingsAssumptions, shown under "See the assumptions". */
export const assumptionNotes = [
  "Reminders bring owed cash in 25% sooner, and money costs about 3% a month.",
  "Bad debt written off drops by 30%.",
  "9 in 10 fake transfer alerts get caught before goods leave.",
  "Stock and cash lost on the route halves.",
];

/** Results for the default inputs, so the panel reads correctly before (and without) JavaScript. */
export function estimateSavings(input: {
  shops: number;
  orders: number;
  owed: number;
  bad: number;
  alerts: number;
  leak: number;
  plan: PlanId;
}) {
  const plan = plans.find((p) => p.id === input.plan) ?? plans[1]!;
  const collect = input.owed * savingsAssumptions.collectFaster * savingsAssumptions.costOfMoney;
  const bad = input.bad * savingsAssumptions.badDebtCut;
  const alerts = input.alerts * savingsAssumptions.alertCatch;
  const leak = ((input.shops * input.orders * input.leak) / 100) * savingsAssumptions.leakCut;
  const saved = collect + bad + alerts + leak;
  const cost = Math.max(input.shops * plan.perShop, plan.monthlyMinimum);
  return { collect, bad, alerts, leak, saved, cost, net: saved - cost, multiple: saved / cost };
}

export const pilotFormFields = [
  { name: "Name", autoComplete: "name" },
  { name: "Company", autoComplete: "organization" },
  { name: "Phone (WhatsApp)", type: "tel", autoComplete: "tel" },
  { name: "Main route or city" },
] as const;

export const pilotShopRanges = ["Under 20", "20 to 50", "50 to 200", "200+"];

/** Yearly billing: pay for 10 months, get 12. The prepaid amount covers the minimum; shops above it are billed monthly at the yearly per-shop rate. */
export type Billing = "monthly" | "yearly";
export const yearlyMonthsFree: number = 2;
const yearlyFactor = (12 - yearlyMonthsFree) / 12;
export const yearlyPerShop = (plan: { perShop: number }): number => Math.round(plan.perShop * yearlyFactor);
export const yearlyTotal = (plan: { monthlyMinimum: number }): number =>
  plan.monthlyMinimum * (12 - yearlyMonthsFree);
export const yearlySaving = (plan: { monthlyMinimum: number }): number =>
  plan.monthlyMinimum * yearlyMonthsFree;

/** Usage-priced extras on either plan, so heavy use always covers its cost. Proposed prices, to confirm in pilots. */
export const usageExtras = [
  {
    title: "Calling agent",
    price: "₦150 a minute",
    body: "Payment reminders and delivery checks by phone.",
    soon: true,
  },
  {
    title: "Computer time",
    price: "₦1,500 an hour",
    body: "On Growth, or after the 40 hours included in Pro.",
  },
] as const;
export const yearlyMonthly = (monthly: number): number => Math.round(monthly * yearlyFactor);
