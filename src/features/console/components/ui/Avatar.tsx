import type { CSSProperties } from "react";
import { avatarFor } from "@/features/console/lib/avatar";
import { cx } from "@/lib/cx";
import { ShopMark } from "@/features/console/components/ui/ShopMark";

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

/**
 * Shops and people are round initials avatars (`.c-avatar`, Factory rebuild 31 Oct 2026: helpers are
 * the only marks). The workspace and the signed-in user (`neutral`) are warm grey. Decorative.
 */
export function Avatar({ name, initials, size, neutral }: AvatarProps) {
  const a = avatarFor(name);
  const style: CSSProperties | undefined = neutral ? undefined : ({ "--av": a.tint } as CSSProperties);
  return (
    <span className={cx("c-avatar", size && `c-avatar--${size}`, neutral ? "c-avatar--neutral" : "mf-av mf-av--c")} aria-hidden="true" style={style}>
      {initials ?? a.initials}
    </span>
  );
}

/** Avatar beside a name and an optional second line (`.c-identity`): tables, settings rows, the sidebar. */
export function Identity({ name, sub, initials, size, neutral, shop }: AvatarProps & { sub?: string; shop?: boolean }) {
  return (
    <span className={cx("c-identity", shop && "c-identity--shop")}>
      {shop ? (
        <ShopMark name={name} size={sub ? 32 : 22} />
      ) : (
        <Avatar name={name} initials={initials} size={size ?? (sub ? undefined : "xs")} neutral={neutral} />
      )}
      <span className="c-identity__text">
        <span className="c-identity__name">{name}</span>
        {sub && <span className="c-identity__sub">{sub}</span>}
      </span>
    </span>
  );
}
