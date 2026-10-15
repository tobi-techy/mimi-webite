import Link from "next/link";
import { Fragment, type ReactNode } from "react";

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

/**
 * Renders the small inline subset used by the legal copy: `**bold**`,
 * `[label](href)` and a literal newline for a line break.
 */
export function RichText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];

  text.split(TOKEN).forEach((part, index) => {
    if (!part) return;

    if (part.startsWith("**") && part.endsWith("**")) {
      nodes.push(
        <strong key={index} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>,
      );
      return;
    }

    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      const className = "underline underline-offset-2";
      nodes.push(
        href.startsWith("mailto:") || href.startsWith("http") ? (
          <a key={index} href={href} className={className}>
            {label}
          </a>
        ) : (
          <Link key={index} href={href} className={className}>
            {label}
          </Link>
        ),
      );
      return;
    }

    part.split("\n").forEach((line, lineIndex) => {
      if (lineIndex > 0) nodes.push(<br key={`${index}-${lineIndex}-br`} />);
      if (line) nodes.push(<Fragment key={`${index}-${lineIndex}`}>{line}</Fragment>);
    });
  });

  return <>{nodes}</>;
}
