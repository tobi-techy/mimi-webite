/**
 * Links in markdown come from helper and shop text, so only web, mail and phone links (and paths
 * inside the console) become links; anything else (javascript:, data:, …) stays plain text.
 * Everything else here renders as React text nodes, which React escapes; no HTML is injected.
 */
export function safeHref(raw: string | undefined): string | undefined {
  const href = (raw ?? "").trim();
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  return undefined;
}

/**
 * Images in markdown: https only (no http: mixed content, no data:, blob: or javascript:), or a path
 * inside the console's own site. Anything else is shown as its alt text.
 */
export function safeImageSrc(raw: string | undefined): string | undefined {
  const src = (raw ?? "").trim();
  if (/^https:\/\/[^\s/]+/i.test(src)) return src;
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  return undefined;
}
