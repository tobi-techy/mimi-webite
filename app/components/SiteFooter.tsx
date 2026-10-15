import Image from "next/image";
import Link from "next/link";

import { NewsletterForm } from "./NewsletterForm";
import { Sticker } from "./Sticker";
import { FOOTER_COLUMNS } from "@/content/site";

const COL_LINK = "inline-flex min-h-8 items-center text-[15px] text-soft hover:text-ink hover:underline";

export function SiteFooter() {
  return (
    <footer className="mt-[clamp(56px,8vw,110px)] border-t border-hairline pt-[clamp(30px,4vw,50px)]">
      <div className="grid grid-cols-2 gap-x-[clamp(20px,4vw,70px)] gap-y-[30px] min-[1000px]:grid-cols-[minmax(0,1.1fr)_repeat(3,auto)]">
        <div className="col-span-2 min-[1000px]:col-span-1">
          <p className="max-w-[24ch] text-xl font-medium leading-[1.3] tracking-[-0.03em]">
            Mimi is your shop helper on WhatsApp.
          </p>
          <NewsletterForm />
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title} className="min-w-0">
            <h3 className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{column.title}</h3>
            <ul className="grid list-none gap-2 p-0">
              {column.links.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("mailto:") ? (
                    <a className={COL_LINK} href={link.href}>
                      {link.label}
                    </a>
                  ) : (
                    <Link className={COL_LINK} href={link.href}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative isolate z-[1] mt-[clamp(34px,6vw,80px)] pb-[clamp(18px,3vw,40px)]">
        <div className="wordmark">
          <div className="wordmark-clip">
            <Image
              className="wordmark-img"
              src="/brand/wordmark/mimi-wordmark-primary.svg"
              alt="Mimi"
              width={368}
              height={176}
            />
          </div>
          <Sticker name="mark" rotation={-10} className="stk-sign absolute left-[56%] top-[4%]" />
          <Sticker name="naira" rotation={12} delay={160} className="stk-sign absolute left-[14%] top-[30%]" />
        </div>
      </div>

      <div className="relative z-[2] flex flex-wrap items-center justify-between gap-3.5 border-t border-hairline bg-surface pt-[18px] pb-1.5 text-[13px] text-muted">
        <p className="m-0">
          © 2026 Rail Technology Concepts Ltd. RC 9322751. Ado-Ekiti, Ekiti State, Nigeria.
        </p>
        <p className="m-0 flex flex-wrap items-center gap-x-1.5">
          <Link className="inline-flex min-h-11 items-center hover:text-ink" href="/privacy">
            Privacy
          </Link>
          <span aria-hidden="true">·</span>
          <Link className="inline-flex min-h-11 items-center hover:text-ink" href="/terms">
            Terms
          </Link>
          <span aria-hidden="true">·</span>
          <span>Mimi dey here.</span>
        </p>
      </div>
    </footer>
  );
}
