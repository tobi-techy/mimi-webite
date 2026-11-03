import { consolePath } from "@/config/routes";
import { findShop } from "@/features/console/content/shops";

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
  /** Shop lists: one message, sent to each shop privately (demo data). */
  lists: consolePath("/lists"),
  automations: consolePath("/automations"),
  /** Computer tasks: one hosted cloud browser per task, approved once by the owner. */
  computers: consolePath("/computers"),
  /** Ask for a new task (goal and the site it starts on). */
  newComputerTask: consolePath("/computers/new"),
  /** One task, opened by id (?id=…, static-export safe like /shops/live?id=…). */
  computerTask: consolePath("/computers/task"),
  helpers: consolePath("/helpers"),
  settings: consolePath("/settings"),
} as const;

export const threadHref = (slug: string): string => `${consoleRoutes.threads}/${slug}`;
export const listHref = (id: string): string => `${consoleRoutes.lists}/${id}`;
export const helperHref = (name: string): string => `${consoleRoutes.helpers}/${name.toLowerCase()}`;
/** One computer task's page: the id goes in the query, so the static export has a page to serve. */
export const computerTaskHref = (id: string): string => `${consoleRoutes.computerTask}?id=${encodeURIComponent(id)}`;
/** Sample shops have their own static page; shops from the API open at /shops/live?id=… (static-export safe). */
export const shopHref = (id: string): string =>
  findShop(id) ? `${consoleRoutes.shops}/${id}` : `${consoleRoutes.shops}/live?id=${encodeURIComponent(id)}`;

/** First console visit in a session shows "Opening your book" (see lib/boot-script.ts, components/layout/BootLoader.tsx). */
export const CONSOLE_LOADER_KEY = "mimi-console-loaded";

/** Below this width the sidebar becomes a drawer. */
export const DRAWER_BREAKPOINT = 899;

/**
 * How a thread reads (Tobi, 29 Oct 2026: "keep ui clean, maybe remove the thinking state").
 * Off by default: threads read like iMessage, bubbles only, with three typing dots while a helper works.
 * On: the full work trail comes back ("Thought for 4s" reasoning, tool steps, handoffs, approval gates,
 * "Worked for" on answers and the checklist pinned above the composer).
 */
export const consoleThread = {
  showWork: false,
  /**
   * v2 (design/console-components-v2): even with the trail off, an answer keeps one quiet,
   * collapsed line ("6 steps · 34s") that opens into the activity list (Muse/Grok's second
   * status layer). Turn off to go back to bubbles only.
   */
  showStepsLine: true,
} as const;
