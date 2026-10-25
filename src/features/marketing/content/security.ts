import type { NumberedItem } from "@/components/ui/Cards";

export const securityRules: NumberedItem[] = [
  {
    title: "Mimi never moves money.",
    body: "It reads alerts and drafts reminders. Payments stay between you and your bank.",
  },
  { title: "Shops own their book.", body: "A shop can see, export or delete its data any time." },
  {
    title: "Consent per receiver.",
    body: "Each shop chooses who sees its data, one distributor or brand at a time, and can switch it off.",
  },
  {
    title: "Brands see totals.",
    body: "Brand dashboards show area totals and trends, with no shop names or money owed unless a shop opts in.",
  },
];

export const dataHandling: NumberedItem[] = [
  { title: "Encrypted in transit and at rest." },
  { title: "Access limited to staff who need it, and logged." },
  { title: "WhatsApp chats are used only to run your account, never sold." },
  { title: "Data is kept while the account is active and deleted on request." },
  { title: "Built with the Nigeria Data Protection Act 2023 (NDPA) in mind." },
];
