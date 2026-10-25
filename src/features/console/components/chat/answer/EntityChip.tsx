import Link from "next/link";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { ShopAvatar } from "@/features/console/components/ui/ShopAvatar";
import { helperNames, type Entity, type EntityKind, type HelperName } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

const tileIcon: Partial<Record<EntityKind, IconName>> = { route: "truck", bank: "landmark", file: "file-code" };

/** The small mark in front of an entity: a shop-front sticker, a helper face, a monogram or an icon tile. */
export function EntityMark({ entity, size = 16 }: { entity: Entity; size?: 16 | 20 }) {
  if (entity.kind === "shop") return <ShopAvatar name={entity.label} size={20} className={cx("mc-ent__shop", size === 16 && "is-16")} />;
  if (entity.kind === "helper" && (helperNames as readonly string[]).includes(entity.label))
    return <HelperFace name={entity.label as HelperName} size={size} className="mc-ent__face" />;
  if (entity.kind === "brand")
    return (
      <span className="mc-ent__tile mc-ent__tile--mono" aria-hidden="true">
        {entity.label.slice(0, 2)}
      </span>
    );
  return (
    <span className="mc-ent__tile" aria-hidden="true">
      <Icon name={tileIcon[entity.kind] ?? "circle-dot"} />
    </span>
  );
}

/**
 * An inline entity in a prompt or an answer: small mark + underlined name ("on [Ikeja route]").
 * Links when there is somewhere to go (a shop's page); otherwise plain text with the underline.
 */
export function EntityChip({ entity, href }: { entity: Entity; href?: string }) {
  const body = (
    <>
      <EntityMark entity={entity} />
      <span className="mc-ent__n">{entity.label}</span>
    </>
  );
  const cls = cx("mc-ent", `mc-ent--${entity.kind}`);
  if (href)
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  return <span className={cls}>{body}</span>;
}
