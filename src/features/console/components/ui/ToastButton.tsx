"use client";

import type { ReactNode } from "react";
import { buttonClass, type ButtonSize, type ButtonVariant } from "@/features/console/components/ui/Button";
import { useToast } from "@/features/console/hooks/use-toast";

type ToastButtonProps = {
  message: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  label?: string;
  children: ReactNode;
};

/** A demo action: shows `message` as a toast. Lets server components keep their buttons. */
export function ToastButton({ message, variant, size, label, children }: ToastButtonProps) {
  const say = useToast();
  return (
    <button
      className={buttonClass(variant, size)}
      type="button"
      aria-label={label}
      onClick={() => say(message)}
    >
      {children}
    </button>
  );
}
