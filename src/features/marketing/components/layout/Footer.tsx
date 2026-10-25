import Link from "next/link";
import { SlapCounter } from "@/features/marketing/motion/SlapCounter";
import { Logo } from "@/components/ui/Logo";
import { Sticker } from "@/components/ui/Sticker";
import { footerNav } from "@/features/marketing/content/nav";
import { site } from "@/config/site";

export function Footer() {
  return (
    <footer className="x-foot x-dark">
      <div className="x-wrap">
        <Sticker src="sticker-crate" pos="tr" w={120} r="10deg" ox="6%" oy="-30px" lazy />{" "}
        <Sticker src="sticker-van" pos="bl" w={100} r="-9deg" ox="46%" oy="40px" lazy />{" "}
        <div className="x-grid x-foot__top">
          <div className="x-foot__brand">
            <Logo className="x-foot__logo" />{" "}
            <p>WhatsApp AI agents for FMCG distributors and brands, sharing one consented shop book.</p>
          </div>
          <div className="x-foot__col">
            <h3>Product</h3>
            <ul>
              {footerNav.product.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="x-foot__col">
            <h3>Company</h3>
            <ul>
              {footerNav.company.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
              <li>
                <span>{site.company}</span>
              </li>
              <li>
                <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
              </li>
              <li>
                <span>{site.location}</span>
              </li>
            </ul>
          </div>
          <div className="x-foot__col">
            <h3>Legal</h3>
            <ul>
              {footerNav.legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="x-foot__legal">
          <div>
            <p>
              Rail Money is not a bank. Payments are processed by our licensed payment partners and settle
              straight to the business's own account. Mimi does not lend or keep balances. Shop data is
              handled under the Nigeria Data Protection Act.
            </p>
            <p>
              © 2026 {site.legalName}. {site.registration}
            </p>
          </div>
          <div>
            <div className="x-foot__sig">
              <img src="/brand/mimi-mascot-blink.svg" alt="" aria-hidden="true" />
              <span>Never run out.</span>
            </div>
            <p className="x-foot__count x-mono">
              <SlapCounter /> slapped
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
