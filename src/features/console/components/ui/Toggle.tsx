"use client";

import { useState } from "react";

/** On/off switch (`.c-toggle`, role=switch). Holds its own demo state. */
export function Toggle({
  label,
  defaultOn,
  onToggle,
}: {
  label: string;
  defaultOn: boolean;
  onToggle?: (on: boolean) => void;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      className="c-toggle"
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => {
        setOn(!on);
        onToggle?.(!on);
      }}
    />
  );
}
