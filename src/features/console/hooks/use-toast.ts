"use client";

import { createContext, useContext } from "react";

/** One button on a toast ("Undo"): the toast stays a little longer when it has one. */
export type ToastAction = { label: string; run: () => void };

/** Shows a short status message at the bottom of the console. */
type Say = (message: string, action?: ToastAction) => void;

export const ToastContext = createContext<Say>(() => {});

export const useToast = (): Say => useContext(ToastContext);
