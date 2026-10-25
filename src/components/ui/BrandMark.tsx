import { cx } from "@/lib/cx";

/**
 * The approved Mimi v8 mark (tilted head, bow, glancing eyes), same geometry as /favicon.svg and the
 * nav lockup. Drawn inline so it follows the theme: `--mark-ink` (head, bow) and `--mark-cut`
 * (eyes, bow outline) are set in styles/brand.css. Each part has its own wrapper group so CSS can
 * animate it without fighting the SVG transform attributes. Decorative.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={cx("mimi-mark", className)} viewBox="14 0 216 200" aria-hidden="true" focusable="false">
      <g transform="rotate(-8 120 110)">
        <g className="mimi-mark__body">
          <path d="M120 36c48 0 84 16 88 60 3 34-10 62-36 76-17 9-34 12-52 12s-35-3-52-12C42 158 29 130 32 96 36 52 72 36 120 36Z" />
        </g>
        <g className="mimi-mark__eyes">
          <g transform="translate(10 -6)">
            <ellipse cx="92" cy="114" rx="9.5" ry="13" />
            <ellipse cx="148" cy="114" rx="9.5" ry="13" />
          </g>
        </g>
        <g className="mimi-mark__bow">
          <g transform="translate(170 50) rotate(20) scale(0.8)" strokeWidth="6" strokeLinejoin="round">
            <path d="M0 0 C-8 -9 -20 -22 -33 -18 C-41 -15 -42 -2 -37 -1 C-42 2 -41 15 -33 17 C-21 21 -8 9 0 0Z" />
            <path d="M0 0 C8 -9 20 -22 33 -18 C41 -15 42 -2 37 -1 C42 2 41 15 33 17 C21 21 8 9 0 0Z" />
            <ellipse rx="7.5" ry="9" />
          </g>
        </g>
      </g>
    </svg>
  );
}
