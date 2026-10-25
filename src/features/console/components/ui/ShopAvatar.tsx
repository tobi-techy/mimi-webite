import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * A shop's avatar: a tiny generated shop-front (kiosk, supermarket, provision store, pharmacy,
 * market stall) in a muted warm palette, die-cut sticker style. Seeded by the shop's id or name,
 * so a shop always looks the same and neighbours differ. No dependency, no orange. Decorative.
 */

export type ShopAvatarSize = 20 | 28 | 32 | 48;

/** tile, awning stripe, awning light, accent (door / sign) */
const PALETTES = [
  ["#b4c2a6", "#5f8058", "#f2ede3", "#3f5a40"],
  ["#dcbcaa", "#a35a4a", "#f4ece2", "#713f35"],
  ["#aebcc8", "#4f6a80", "#f1eee8", "#36485c"],
  ["#dcc896", "#94782e", "#f5efe0", "#64521f"],
  ["#c7b2bc", "#79546a", "#f3ede9", "#553c4b"],
  ["#a3c0b9", "#3f7068", "#f1ede6", "#2c504a"],
  ["#d2c9bc", "#66605a", "#f6f2ec", "#46413d"],
  ["#cdb69a", "#8a6340", "#f5eee3", "#5c4229"],
] as const;

const BODY = "#f4efe6";
const DARK = "#3d3a39";
const GLASS = "#9fb2bb";

export const SHOP_KINDS = ["kiosk", "supermarket", "provision", "pharmacy", "stall"] as const;
export type ShopKind = (typeof SHOP_KINDS)[number];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** The look a shop always gets: which front and which palette. */
export function shopLook(seed: string): { kind: ShopKind; palette: number } {
  const h = hash(seed.trim().toLowerCase());
  const named = /pharm|chem|drug/i.test(seed) ? "pharmacy" : /super|mart|mall/i.test(seed) ? "supermarket" : /market|stall|mama|iya/i.test(seed) ? "stall" : null;
  const kind = named && h % 2 === 0 ? named : SHOP_KINDS[h % SHOP_KINDS.length]!;
  return { kind, palette: (h >>> 7) % PALETTES.length };
}

/** A striped awning from x0 to x1, top y, height h, with scallops under it. */
function Awning({ x0, x1, y, h, n, a, b }: { x0: number; x1: number; y: number; h: number; n: number; a: string; b: string }) {
  const w = (x1 - x0) / n;
  const out: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const c = i % 2 ? b : a;
    out.push(<rect key={`s${i}`} x={x0 + i * w} y={y} width={w + 0.02} height={h} fill={c} />);
    out.push(<circle key={`c${i}`} cx={x0 + i * w + w / 2} cy={y + h} r={w / 2} fill={c} />);
  }
  return <g>{out}</g>;
}

function Front({ kind, p }: { kind: ShopKind; p: (typeof PALETTES)[number] }) {
  const [, a, b, acc] = p;
  switch (kind) {
    case "kiosk":
      return (
        <g>
          <rect x="9" y="12" width="14" height="14" rx="1" fill={BODY} />
          <rect x="11" y="16" width="10" height="5" rx=".6" fill={DARK} />
          <rect x="10" y="21" width="12" height="1.4" fill={acc} />
          <rect x="8" y="7" width="16" height="2.4" rx="1" fill={acc} />
          <Awning x0={8} x1={24} y={9.2} h={2.6} n={4} a={a} b={b} />
        </g>
      );
    case "supermarket":
      return (
        <g>
          <rect x="5" y="10" width="22" height="16" rx="1" fill={BODY} />
          <rect x="7" y="6.5" width="18" height="3.5" rx=".8" fill={acc} />
          <rect x="10" y="7.7" width="12" height="1.1" rx=".5" fill={b} opacity=".8" />
          <Awning x0={5} x1={27} y={10} h={2.4} n={6} a={a} b={b} />
          <rect x="7" y="16" width="6" height="6" rx=".5" fill={GLASS} />
          <rect x="19" y="16" width="6" height="6" rx=".5" fill={GLASS} />
          <rect x="14" y="16" width="4" height="10" rx=".4" fill={DARK} />
          <line x1="16" y1="16" x2="16" y2="26" stroke={GLASS} strokeWidth=".6" />
        </g>
      );
    case "provision":
      return (
        <g>
          <path d="M6 13 16 6l10 7z" fill={acc} />
          <rect x="7" y="13" width="18" height="13" rx=".8" fill={BODY} />
          <Awning x0={7} x1={25} y={13} h={2.2} n={5} a={a} b={b} />
          <rect x="9" y="18" width="5" height="8" rx=".4" fill={DARK} />
          <rect x="16" y="18" width="7" height="5" rx=".4" fill={GLASS} />
          <line x1="16" y1="20.5" x2="23" y2="20.5" stroke={BODY} strokeWidth=".7" />
        </g>
      );
    case "pharmacy":
      return (
        <g>
          <rect x="7" y="9" width="18" height="17" rx="1" fill={BODY} />
          <rect x="7" y="9" width="18" height="3" rx="1" fill={a} />
          <rect x="14" y="13.5" width="4" height="4" rx=".6" fill={acc} />
          <path d="M16 14.3v2.4M14.8 15.5h2.4" stroke={b} strokeWidth=".9" strokeLinecap="round" />
          <rect x="9" y="19" width="5" height="4" rx=".4" fill={GLASS} />
          <rect x="18" y="19" width="5" height="4" rx=".4" fill={GLASS} />
          <rect x="14.5" y="20" width="3" height="6" rx=".3" fill={DARK} />
        </g>
      );
    case "stall":
      return (
        <g>
          <line x1="8.5" y1="12" x2="8.5" y2="26" stroke={DARK} strokeWidth="1.2" />
          <line x1="23.5" y1="12" x2="23.5" y2="26" stroke={DARK} strokeWidth="1.2" />
          <path d="M6 12 16 6l10 6z" fill={b} />
          <path d="M16 6 11 12h3.3zM16 6l1.7 6H21z" fill={a} />
          <path d="M16 6 6 12h3zM16 6l10 6h-3z" fill={a} opacity=".55" />
          <rect x="7" y="19" width="18" height="2.4" rx=".6" fill={acc} />
          <circle cx="11" cy="17.6" r="1.6" fill={a} />
          <circle cx="14.4" cy="17.4" r="1.8" fill={GLASS} />
          <circle cx="18" cy="17.6" r="1.6" fill={b} stroke={a} strokeWidth=".5" />
          <circle cx="21.2" cy="17.5" r="1.6" fill={a} opacity=".75" />
          <rect x="9" y="21.4" width="14" height="4.6" fill={BODY} opacity=".9" />
        </g>
      );
  }
}

export function ShopAvatar({ name, seed, size = 28, className }: { name: string; seed?: string; size?: ShopAvatarSize; className?: string }) {
  const { kind, palette } = shopLook(seed ?? name);
  const p = PALETTES[palette]!;
  return (
    <span className={cx("c-shop", `c-shop--${size}`, className)} data-kind={kind} aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <rect width="32" height="32" rx="8" fill={p[0]} />
        <g transform="translate(16 18) scale(1.14) translate(-16 -17)">
          <Front kind={kind} p={p} />
          <rect x="4" y="26" width="24" height="1.2" rx=".6" fill={p[3]} opacity=".45" />
        </g>
      </svg>
    </span>
  );
}
