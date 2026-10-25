"use client";

import { useEffect } from "react";
import { initLoginFlow } from "@/features/marketing/forms/auth/login-flow";

/** Wires up the login steps rendered by LoginView. */
export function LoginFlow() {
  useEffect(() => {
    const root = document.getElementById("login");
    if (!root) return;
    const flow = initLoginFlow(root);
    return () => flow.destroy();
  }, []);
  return null;
}
