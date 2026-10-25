import type { Connector } from "@/features/console/content/connectors";
import { cx } from "@/lib/cx";

/** A connector's brand mark, or its initial when there is no logo file. Decorative. */
export function ConnectorLogo({ connector, size }: { connector: Connector; size?: "s" | "l" }) {
  const cls = cx("x-lg", size && `x-lg--${size}`);
  return connector.logo ? (
    <img className={cls} src={connector.logo} alt="" width={28} height={28} loading="lazy" decoding="async" />
  ) : (
    <span className={cx(cls, "x-lgt")} aria-hidden="true">
      {connector.name[0]}
    </span>
  );
}
