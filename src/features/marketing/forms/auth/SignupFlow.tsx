"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { initSignupFlow } from "@/features/marketing/forms/auth/signup-flow";

/** Wires up the signup steps rendered by SignupView. `?type=distributor|brand` preselects the account type. */
export function SignupFlow() {
  const query = useSearchParams().toString();
  const flow = useRef<ReturnType<typeof initSignupFlow> | null>(null);
  const entered = useRef(false);

  useEffect(() => {
    const root = document.getElementById("signup");
    if (!root) return;
    flow.current = initSignupFlow(root);
    entered.current = false;
    return () => {
      flow.current?.destroy();
      flow.current = null;
    };
  }, []);

  useEffect(() => {
    flow.current?.enter(query, !entered.current);
    entered.current = true;
  }, [query]);

  return null;
}
