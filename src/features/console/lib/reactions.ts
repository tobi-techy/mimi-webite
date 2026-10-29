/**
 * iMessage tapbacks as real emoji (Tobi, 29 Oct 2026: "for the like and reaction use real emoji").
 * The six classic tapback keys stay the stored values (demo seeds and the API keep working); they
 * just render as the system emoji now. Any other reaction is already an emoji and renders as is.
 */
export const TAPBACK_EMOJI = {
  heart: "❤️",
  like: "👍",
  dislike: "👎",
  haha: "😂",
  bang: "‼️",
  question: "❓",
} as const;

/** The emoji a reaction shows: a tapback key maps to its emoji, anything else is shown as given. */
export function reactionEmoji(r: string): string {
  return (TAPBACK_EMOJI as Record<string, string>)[r] ?? r;
}

/** Badge order on a message: other people first, yours in front (iMessage), at most `max`. */
export function badgeOrder<T extends { by: string }>(list: T[], max = 3): T[] {
  return [...list.filter((q) => q.by !== "me"), ...list.filter((q) => q.by === "me")].slice(-max);
}

/**
 * Reactions that just left the list (removed), so the badge can shrink them out before they go.
 * Compares by `by` + `r`.
 */
export function leftReactions<T extends { by: string; r: string }>(prev: T[], next: T[]): T[] {
  const key = (q: T) => `${q.by}\u0000${q.r}`;
  const now = new Set(next.map(key));
  return prev.filter((q) => !now.has(key(q)));
}
