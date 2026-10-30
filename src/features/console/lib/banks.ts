/**
 * The banks and payment apps the console names, with their real marks in /console/banks/ (square
 * tiles cut from each brand's own logo, via Wikimedia Commons):
 *   GTBank      commons.wikimedia.org/wiki/File:GTBank_logo.svg
 *   Moniepoint  commons.wikimedia.org/wiki/File:Moniepoint_Logo.svg (the M mark on its blue)
 *   Providus    commons.wikimedia.org/wiki/File:Providusbanklogo.jpg (the mark on its slate)
 *   OPay        commons.wikimedia.org/wiki/File:Opay_Digital_Services_Limited.png (the O mark)
 *   UBA         commons.wikimedia.org/wiki/File:United_bank_of_Africa.png (the mark, white on red)
 * A bank not listed here gets a neutral initials tile.
 */
export type Bank = { key: string; name: string; src: string };

const BANKS: readonly (Bank & { match: RegExp })[] = [
  { key: "gtbank", name: "GTBank", src: "/console/banks/gtbank.svg", match: /\b(GTBank|GTB|Guaranty Trust)\b/ },
  { key: "moniepoint", name: "Moniepoint", src: "/console/banks/moniepoint.svg", match: /\bMoniepoint\b/i },
  { key: "providus", name: "Providus", src: "/console/banks/providus.png", match: /\bProvidus\b/i },
  { key: "opay", name: "OPay", src: "/console/banks/opay.png", match: /\bOPay\b/i },
  { key: "uba", name: "UBA", src: "/console/banks/uba.png", match: /\b(UBA|United Bank for Africa)\b/ },
];

/** The bank a name or a line of text names first, or undefined ("GTBank credit 8:51" is GTBank). */
export function bankOf(text: string | undefined): Bank | undefined {
  if (!text) return undefined;
  let best: { bank: Bank; at: number } | undefined;
  for (const b of BANKS) {
    const m = b.match.exec(text);
    if (m && (!best || m.index < best.at)) best = { bank: { key: b.key, name: b.name, src: b.src }, at: m.index };
  }
  return best?.bank;
}

/** Where the first bank name sits in a line, so its logo can go right before it. */
export function bankSplit(text: string): { before: string; bank: Bank; word: string; after: string } | undefined {
  const bank = bankOf(text);
  if (!bank) return undefined;
  const re = BANKS.find((b) => b.key === bank.key)!.match;
  const m = re.exec(text)!;
  return { before: text.slice(0, m.index), bank, word: m[0], after: text.slice(m.index + m[0].length) };
}

/** Initials for a bank with no mark on file ("Wema Bank" is "WB"). */
export function bankInitials(name: string): string {
  const w = name.split(/\s+/).filter((x) => x && !/^bank$/i.test(x));
  return (w.length > 1 ? (w[0]![0] ?? "") + (w[1]![0] ?? "") : (w[0] ?? "?").slice(0, 2)).toUpperCase();
}
