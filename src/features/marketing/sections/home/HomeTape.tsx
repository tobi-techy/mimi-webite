import { Stickers } from "@/components/ui/Sticker";
import { tapeMessages } from "@/features/marketing/content/home";

/** Marquee of messages Mimi sends (CSS animation; the second copy makes the loop seamless). */
export function HomeTape() {
  return (
    <div className="x-tape">
      <Stickers
        items={[
          { src: "sticker-oil", pos: "at", x: "34%", y: "22%", w: 110, r: "-12deg", lazy: true },
          { src: "sticker-goods", pos: "at", x: "80%", y: "80%", w: 120, r: "10deg", lazy: true },
        ]}
      />
      <div className="x-marquee" aria-label="Messages Mimi sends">
        <div className="x-marquee__track">
          {[false, true].map((copy) => (
            <div key={String(copy)} className="x-marquee__set" aria-hidden={copy ? "true" : undefined}>
              {tapeMessages.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
