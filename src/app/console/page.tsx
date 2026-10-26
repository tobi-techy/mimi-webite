import type { Metadata } from "next";
import { MimiHome } from "@/features/console/components/chat/MimiHome";

export const metadata: Metadata = { title: "Mimi" };

/** The console opens on Mimi's conversation. The Needs you pile moved to /console/needs. */
export default function ConsoleHomePage() {
  return <MimiHome />;
}
