/** Number and time formatting for the console demo. */

export const naira = (n: number): string => `₦${Math.round(n).toLocaleString("en-US")}`;

/** "2m", "3h", "1d", "1w" -> minutes, for sorting by age. */
export function agoMinutes(ago: string): number {
  const n = Number.parseInt(ago, 10) || 0;
  if (ago.includes("w")) return n * 10080;
  if (ago.includes("d")) return n * 1440;
  if (ago.includes("h")) return n * 60;
  return n;
}
