import { Steps } from "@/components/ui/Cards";
import { MediaSplit } from "@/components/ui/MediaSplit";
import { Heading, Label } from "@/components/ui/Text";
import { paymentSteps, paymentsPhoto } from "@/features/marketing/content/distributors";

/** Payments: shops pay into the distributor's own account; Mimi confirms. */
export function DistributorsPayments() {
  return (
    <MediaSplit
      tone="cream"
      photo={paymentsPhoto}
      stickers={[{ src: "sticker-sachet", pos: "tr", w: 100, r: "10deg", ox: "10%", lazy: true }]}
      photoStickers={[
        {
          src: "sticker-pos",
          pos: "tl",
          w: 120,
          r: "-10deg",
          ox: "-18px",
          oy: "-34px",
          depth: 0.6,
          lazy: true,
        },
        {
          src: "sticker-cash",
          pos: "br",
          w: 140,
          r: "8deg",
          ox: "-22px",
          oy: "-36px",
          depth: 0.8,
          lazy: true,
        },
      ]}
    >
      <Label>Payments</Label>
      <Heading size="d2" reveal>
        Shops pay into your account. Mimi confirms it.
      </Heading>
      <Steps items={paymentSteps} />
    </MediaSplit>
  );
}
