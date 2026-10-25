import { buttonClass } from "@/features/console/components/ui/Button";
import { cx } from "@/lib/cx";

type ActionGroupProps = {
  label: string;
  actions: readonly string[];
  onAction: (action: string) => void;
  /** Row actions use small buttons. */
  row?: boolean;
};

/** Always-visible borderless actions (`.x-acts2`), used for header and row menus. */
export function ActionGroup({ label, actions, onAction, row }: ActionGroupProps) {
  return (
    <span className={cx("x-acts2", row && "x-racts")} role="group" aria-label={label}>
      {actions.map((a) => (
        <button
          key={a}
          className={buttonClass("ghost", row ? "sm" : "md")}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAction(a);
          }}
        >
          {a}
        </button>
      ))}
    </span>
  );
}
