import "react";

declare module "react" {
  interface CSSProperties {
    /** CSS custom properties (design-system knobs such as --w, --r, --ox used by stickers). */
    [key: `--${string}`]: string | number | undefined;
  }
}
