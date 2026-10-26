import { redirect } from "next/navigation";

/** Approvals live in the Needs you pile (and in Mimi's conversation). */
export default function ApprovalsPage() {
  redirect("/console/needs");
}
