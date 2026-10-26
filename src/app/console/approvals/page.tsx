import { redirect } from "next/navigation";
import { consoleRoutes } from "@/features/console/config";

/** Approvals live in the Needs you pile (and in Mimi's conversation). */
export default function ApprovalsPage() {
  redirect(consoleRoutes.needs);
}
