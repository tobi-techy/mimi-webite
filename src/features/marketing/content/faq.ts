/** "Fair questions" FAQs, as shown on each audience page. Also published as FAQPage JSON-LD. */
export type FaqItem = { q: string; a: string };

export const distributorsFaq: FaqItem[] = [
  { q: "Do my reps need training?", a: "No. They keep using WhatsApp." },
  { q: "Can I see other brands' sales?", a: "Never." },
  { q: "Who owns the shop data?", a: "The shop." },
  { q: "Does Mimi hold my money?", a: "No. Payments settle straight to your own account." },
  { q: "Can I export my data?", a: "Yes. Pro includes exports and an API." },
];

export const brandsFaq: FaqItem[] = [
  { q: "Can I see competitor sales?", a: "Never." },
  {
    q: "Where does the data come from?",
    a: "Real deliveries, verified payments and shop stock counts, with each shop's consent.",
  },
  { q: "Do shops get anything?", a: "Mimi is free for shops, always." },
];

export const shopsFaq: FaqItem[] = [
  { q: "Do I pay?", a: "No. Mimi is free for shops." },
  { q: "Do I need a smartphone?", a: "Any phone with WhatsApp works." },
  { q: "Do I have to change how I keep my book?", a: "No. Write it your way and snap the page." },
  { q: "Can I stop?", a: "Yes. Send STOP any time." },
];
