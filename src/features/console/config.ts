/** Console routes and constants. */
export const consoleRoutes = {
  home: "/console",
  threads: "/console/threads",
  shops: "/console/shops",
  credit: "/console/credit",
  automations: "/console/automations",
  settings: "/console/settings",
} as const;

export const threadHref = (slug: string): string => `${consoleRoutes.threads}/${slug}`;
export const shopHref = (id: string): string => `${consoleRoutes.shops}/${id}`;

/** First console visit in a session shows "Opening your book" (see lib/boot-script.ts). */
export const CONSOLE_LOADER_KEY = "mimi-console-loaded";
export const CONSOLE_LOADER_MS = 950;

/** Below this width the sidebar becomes a drawer. */
export const DRAWER_BREAKPOINT = 899;
