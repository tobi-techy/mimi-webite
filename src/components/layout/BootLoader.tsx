import { BrandMark } from "@/components/ui/BrandMark";

/**
 * First-visit loading screen, shared by the marketing site ("Loading the book") and the console
 * ("Opening your book"). Server-rendered and hidden by default; the boot script (lib/boot-script.ts)
 * shows it before first paint with `html.x-loading`, then hands off with `html.x-loading-out`
 * (a top-down clip wipe, like the page transitions). All timing lives in the boot script and
 * styles/boot-loader.css, so it never waits on hydration.
 */
export function BootLoader({ label }: { label: string }) {
  return (
    <div className="boot-load" role="status" aria-label="Loading">
      <div className="boot-load__in">
        <span className="boot-load__mark">
          <BrandMark />
        </span>
        <span className="boot-load__label">{label}</span>
        <span className="boot-load__bar" aria-hidden="true">
          <i></i>
          <b></b>
        </span>
      </div>
      <span className="boot-load__edge" aria-hidden="true"></span>
    </div>
  );
}
