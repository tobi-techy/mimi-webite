import { Split } from "@/components/ui/Split";
import { founderQuote } from "@/features/marketing/content/home";

/** Founder quote. */
export function HomeQuote() {
  return (
    <Split
      tone="cream"
      className="x-quote"
      textAs="blockquote"
      reveal
      stickers={[
        { src: "sticker-notebook", pos: "at", x: "34%", y: "30%", w: 150, r: "-10deg", lazy: true },
        { src: "sticker-pos", pos: "at", x: "70%", y: "52%", w: 130, r: "9deg", lazy: true },
        { src: "sticker-phone", pos: "at", x: "38%", y: "78%", w: 100, r: "14deg", lazy: true },
      ]}
    >
      <p>{founderQuote.text}</p>
      <footer>
        <span className="x-label">—</span>
        <span>
          <b>{founderQuote.name}</b> <span className="x-label">{founderQuote.role}</span>
        </span>
      </footer>
    </Split>
  );
}
