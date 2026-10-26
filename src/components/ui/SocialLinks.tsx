import type { ReactNode } from "react";
import { site } from "@/config/site";
import { cx } from "@/lib/cx";

const icons: Record<string, ReactNode> = {
  x: (
    <path d="M9.5 6.8 15.3 0h-1.4L8.9 5.9 4.9 0H.3l6.1 8.9L.3 16h1.4l5.3-6.2 4.3 6.2h4.6L9.5 6.8Zm-1.9 2.2-.6-.9L2.1 1h2.1l4 5.7.6.9 5.2 7.4h-2.1L7.6 9Z" />
  ),
  linkedin: (
    <path d="M14.8 0H1.2C.5 0 0 .5 0 1.1v13.8c0 .6.5 1.1 1.2 1.1h13.6c.7 0 1.2-.5 1.2-1.1V1.1C16 .5 15.5 0 14.8 0ZM4.7 13.6H2.4V6h2.3v7.6ZM3.6 5a1.3 1.3 0 1 1 0-2.7 1.3 1.3 0 0 1 0 2.7Zm10 8.6h-2.4V9.9c0-.9 0-2-1.2-2s-1.4 1-1.4 2v3.7H6.2V6h2.3v1c.3-.6 1.1-1.2 2.3-1.2 2.4 0 2.8 1.6 2.8 3.6v4.2Z" />
  ),
};

/** Mimi's X and LinkedIn, from site.socials. Opens in a new tab. */
export function SocialLinks({ className, id }: { className?: string; id?: string }) {
  return (
    <ul className={cx("x-socials", className)} id={id} aria-label="Mimi on social media">
      {site.socials.map((s) => (
        <li key={s.key}>
          <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Mimi on ${s.label} (opens in a new tab)`}>
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false" fill="currentColor">
              {icons[s.key]}
            </svg>
            <span>{s.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
