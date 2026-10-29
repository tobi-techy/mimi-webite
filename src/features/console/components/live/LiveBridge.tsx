"use client";

import { useEffect } from "react";
import { useLive } from "@/features/console/api/live-store";
import { startLive } from "@/features/console/api/sync";
import { useToast } from "@/features/console/hooks/use-toast";

/** Starts the live layer once (demo build only) and shows its notices as the console's toast. */
export function LiveBridge() {
  const say = useToast();
  const notice = useLive((s) => s.notice);
  useEffect(() => {
    void startLive();
  }, []);
  useEffect(() => {
    if (notice) say(notice.text);
  }, [notice, say]);
  return null;
}
