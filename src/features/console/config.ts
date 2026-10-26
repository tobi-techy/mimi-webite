import { consolePath } from "@/config/routes";

/** Console routes and constants. Every path goes through consolePath (the build's base: "/console" or root). */
export const consoleRoutes = {
  /** Mimi's conversation: the console opens on her. */
  home: consolePath(),
  /** Everything waiting on the owner in one pile (⌘K "Needs you"; Mimi's conversation links here too). */
  needs: consolePath("/needs"),
  /** Start a new thread: helper chips and a composer. */
  newThread: consolePath("/needs#new"),
  threads: consolePath("/threads"),
  shops: consolePath("/shops"),
  credit: consolePath("/credit"),
  automations: consolePath("/automations"),
  helpers: consolePath("/helpers"),
  settings: consolePath("/settings"),
} as const;

export const threadHref = (slug: string): string => `${consoleRoutes.threads}/${slug}`;
export const helperHref = (name: string): string => `${consoleRoutes.helpers}/${name.toLowerCase()}`;
export const shopHref = (id: string): string => `${consoleRoutes.shops}/${id}`;

/** First console visit in a session shows "Opening your book" (see lib/boot-script.ts, components/layout/BootLoader.tsx). */
export const CONSOLE_LOADER_KEY = "mimi-console-loaded";

/** Below this width the sidebar becomes a drawer. */
export const DRAWER_BREAKPOINT = 899;
