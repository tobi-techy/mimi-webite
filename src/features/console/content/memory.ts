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

/**
 * Pinned rules (fixture): constraints that are never compacted. A task's own thread shows them in
 * one Geist Mono row that stays put while the messages scroll.
 */
const rules: Record<string, string[]> = {
  Mimi: ["No messages on Sunday", "Short updates before 9"],
  Collector: ["Credit cap ₦50,000", "No Sunday visits", "WhatsApp only"],
  Credit: ["Credit cap ₦50,000 for new shops", "8 on-time weeks before a raise"],
  Order: ["Bright Foods: 30 cartons max"],
  Stock: ["Price changes go to all Yaba shops at once"],
  Brand: ["Coral Lane name on every invoice"],
  Proof: ["GTB or Moniepoint only counts as paid"],
};
export function rulesFor(helper: string): string[] {
  return rules[helper] ?? [];
}
