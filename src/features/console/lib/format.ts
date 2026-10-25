/** Number and time formatting for the console demo. */

export const naira = (n: number): string => `₦${Math.round(n).toLocaleString("en-US")}`;

/** ₦4.82m / ₦486k */
export const nairaShort = (n: number): string =>
  n >= 1e6 ? `₦${(n / 1e6).toFixed(2)}m` : `₦${Math.round(n / 1000)}k`;

/** "2m", "3h", "1d", "1w" -> minutes, for sorting by age. */
export function agoMinutes(ago: string): number {
  const n = Number.parseInt(ago, 10) || 0;
  if (ago.includes("w")) return n * 10080;
  if (ago.includes("d")) return n * 1440;
  if (ago.includes("h")) return n * 60;
  return n;
}
