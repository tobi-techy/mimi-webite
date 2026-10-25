/** Re-run reveals for content a component just re-rendered (the blog tag filter). */
export const REARM_EVENT = "mimi:rearm";

export function rearmReveal(scope: ParentNode | null): void {
  if (scope) window.dispatchEvent(new CustomEvent<ParentNode>(REARM_EVENT, { detail: scope }));
}
