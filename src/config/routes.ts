/** Route constants used across both shells (marketing site and console demo). */
export const routes = {
  home: "/",
  console: "/console",
  signup: "/signup",
  login: "/login",
  contact: "/contact",
} as const;

/** The console is a separate shell with its own layout and styles. */
export const isConsolePath = (path: string): boolean =>
  path === routes.console || path.startsWith(`${routes.console}/`);
