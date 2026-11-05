import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";

/**
 * A shop's mark (Tobi, 5 Nov 2026: shops get clean, fun avatars that fit the UI). A rounded tile with
 * two or three flat shapes, picked from the shop's name so the same shop always looks the same.
 * Muted Factory-friendly colours, no initials. Helpers keep their drawn faces; people keep initials.
 */
const PALETTES = [
  ["#2c3a4f", "#7fb1ff", "#f2d7a6"],
  ["#3d2b24", "#ee8a4f", "#f5e6d3"],
  ["#23372f", "#7fd3a4", "#e9f0c9"],
  ["#352a43", "#b79cff", "#ffd6e8"],
  ["#3a3424", "#f1c75b", "#fff3d1"],
  ["#2a3540", "#5fd0d6", "#ffe1c2"],
  ["#40282e", "#ff8fa3", "#ffe8b0"],
  ["#2f2f2b", "#d9d4c7", "#ee6018"],
] as const;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}

export function ShopMark({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const h = hash(name);
  const [bg, a, b] = PALETTES[h % PALETTES.length] ?? PALETTES[0];
  const kind = (h >>> 3) % 6;
  const rot = ((h >>> 7) % 4) * 90;
  const shapes = [
    /* sun over a hill */
    <g key="0"><circle cx="13" cy="13" r="6" fill={b} /><path d="M0 32V22c6-6 14-8 20-4s9 4 12 2v12z" fill={a} /></g>,
    /* half moon and dot */
    <g key="1"><path d="M6 26a10 10 0 0 1 20 0z" fill={a} /><circle cx="22" cy="10" r="3.5" fill={b} /></g>,
    /* quarter and bar */
    <g key="2"><path d="M0 0h16a16 16 0 0 1-16 16z" fill={a} /><rect x="18" y="20" width="10" height="4" rx="2" fill={b} /></g>,
    /* stacked arches (shop awning) */
    <g key="3"><path d="M4 14a4 4 0 0 1 8 0 4 4 0 0 1 8 0 4 4 0 0 1 8 0v2H4z" fill={a} /><rect x="9" y="19" width="14" height="9" rx="2" fill={b} /></g>,
    /* two circles */
    <g key="4"><circle cx="12" cy="18" r="8" fill={a} /><circle cx="22" cy="12" r="5" fill={b} style={{ mixBlendMode: "screen" }} /></g>,
    /* diagonal split with dot */
    <g key="5"><path d="M0 32 32 0v32z" fill={a} /><circle cx="10" cy="10" r="4" fill={b} /></g>,
  ];
  return (
    <span className={cx("c-mark", className)} aria-hidden="true" style={{ "--s": `${size}px` } as CSSProperties}>
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <rect width="32" height="32" fill={bg} />
        <g transform={kind === 3 ? undefined : `rotate(${rot} 16 16)`}>{shapes[kind]}</g>
      </svg>
    </span>
  );
}
