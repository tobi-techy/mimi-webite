"use client";

import { createContext, useContext } from "react";

/** Shows a short status message at the bottom of the console. */
type Say = (message: string) => void;

export const ToastContext = createContext<Say>(() => {});

export const useToast = (): Say => useContext(ToastContext);
