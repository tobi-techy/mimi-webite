import { Children, Fragment, type ReactNode } from "react";

/**
 * Renders children with a space between each, the way inline elements (labels, buttons, links)
 * were separated in the original hand-written markup. Keeps inline spacing identical.
 */
export function Spaced({ children }: { children: ReactNode }) {
  return (
    <>
      {Children.toArray(children).map((child, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          {child}
        </Fragment>
      ))}
    </>
  );
}
