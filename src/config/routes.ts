/** Route constants used across both shells (marketing site and console demo). */
export const routes = {
  home: "/",
  console: "/console",
  /** Public address of the console demo. Served by a Cloudflare rewrite of console.userail.money to /console. */
  consoleUrl: process.env.NEXT_PUBLIC_CONSOLE_URL ?? "https://console.userail.money",
  signup: "/signup",
  login: "/login",
  contact: "/contact",
} as const;

/** The console is a separate shell with its own layout and styles. */
export const isConsolePath = (path: string): boolean =>
  path === routes.console || path.startsWith(`${routes.console}/`);
