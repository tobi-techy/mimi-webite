/**
 * Mimi (v8: tilted head, bow, glancing eyes) looking around, with a wink (the 404 mascot). Pure SVG + CSS keyframes in
 * site.css (`.x-mimi-look`); holds still under prefers-reduced-motion.
 */
export function MimiLooking({ className, size }: { className?: string; size?: "sm" | "xs" }) {
  return (
    <svg
      className={["x-mimi-look", size && `x-mimi-look--${size}`, className].filter(Boolean).join(" ")}
      viewBox="0 0 240 210"
      aria-hidden="true"
    >
      <g className="x-mimi-look__tilt" transform="rotate(-8 120 110)">
        <g className="x-mimi-look__head">
          <path
            className="x-mimi-look__face"
            d="M120 36c48 0 84 16 88 60 3 34-10 62-36 76-17 9-34 12-52 12s-35-3-52-12C42 158 29 130 32 96 36 52 72 36 120 36Z"
          />
          <g className="x-mimi-look__eyes">
            <ellipse className="x-mimi-look__eye" cx="102" cy="108" rx="9.5" ry="13" />
            <ellipse className="x-mimi-look__eye x-mimi-look__eye--wink" cx="158" cy="108" rx="9.5" ry="13" />
          </g>
          <g className="x-mimi-look__bow" transform="translate(170 50) rotate(20) scale(0.8)">
            <path d="M0 0 C-8 -9 -20 -22 -33 -18 C-41 -15 -42 -2 -37 -1 C-42 2 -41 15 -33 17 C-21 21 -8 9 0 0Z" />
            <path d="M0 0 C8 -9 20 -22 33 -18 C41 -15 42 -2 37 -1 C42 2 41 15 33 17 C21 21 8 9 0 0Z" />
            <ellipse rx="7.5" ry="9" />
          </g>
        </g>
      </g>
    </svg>
  );
}
