"use client";

import { useState } from "react";
import { Picker } from "@/features/console/components/ui/Picker";

/** A bordered dropdown (`.x-pk`) that keeps its demo value. */
export function Select({
  label,
  options,
  defaultValue,
}: {
  label: string;
  options: readonly string[];
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <Picker
      label={label}
      value={value}
      variant="plain"
      onChange={setValue}
      options={options.map((o) => ({ value: o }))}
    />
  );
}
