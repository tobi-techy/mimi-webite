"use client";

import { createContext, useContext } from "react";

type ShellState = {
  /** Desktop: sidebar hidden. */
  collapsed: boolean;
  /** Mobile: drawer open. */
  drawerOpen: boolean;
  /** Collapses the sidebar on desktop, opens/closes the drawer on mobile. */
  toggleSidebar: () => void;
  closeDrawer: () => void;
  openPalette: () => void;
};

export const ShellContext = createContext<ShellState>({
  collapsed: false,
  drawerOpen: false,
  toggleSidebar: () => {},
  closeDrawer: () => {},
  openPalette: () => {},
});

export const useShell = (): ShellState => useContext(ShellContext);
