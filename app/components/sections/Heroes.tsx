import type { CSSProperties, ReactNode } from "react";

import { ChatPanel } from "../ChatPanel";
import { PillLink } from "../Pill";
import { Eyebrow } from "../Section";
import { Sticker } from "../Sticker";
import { StickerCluster, type StickerPlacement } from "../StickerCluster";

const HERO_H1 =
  "mt-[18px] text-[clamp(38px,6.4vw,84px)] font-medium leading-none tracking-[-0.045em]";
const HERO_SUB = "mx-auto mt-4 max-w-[54ch] text-[17px] text-muted";

function delay(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}

/** Home hero: the WhatsApp-style panel behind the headline. */
export function HomeHero() {
  return (
    <section className="pt-[clamp(40px,6vw,86px)] text-center" aria-labelledby="hero-title">
      <p
        data-load
        style={delay(150)}
        className="inline-flex items-center gap-2 text-xs tracking-[0.02em] text-muted"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
        Your shop helper on WhatsApp
      </p>
      <h1 id="hero-title" data-load style={delay(200)} className={HERO_H1}>
        Mimi keeps your book.
        <br />
        You keep selling.
      </h1>
      <p data-load style={delay(280)} className={HERO_SUB}>
        Snap your stock book, forward any payment alert, and know what to restock before it finishes. All in the chat
        you already use.
      </p>
      <div data-load style={delay(350)} className="mt-7 flex flex-wrap justify-center gap-2.5">
        <PillLink href="/#get-started" variant="ink">
          Join the pilot
        </PillLink>
        <PillLink href="/#how-it-works" variant="ghost">
          See how it works <span aria-hidden="true">→</span>
        </PillLink>
      </div>

      <div className="relative mt-[clamp(34px,5vw,64px)]">
        <Sticker name="indomie" rotation={-11} className="hero-stk hero-stk-a" />
        <Sticker name="naira" rotation={9} className="hero-stk hero-stk-b" />
        <Sticker name="receipt" rotation={7} className="hero-stk hero-stk-c" />
        <Sticker name="calculator" rotation={-8} className="hero-stk hero-stk-d" />
        <ChatPanel />
      </div>
    </section>
  );
}

type PageHeroProps = {
  eyebrow: string;
  title: string;
  titleId: string;
  sub: string;
  ctas: ReactNode;
  stickers: StickerPlacement[];
};

/** The shops and distributors heroes: copy beside a pile of stickers. */
export function PageHero({ eyebrow, title, titleId, sub, ctas, stickers }: PageHeroProps) {
  return (
    <section
      className="grid items-center gap-[clamp(20px,3vw,40px)] pt-[clamp(40px,6vw,86px)] min-[1000px]:grid-cols-2"
      aria-labelledby={titleId}
    >
      <div data-load>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 id={titleId} className={HERO_H1}>
          {title}
        </h1>
        <p className="mt-4 max-w-[54ch] text-[17px] text-muted">{sub}</p>
        <div className="mt-7 flex flex-wrap gap-2.5">{ctas}</div>
      </div>
      <StickerCluster className="pile m-0 h-[clamp(360px,40vw,520px)] max-[760px]:h-[340px]" items={stickers} />
    </section>
  );
}
