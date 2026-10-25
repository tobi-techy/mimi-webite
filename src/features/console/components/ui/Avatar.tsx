import type { CSSProperties } from "react";
import { ShopAvatar, type ShopAvatarSize } from "@/features/console/components/ui/ShopAvatar";
import { avatarFor } from "@/features/console/lib/avatar";
import { cx } from "@/lib/cx";

/** xs 22px, default 28px, md 32px, lg 44px. */
type AvatarSize = "xs" | "md" | "lg";

type AvatarProps = {
  name: string;
  /** Overrides the initials derived from the name. */
  initials?: string;
  size?: AvatarSize;
  /** Warm-grey circle instead of the name's tint (the signed-in user, the workspace). */
  neutral?: boolean;
};

const shopSize: Record<AvatarSize | "default", ShopAvatarSize> = { xs: 20, default: 28, md: 32, lg: 48 };

/**
 * Shops get a generated shop-front sticker (`ShopAvatar`); people and the workspace (`neutral`,
 * or explicit `initials`) keep initials in a circle (`.c-avatar`). Decorative.
 */
export function Avatar({ name, initials, size, neutral }: AvatarProps) {
  if (!neutral && !initials) return <ShopAvatar name={name} size={shopSize[size ?? "default"]} />;
  const a = avatarFor(name);
  const style: CSSProperties | undefined = neutral
    ? undefined
    : {
        background: `color-mix(in srgb, ${a.tint} 38%, var(--frame))`,
        color: `color-mix(in srgb, ${a.tint} 55%, var(--ink))`,
      };
  return (
    <span
      className={cx("c-avatar", size && `c-avatar--${size}`, neutral && "c-avatar--neutral")}
      aria-hidden="true"
      style={style}
    >
      {initials ?? a.initials}
    </span>
  );
}

/** Avatar beside a name and an optional second line (`.c-identity`): tables, settings rows, the sidebar. */
export function Identity({ name, sub, initials, size, neutral }: AvatarProps & { sub?: string }) {
  return (
    <span className="c-identity">
      <Avatar name={name} initials={initials} size={size ?? (sub ? undefined : "xs")} neutral={neutral} />
      <span className="c-identity__text">
        <span className="c-identity__name">{name}</span>
        {sub && <span className="c-identity__sub">{sub}</span>}
      </span>
    </span>
  );
}
