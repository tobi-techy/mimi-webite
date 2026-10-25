import { ShellLink } from "@/components/navigation/ShellLink";

/** Site-wide strip above the nav announcing the Rail Money to Mimi rename. */
export function RenameBanner() {
  return (
    <ShellLink className="x-rename" href="/new-name" aria-label="Rail Money is now Mimi. Read why.">
      <div className="x-rename__in">
        <span className="x-rename__dot" aria-hidden="true" />
        <span>
          Rail Money is now Mimi <b>&middot; meetmimi.ng coming soon</b>
        </span>
        <span className="x-rename__more">Read why →</span>
      </div>
    </ShellLink>
  );
}
