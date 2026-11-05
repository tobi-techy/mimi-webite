import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";

/**
 * A shop's mark (Tobi, 5 Nov 2026: shops get clean, fun avatars that fit the UI). A little storefront:
 * a striped, scalloped awning over the shop's first letter, coloured from its name so the same shop
 * always looks the same. Helpers keep their drawn faces; people keep initials.
 */
const PALETTES = [
  { bg: "#1f2a3a", a: "#7fb1ff", b: "#e8f0ff", ink: "#cfe0ff" },
  { bg: "#33241d", a: "#ee8a4f", b: "#fde9d8", ink: "#ffd2b3" },
  { bg: "#1d2f27", a: "#6fd19c", b: "#e6f7ec", ink: "#bdebd0" },
  { bg: "#2b2238", a: "#b79cff", b: "#f1eaff", ink: "#ddd0ff" },
  { bg: "#322c1c", a: "#f1c75b", b: "#fff6dc", ink: "#ffe7a6" },
  { bg: "#1c2e33", a: "#5fd0d6", b: "#e3fbfc", ink: "#b5eef1" },
  { bg: "#361f26", a: "#ff8fa3", b: "#ffeef1", ink: "#ffcad4" },
  { bg: "#2a2926", a: "#e9e4d8", b: "#ee6018", ink: "#f3efe6" },
] as const;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}

function letter(name: string) {
  const word = name.replace(/^(mama|iya|alhaji|the)\s+/i, "").trim();
  return (word.match(/[A-Za-z0-9]/)?.[0] ?? "?").toUpperCase();
}

export function ShopMark({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const h = hash(name);
  const p = PALETTES[h % PALETTES.length] ?? PALETTES[0];
  const stripes = 3 + ((h >>> 4) % 2);
  const w = 32 / stripes;
  const r = w / 2;
  return (
    <span className={cx("c-mark", className)} aria-hidden="true" style={{ "--s": `${size}px` } as CSSProperties}>
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <rect width="32" height="32" fill={p.bg} />
        <g>
          {Array.from({ length: stripes }, (_, i) => (
            <path key={i} d={`M${i * w} 0h${w}v8a${r} ${r} 0 0 1 -${w} 0z`} fill={i % 2 === 0 ? p.a : p.b} />
          ))}
        </g>
        <text
          x="16"
          y="26.5"
          textAnchor="middle"
          fontSize="13"
          fontWeight="600"
          fill={p.ink}
          style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
        >
          {letter(name)}
        </text>
      </svg>
    </span>
  );
}
