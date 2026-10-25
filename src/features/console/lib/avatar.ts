/** Initials and a muted tint for a shop or person avatar (deterministic per name). */
const TINTS = [
  "#C8B593",
  "#9FB09A",
  "#C29A86",
  "#98A6B3",
  "#C6A867",
  "#ADA79C",
  "#B59E8C",
  "#8FA8A0",
] as const;

export function avatarFor(name: string): { initials: string; tint: string } {
  const words = name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w) && !/^(and|&|Sons|Co)$/.test(w));
  const initials = ((words[0]?.[0] ?? "?") + (words[1]?.[0] ?? "")).toUpperCase();
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return { initials, tint: TINTS[h % TINTS.length] ?? TINTS[0] };
}
