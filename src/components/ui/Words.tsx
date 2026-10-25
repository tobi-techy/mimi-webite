import { Fragment } from "react";

/**
 * Splits a headline's text into word spans (`.x-w`) so the reveal can lift it in line by line.
 * Rendered on the server, so the start state is in the HTML; without JS (or with reduced motion)
 * the CSS shows the words as plain text.
 */
export function W({ children }: { children: string }) {
  return (
    <>
      {children.split(/(\s+)/).map((part, i) => {
        if (!part) return null;
        if (/^\s+$/.test(part)) return <Fragment key={i}>{part}</Fragment>;
        return (
          <span key={i} className="x-w">
            {part}
          </span>
        );
      })}
    </>
  );
}
