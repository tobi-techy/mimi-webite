import { bankInitials, bankOf, bankSplit } from "@/features/console/lib/banks";
import { cx } from "@/lib/cx";

export type BankLogoSize = 16 | 20 | 24;

/**
 * A bank's mark as a small square tile (hairline edge, 6px corners; 4px at 16), centred on the text
 * line it sits in. Banks with no mark on file get a neutral initials tile. Decorative: the bank's
 * name is always written next to it.
 */
export function BankLogo({ bank, size = 20, className }: { bank: string; size?: BankLogoSize; className?: string }) {
  const b = bankOf(bank);
  return (
    <span className={cx("c-bank", `c-bank--${size}`, !b && "c-bank--none", className)} aria-hidden="true">
      {b ? <img src={b.src} alt="" width={size} height={size} decoding="async" /> : bankInitials(bank)}
    </span>
  );
}

/**
 * A line of text with the logo of the first bank it names placed right before that name
 * ("Ade Stores payment matched to [GTB] GTB"). Text that names no bank comes back unchanged.
 */
export function WithBank({ text, size = 16 }: { text: string; size?: BankLogoSize }) {
  const s = bankSplit(text);
  if (!s) return <>{text}</>;
  const before = s.before.trimEnd();
  return (
    <>
      {before}
      <span className={cx("c-bankt", before && "c-bankt--mid")}>
        <BankLogo bank={s.bank.name} size={size} />
        {s.word}
      </span>
      {s.after}
    </>
  );
}
