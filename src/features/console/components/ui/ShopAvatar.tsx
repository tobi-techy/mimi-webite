import { ShopMark } from "@/features/console/components/ui/ShopMark";
import { cx } from "@/lib/cx";

/** Box sizes a shop avatar comes in. */
export type ShopAvatarSize = 20 | 28 | 32 | 36 | 48;

/**
 * A shop's avatar: its mark (Tobi, 5 Nov 2026, replaces round initials). Deterministic per name (or
 * `seed`). Decorative.
 */
export function ShopAvatar({ name, seed, size = 28, className }: { name: string; seed?: string; size?: ShopAvatarSize; className?: string }) {
  return <ShopMark name={seed ?? name} size={size} className={cx("c-shop", `c-shop--${size}`, className)} />;
}
