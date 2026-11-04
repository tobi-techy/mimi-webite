import { Fragment } from "react";

/* a figure: an optional naira sign, digits with commas or a point, and an optional m, k or % */
const FIGURE = /(₦?\d[\d,.]*(?:m|k|%)?)/;

/**
 * A summary line with its figures in ink and the connecting words left grey (the page's own
 * `.x-sub` colour): "48 shops · ₦4.82m outstanding" reads facts first.
 */
export function Facts({ text }: { text: string }) {
  return (
    <>
      {text
        .split(FIGURE)
        .map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}
