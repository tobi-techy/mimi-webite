import { createElement } from "react";
import { iconPaths, type IconName } from "@/features/console/components/ui/icon-paths";

/** A console icon (decorative: always aria-hidden; label the button instead). */
export function Icon({ name, className = "i" }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name].map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs }))}
    </svg>
  );
}
