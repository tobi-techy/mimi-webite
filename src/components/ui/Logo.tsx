import Link from "next/link";

/** The Mimi wordmark: reverse (light) art for the dark theme, ink art for the light theme. */
export function Logo({ className = "x-logo" }: { className?: string }) {
  return (
    <Link className={className} href="/" aria-label="Mimi home">
      <img className="x-logo--rev" src="/brand/mimi-logo-horizontal-reverse.svg" alt="Mimi" />
      <img className="x-logo--ink" src="/brand/mimi-logo-horizontal-ink.svg" alt="Mimi" />
    </Link>
  );
}
