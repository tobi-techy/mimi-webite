"use client";

import { useState } from "react";
import { Button } from "@/features/console/components/ui/Button";
import { useToast } from "@/features/console/hooks/use-toast";
import { naira } from "@/features/console/lib/format";
import { sfx } from "@/lib/sound";

const STEP = 10000;

/** Demo credit limit editor: step the limit, save it, get a toast. */
export function LimitControl({ shop, owed }: { shop: string; owed: number }) {
  const start = Math.max(50000, Math.ceil((owed * 1.5) / STEP) * STEP);
  const [saved, setSaved] = useState(start);
  const [limit, setLimit] = useState(start);
  const [open, setOpen] = useState(false);
  const say = useToast();
  if (!open)
    return (
      <Button onClick={() => setOpen(true)}>
        Credit limit {naira(saved)}
      </Button>
    );
  return (
    <span className="mc-limit" role="group" aria-label={`Credit limit for ${shop}`}>
      <Button size="sm" aria-label="Lower the limit by ₦10,000" onClick={() => (setLimit((l) => Math.max(0, l - STEP)), sfx("console", "select", { direction: "back" }))}>
        −
      </Button>
      <output className="x-num" aria-live="polite">
        {naira(limit)}
      </output>
      <Button size="sm" aria-label="Raise the limit by ₦10,000" onClick={() => (setLimit((l) => l + STEP), sfx("console", "select"))}>
        +
      </Button>
      <Button
        size="sm"
        variant="primary"
        onClick={() => {
          setSaved(limit);
          setOpen(false);
          sfx("console", "success", { emphasis: "subtle" });
          say(limit === saved ? "Limit unchanged" : `${shop}'s limit is now ${naira(limit)}. Credit will tell them on WhatsApp.`);
        }}
      >
        Save
      </Button>
    </span>
  );
}
