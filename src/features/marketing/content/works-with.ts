import type { LogoId } from "@/features/marketing/content/logos";

/** "Works with what you use": the tools Mimi reads from and writes to. */
export const worksWith = {
  label: "Works with what you use",
  title: "No new app for your shops or your team.",
  groups: [
    { caption: "Today", ids: ["whatsapp", "gmail", "googlesheets", "microsoftexcel", "googledrive"] },
    { caption: "Invoices and exports, next", ids: ["quickbooks", "zoho", "sage", "xero", "odoo"] },
  ] satisfies { caption: string; ids: LogoId[] }[],
  note: "Shops pay from any Nigerian bank or fintech app. Every transfer is confirmed with a licensed payment partner.",
};
