/**
 * "What I remember" (fixture): the notes each helper keeps about the owner's business, shown in the
 * helper details from the name pill. Edit and forget are local to the session in the demo.
 */
export type MemoryNote = { id: string; text: string };

const notes: Record<string, string[]> = {
  Mimi: [
    "You like short updates in the morning, before 9.",
    "Never message shops on Sunday.",
    "Ikeja and Yaba are your busiest areas.",
  ],
  Collector: [
    "Joy's Store pays within 10 days, so a soft reminder is enough.",
    "Kola Mart sent a fake alert once. Always check GTB first.",
    "Reminders go out on WhatsApp, never SMS.",
  ],
  Credit: ["Default limit for a new shop is ₦50,000.", "Raise a limit only after 8 on-time weeks."],
  Order: ["Bright Foods orders 30 cartons every Monday."],
  Stock: ["Price list changes go to all Yaba shops at once."],
  Brand: ["You want the Coral Lane name on every invoice."],
  Proof: ["A payment counts only when it shows in GTB or Moniepoint."],
};

export function memoryFor(helper: string): MemoryNote[] {
  return (notes[helper] ?? []).map((text, i) => ({ id: `${helper.toLowerCase()}-${i}`, text }));
}
