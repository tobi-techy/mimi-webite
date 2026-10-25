import Link from "next/link";
import { Fragment } from "react";
import { HeroVideo } from "@/features/marketing/motion/HeroVideo";
import { ButtonLink, ButtonRow } from "@/components/ui/Button";
import { Label, Lead } from "@/components/ui/Text";
import { W } from "@/components/ui/Words";
import { heroChannels, heroStickers } from "@/features/marketing/content/home";

/** Home hero: headline with the scribbled "One book.", a draggable sticker cluster and the route video. */
export function HomeHero() {
  return (
    <section className="x-khero" id="khero">
      <div className="x-khero__top">
        <div className="x-wrap x-grid x-khero__grid">
          <div className="x-khero__in">
            <Label>AI agents for FMCG distribution</Label>
            <h1 className="x-hl">
              <W>The route, the shop, the money.</W>{" "}
              <span className="x-sq x-w">
                One book.
                <svg viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
                  <path pathLength="1" d="M4 15 C 36 5, 64 21, 104 13 S 170 4, 212 13 S 270 19, 296 8" />
                </svg>
              </span>
            </h1>
            <Lead reveal>
              Mimi is a team of AI agents on WhatsApp. It collects what shops owe, catches leaks on the route
              and shows brands what really sold. Shops use it free.
            </Lead>
            <ButtonRow reveal>
              <ButtonLink href="/contact" className="x-pill">
                Book a pilot
              </ButtonLink>{" "}
              <Link className="x-tlink" href="/console">
                Try the live demo →
              </Link>
            </ButtonRow>
            <div className="x-strip x-mono">
              {heroChannels.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <p className="x-hint x-mono" aria-hidden="true">
              Tap anywhere on the site to slap a sticker <b>↘</b>
            </p>
          </div>
          <div className="x-cluster" aria-hidden="true">
            {heroStickers.map((s, i) => (
              <Fragment key={s.src}>
                {i > 0 && " "}
                <span
                  className="x-k"
                  style={{
                    "--x": s.x,
                    "--y": s.y,
                    "--w": String(s.w),
                    "--r": s.r,
                    "--z": String(s.z),
                    "--i": String(i),
                    "--d": s.d,
                    "--dl": s.dl,
                  }}
                >
                  <span className="x-k__drag">
                    <span className="x-k__pop">
                      <span className="x-k__bob">
                        <img src={`/stickers/${s.src}.webp`} alt="" draggable="false" />
                      </span>
                    </span>
                  </span>
                </span>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      <div className="x-khero__vid">
        <HeroVideo />
      </div>
    </section>
  );
}
