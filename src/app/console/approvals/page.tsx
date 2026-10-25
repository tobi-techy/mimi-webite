import { redirect } from "next/navigation";

/** Approvals now live in the Needs you pile on the console home. */
export default function ApprovalsPage() {
  redirect("/console");
}
