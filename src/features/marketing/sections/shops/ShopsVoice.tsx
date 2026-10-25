import { Split } from "@/components/ui/Split";
import { Heading, Label } from "@/components/ui/Text";

/** Languages: talk how you talk. */
export function ShopsVoice() {
  return (
    <Split
      tone="cream"
      reveal
      stickers={[
        { src: "sticker-phone", pos: "at", x: "30%", y: "34%", w: 120, r: "-10deg", lazy: true },
        { src: "sticker-goods", pos: "at", x: "62%", y: "46%", w: 160, r: "8deg", lazy: true },
        { src: "sticker-sachet", pos: "at", x: "44%", y: "80%", w: 110, r: "12deg", lazy: true },
      ]}
    >
      <Label>English, Yoruba, Hausa or Igbo. Text or voice note.</Label>
      <Heading size="d2" reveal style={{ marginTop: "20px", maxWidth: "14em" }}>
        Talk how you talk. Mimi understands.
      </Heading>
    </Split>
  );
}
