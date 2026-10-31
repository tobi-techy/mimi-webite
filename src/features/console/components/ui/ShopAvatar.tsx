import type { CSSProperties } from "react";
import { avatarFor } from "@/features/console/lib/avatar";
import { cx } from "@/lib/cx";

/** Box sizes a shop avatar comes in. */
export type ShopAvatarSize = 20 | 28 | 32 | 36 | 48;

/**
 * A shop's avatar: its initials in a round tinted circle (Factory rebuild, 31 Oct 2026, Tobi: people
 * and shops are round initials avatars, helpers are the only drawn marks). The old shop-front
 * stickers are retired. Deterministic per name (or `seed`). Decorative.
 */
export function ShopAvatar({ name, seed, size = 28, className }: { name: string; seed?: string; size?: ShopAvatarSize; className?: string }) {
  const a = avatarFor(seed ?? name);
  const initials = seed ? avatarFor(name).initials : a.initials;
  return (
    <span
      className={cx("c-shop", `c-shop--${size}`, "mf-av", className)}
      aria-hidden="true"
      style={{ "--av": a.tint, "--s": `${size}px` } as CSSProperties}
    >
      {initials}
    </span>
  );
}
