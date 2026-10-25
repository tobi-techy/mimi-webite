import Link from "next/link";
import { Burger } from "@/features/marketing/components/nav/Burger";
import { NavFrame } from "@/features/marketing/components/nav/NavFrame";
import { NavLink } from "@/features/marketing/components/nav/NavLink";
import { primaryNav, secondaryNav, pilotHref } from "@/features/marketing/content/nav";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SoundToggle } from "@/components/sound/SoundToggle";

/** Site nav: server-rendered links inside the interactive NavFrame. */
export function Nav() {
  return (
    <NavFrame>
      <div className="x-wrap x-nav__in">
        <Logo />
        <nav className="x-nav__links" aria-label="Main">
          {primaryNav.map((l) => (
            <NavLink key={l.href} link={l} />
          ))}
        </nav>
        <div className="x-nav__end">
          <SoundToggle className="x-theme" />
          <ThemeToggle className="x-theme" />
          {secondaryNav.map((l) => (
            <NavLink key={l.href} link={l} />
          ))}
          <Link className="x-btn x-btn--o x-nav__cta" href={pilotHref}>
            Book a pilot
          </Link>
          <Burger />
        </div>
      </div>
      <div className="x-mmenu" id="mmenu">
        <div className="x-wrap">
          {primaryNav.map((l, i) => (
            <Link key={l.href} className="x-ml" href={l.href}>
              {l.label} <span className="x-label">{String(i + 1).padStart(2, "0")}</span>
            </Link>
          ))}
          {secondaryNav.map((l) => (
            <Link key={l.href} className="x-ml" href={l.href}>
              {l.label}
            </Link>
          ))}
          <Link className="x-btn x-btn--o" href={pilotHref}>
            Book a pilot
          </Link>
        </div>
      </div>
    </NavFrame>
  );
}
