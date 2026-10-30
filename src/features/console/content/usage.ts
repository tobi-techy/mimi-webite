/** Usage page sample data (Settings > Billing > See usage). Numbers are illustrative. */
export type UsageRange = "7d" | "1m" | "6m" | "1y" | "All";
export type AgentFilter = "All helpers" | "Collector" | "Stock" | "Order" | "Credit";

export const usageRanges: readonly UsageRange[] = ["7d", "1m", "6m", "1y", "All"];
export const agentFilters: readonly AgentFilter[] = [
  "All helpers",
  "Collector",
  "Stock",
  "Order",
  "Credit",
];
export const agentShare: Record<AgentFilter, number> = {
  "All helpers": 1,
  Collector: 0.42,
  Stock: 0.27,
  Order: 0.12,
  Credit: 0.19,
};

export const usageTiles = [
  { label: "Runs this month", value: "1,284", unit: "/ 2,000 plan", scales: true },
  { label: "Money recovered", value: "₦4.2M", unit: "Oct 2026" },
  { label: "Computer hours", value: "312", unit: "/ 500" },
  { label: "Last updated", value: "Oct 15", unit: "2026" },
] as const;

/** Agent breakdown radar: [axis, this month %, last month %]. */
export const agentAxes = [
  ["Collector", 92, 80],
  ["Stock", 68, 61],
  ["Order", 44, 50],
  ["Credit", 58, 49],
  ["Brand", 84, 70],
  ["Proof", 72, 66],
] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const RANGE: Record<UsageRange, { points: number; step: "d" | "w" | "m" | "q"; base: number }> = {
  "7d": { points: 7, step: "d", base: 42 },
  /* round 2: a month is five weekly totals and six months are monthly totals, so a chart never
     carries more than 12 bars and the daily noise of collections stays out of the picture */
  "1m": { points: 5, step: "w", base: 290 },
  "6m": { points: 6, step: "m", base: 1180 },
  "1y": { points: 12, step: "m", base: 1180 },
  All: { points: 8, step: "q", base: 3400 },
};

type UsagePoint = { label: string; runs: number; recovered: number };

/** Deterministic sample series ending on 15 Oct 2026. */
export function usageSeries(range: UsageRange, filter: AgentFilter): UsagePoint[] {
  const { points: n, step, base } = RANGE[range];
  const k = agentShare[filter];
  const end = new Date(2026, 9, 15);
  return Array.from({ length: n }, (_, i) => {
    const runs = Math.max(
      1,
      Math.round(base * k * (0.78 + (0.3 * i) / Math.max(1, n - 1) + 0.06 * Math.sin(i * 1.7 + n))),
    );
    const recovered = Math.round((runs * 3270 * (0.95 + 0.08 * Math.cos(i * 1.3 + n))) / 100) * 100;
    const back = n - 1 - i;
    let label: string;
    if (step === "d" || step === "w") {
      const dt = new Date(end);
      dt.setDate(end.getDate() - back * (step === "w" ? 7 : 1));
      label = `${MONTHS[dt.getMonth()]} ${dt.getDate()}`;
    } else if (step === "m") label = MONTHS[(9 - back + 12) % 12] ?? "";
    else {
      const q = 10 - back;
      label = `Q${(((q % 4) + 4) % 4) + 1} ${2024 + Math.floor(q / 4)}`;
    }
    return { label, runs, recovered };
  });
}

export type UsageShop = {
  id: number;
  name: string;
  owner: string;
  route: string;
  level: number;
  progress: number;
  ago: string;
  tags: readonly string[];
};

const OWNERS = [
  "Mama Ngozi",
  "Alhaji Musa",
  "Iya Tunde",
  "Blessing Nwosu",
  "Kola Adeyemi",
  "Ifeoma Chukwu",
  "Joy Okon",
  "Sule Ibrahim",
  "Grace Eze",
  "Chidinma Okeke",
  "Mama Bisi",
  "Olumide Bakare",
  "Emeka Obi",
  "Hauwa Sani",
  "Femi Ade",
  "Aisha Bello",
];
const TYPES = ["Provisions", "Stores", "Mini Mart"];
const ROUTES = ["Oshodi", "Mushin", "Ikeja", "Yaba", "Idumota", "Surulere"];
const AGO = ["2h ago", "5h ago", "1d ago", "3d ago", "12m ago", "6d ago", "--"];
const LEVELS = [2, 0, 3, 1, 4, 0, 1, 2, 0, 3];
const TAGS: ReadonlyArray<readonly string[]> = [["Credit"], ["Stock"], ["Credit", "Stock"], []];

export const usageShops: readonly UsageShop[] = Array.from({ length: 48 }, (_, i) => {
  const owner = OWNERS[i % 16] ?? "";
  return {
    id: i,
    name: `${owner.replace(/^(Mama|Iya|Alhaji) /, "").split(" ")[0]} ${TYPES[Math.floor(i / 16)]}`,
    owner,
    route: ROUTES[(i + Math.floor(i / 16)) % 6] ?? "",
    level: LEVELS[i % 10] ?? 0,
    progress: (i * 29 + 58) % 100,
    ago: AGO[i % 7] ?? "--",
    tags: TAGS[i % 4] ?? [],
  };
});

export const USAGE_PAGE_SIZE = 7;
