/**
 * Where the console lives in this build. "/console" in the full site (`npm run build:export`);
 * "" in the console-only build (`npm run build:console`), which serves the console at the root of
 * console.userail.money with clean URLs (/shops, /threads/…).
 */
export const CONSOLE_BASE: string = process.env.NEXT_PUBLIC_CONSOLE_BASE ?? "/console";

/** True in the console-only build: there is no marketing site, every path is a console path. */
export const CONSOLE_ONLY = CONSOLE_BASE === "";

/** A console path under the build's base: consolePath("/shops") is "/console/shops" or "/shops". */
export const consolePath = (path = ""): string => `${CONSOLE_BASE}${path}` || "/";

/** Route constants used across both shells (marketing site and console demo). */
export const routes = {
  home: "/",
  console: consolePath(),
  /** Public address of the console demo (the console-only build, see scripts/build-console.mjs). */
  consoleUrl: process.env.NEXT_PUBLIC_CONSOLE_URL ?? "https://console.userail.money",
  signup: "/signup",
  login: "/login",
  contact: "/contact",
} as const;

/** The console is a separate shell with its own layout and styles. */
export const isConsolePath = (path: string): boolean =>
  CONSOLE_ONLY || path === routes.console || path.startsWith(`${routes.console}/`);
