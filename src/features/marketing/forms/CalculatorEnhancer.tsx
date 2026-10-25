"use client";

import { useEffect } from "react";
import { initCalculator } from "@/features/marketing/forms/calculator";

/** Wires up the money-saved calculator rendered by PricingCalculator. */
export function CalculatorEnhancer() {
  useEffect(() => initCalculator(), []);
  return null;
}
