import { ButtonLink } from "@/components/ui/Button";
import { CtaBand } from "@/components/ui/CtaBand";

export function DistributorsCta() {
  return (
    <CtaBand
      title="Try Mimi on one route"
      lead="Up to 20 shops, four weeks, no cost. If month one finds less than it costs, month one is free."
      stickersInside
      stickers={[
        { src: "sticker-stamp", pos: "tr", w: 150, r: "-10deg", ox: "22%", oy: "-56px", lazy: true },
        { src: "sticker-van", pos: "br", w: 140, r: "8deg", ox: "30%", lazy: true },
      ]}
      actions={
        <ButtonLink href="/contact" arrow>
          Book a free pilot
        </ButtonLink>
      }
    />
  );
}
