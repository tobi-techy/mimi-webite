import { Split } from "@/components/ui/Split";
import { Heading, Label, Lead } from "@/components/ui/Text";

export function SecurityApprovals() {
  return (
    <Split
      id="sec-approvals"
      reveal
      stickers={[
        { src: "sticker-receipt", pos: "at", x: "34%", y: "34%", w: 140, r: "8deg", lazy: true },
        { src: "sticker-pos", pos: "at", x: "66%", y: "66%", w: 150, r: "-8deg", lazy: true },
      ]}
    >
      <Label>02 / Approvals</Label>
      <Heading size="d2" reveal style={{ marginTop: "20px", maxWidth: "14em" }}>
        Nothing goes out without you.
      </Heading>
      <Lead style={{ marginTop: "20px" }}>
        Emails to brands and banks, credit changes and reminders stay as drafts until the owner approves them
        in Approvals.
      </Lead>
      <Lead style={{ marginTop: "16px" }}>Distributors set every credit limit. Mimi only suggests.</Lead>
    </Split>
  );
}
