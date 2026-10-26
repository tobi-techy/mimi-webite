/** Options for the composer chips (new thread and follow-up). */
export type LevelOption = { value: string; detail: string; level: 1 | 2 | 3 };

export const models: readonly LevelOption[] = [
  { value: "Mimi Lite", detail: "Fastest, for quick lookups", level: 3 },
  { value: "Mimi Standard", detail: "Balanced speed and care", level: 2 },
  { value: "Mimi Max", detail: "Slowest, for long multi-shop runs", level: 1 },
];

export const autonomy: readonly LevelOption[] = [
  { value: "Low", detail: "Asks before every step", level: 1 },
  { value: "Medium", detail: "Asks before messages and money", level: 2 },
  { value: "High", detail: "Asks only before money moves", level: 3 },
];

export const workspaces = ["Coral Lane Trading", "Coral Lane Ikeja branch"] as const;
export const shopScopes = ["All 48 shops", "Oshodi · 6", "Mushin · 3", "Ikeja · 3"] as const;
export const computerChoices = [
  { value: "Computer: Auto", detail: "Mimi picks a free computer" },
  { value: "coral-01", detail: "Payments" },
  { value: "coral-02", detail: "Collector" },
  { value: "coral-03", detail: "Stock" },
] as const;

export const COMPOSER_PLACEHOLDER = "Ask anything, / for commands, @ for a shop";
