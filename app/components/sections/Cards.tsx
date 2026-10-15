import { PillLink } from "../Pill";
import { Eyebrow } from "../Section";
import { Sticker } from "../Sticker";
import { StickerCluster, type StickerPlacement } from "../StickerCluster";
import { Big, Lab, Tp } from "../Tile";

const CARD = "relative flex min-w-0 flex-col gap-3 rounded-sheet bg-tint2 p-[clamp(20px,2.4vw,30px)]";

export type Numbered = { n: string; title: string; body: string; sticker: StickerPlacement };

/** Home "How it works": three numbered cards with their own sticker. */
export function NumberedCards({ items }: { items: Numbered[] }) {
  return (
    <div className="mt-[clamp(30px,4vw,50px)] grid gap-[18px] min-[760px]:grid-cols-2 min-[1000px]:grid-cols-3">
      {items.map((item) => (
        <article key={item.n} data-reveal className={`${CARD} mt-[34px] px-6`}>
          <Sticker
            name={item.sticker.name}
            rotation={item.sticker.rotation}
            className="stk-xs absolute -top-11 right-3.5"
          />
          <p className="mb-[42px] font-mono text-[13px] leading-none text-muted">{item.n}</p>
          <h3 className="text-xl font-medium leading-[1.2] tracking-[-0.03em]">{item.title}</h3>
          <p className="mt-2.5 text-base text-muted">{item.body}</p>
        </article>
      ))}
    </div>
  );
}

export type Audience = { lab: string; pile: StickerPlacement[]; big: string; tp: string; href: string; cta: string };

/** Home "Who it's for": shops and distributors side by side. */
export function AudienceSplit({ items }: { items: Audience[] }) {
  return (
    <div className="mt-[clamp(30px,4vw,50px)] grid gap-[18px] min-[760px]:grid-cols-2">
      {items.map((item) => (
        <article key={item.lab} data-reveal className={CARD}>
          <Lab>{item.lab}</Lab>
          <StickerCluster className="pile pile-tall" items={item.pile} />
          <Big>{item.big}</Big>
          <Tp>{item.tp}</Tp>
          <PillLink href={item.href} variant="ghost" className="mt-2 self-start bg-paper">
            {item.cta} <span aria-hidden="true">→</span>
          </PillLink>
        </article>
      ))}
    </div>
  );
}

export type DayRow = { time: string; title: string; body: string; stickers: StickerPlacement[] };

/** Shops "A day with Mimi": alternating rows. */
export function DayRows({ items }: { items: DayRow[] }) {
  return (
    <div className="mt-[clamp(30px,4vw,50px)] grid gap-[18px]">
      {items.map((item, index) => (
        <article
          key={item.time}
          data-reveal
          className="grid items-center gap-[clamp(20px,4vw,60px)] rounded-sheet bg-tint2 p-[clamp(20px,3vw,40px)] min-[760px]:grid-cols-2"
        >
          <StickerCluster
            className={`pile m-0 h-[clamp(220px,22vw,280px)] ${index % 2 === 1 ? "min-[760px]:order-2" : ""}`}
            items={item.stickers}
          />
          <div>
            <p className="mb-3.5 font-mono text-[13px] uppercase leading-none tracking-[0.08em] text-muted">
              {item.time}
            </p>
            <Big>{item.title}</Big>
            <Tp className="mt-3 max-w-none text-[17px]">{item.body}</Tp>
          </div>
        </article>
      ))}
    </div>
  );
}

/** Home "Your book belongs to you": padlock beside a list of promises. */
export function TrustLines({ pile, lines }: { pile: StickerPlacement[]; lines: { title: string; body: string }[] }) {
  return (
    <div className="mt-[clamp(30px,4vw,50px)] grid items-center gap-[clamp(24px,4vw,60px)] min-[760px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <StickerCluster className="pile pile-tall m-0 rounded-sheet bg-tint2" items={pile} />
      <ul className="list-none p-0">
        {lines.map((line) => (
          <li key={line.title} className="border-t border-hairline py-5 last:border-b">
            <Big>{line.title}</Big>
            <p className="mt-2 text-base text-muted">{line.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type ThreeTile = { stickers: StickerPlacement[]; big: string };

/** Distributors "The problem": three tiles, sticker above the statement. */
export function ThreeTiles({ items }: { items: ThreeTile[] }) {
  return (
    <div className="three-tiles mt-[clamp(30px,4vw,50px)] grid gap-[18px] min-[760px]:grid-cols-2 min-[1000px]:grid-cols-3">
      {items.map((item) => (
        <article key={item.big} data-reveal className={CARD}>
          <StickerCluster className="pile" items={item.stickers} />
          <Big>{item.big}</Big>
        </article>
      ))}
    </div>
  );
}

export type FourStep = { n: string; body: string; stickers: StickerPlacement[] };

/** Distributors "How a pilot works": four steps. */
export function FourSteps({ items }: { items: FourStep[] }) {
  return (
    <div className="mt-[clamp(30px,4vw,50px)] grid gap-[18px] min-[760px]:grid-cols-2 min-[1000px]:grid-cols-4">
      {items.map((item) => (
        <article key={item.n} data-reveal className={CARD}>
          <p className="text-[clamp(40px,4vw,60px)] font-medium leading-none tracking-[-0.05em]">{item.n}</p>
          <StickerCluster className="pile pile-short" items={item.stickers} />
          <Tp className="max-w-none">{item.body}</Tp>
        </article>
      ))}
    </div>
  );
}

/** Shops "What you don't need": crossed-out lines beside a phone sticker. */
export function NopeList({ pile }: { pile: StickerPlacement[] }) {
  return (
    <div className="mt-[clamp(24px,3vw,40px)] grid items-center gap-[clamp(20px,4vw,60px)] min-[760px]:grid-cols-[minmax(0,1fr)_auto]">
      <ul className="list-none p-0 text-[clamp(40px,6.4vw,88px)] font-medium leading-[1.08] tracking-[-0.045em]">
        <li>
          No <s className="nope-strike">new app</s>.
        </li>
        <li>
          No <s className="nope-strike">laptop</s>.
        </li>
        <li>
          No <s className="nope-strike">training</s>.
        </li>
      </ul>
      <StickerCluster
        className="pile m-0 h-[clamp(200px,22vw,280px)] w-[clamp(200px,24vw,300px)] max-[760px]:h-[200px] max-[760px]:w-full"
        items={pile}
      />
    </div>
  );
}

/** Distributors "Shops choose what you see": the consent box. */
export function ConsentPanel({ pile, see, never }: { pile: StickerPlacement[]; see: string[]; never: string[] }) {
  return (
    <div className="mt-[clamp(30px,4vw,50px)] grid items-center gap-[clamp(20px,4vw,56px)] rounded-panel border border-hairline bg-paper p-[clamp(24px,4vw,56px)] min-[1000px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <StickerCluster className="pile m-0 h-[clamp(200px,22vw,280px)]" items={pile} />
      <div>
        <Eyebrow>Consent</Eyebrow>
        <h2 className="mt-3 text-[clamp(28px,3.4vw,52px)] font-medium leading-[1.02] tracking-[-0.035em]">
          Shops choose what you see.
        </h2>
        <div className="mt-[22px] grid gap-6 min-[760px]:grid-cols-2">
          {[
            { lab: "You see", items: see },
            { lab: "Never", items: never },
          ].map((group) => (
            <div key={group.lab}>
              <Lab>{group.lab}</Lab>
              <ul className="mt-3 grid list-none gap-2.5 p-0">
                {group.items.map((item) => (
                  <li key={item} className="border-t border-hairline pt-2.5 text-base text-soft">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
