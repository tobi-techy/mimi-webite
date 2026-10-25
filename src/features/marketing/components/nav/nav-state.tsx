"use client";

import { createContext, useContext } from "react";

type NavState = { open: boolean; toggle: () => void };

export const NavStateContext = createContext<NavState>({ open: false, toggle: () => {} });

/** Mobile menu open state, provided by NavFrame. */
export const useNavState = (): NavState => useContext(NavStateContext);
