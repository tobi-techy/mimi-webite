import { ButtonLink, ButtonRow } from "@/components/ui/Button";
import { CtaBand } from "@/components/ui/CtaBand";
import { mailto } from "@/config/site";

export function BrandsCta() {
  return (
    <CtaBand
      label="Start small"
      title="Sponsor a pilot."
      size="d1"
      lead="One distributor, one route, real sell-through."
      side
      stickersInside
      stickers={[
        { src: "sticker-goods", pos: "tr", w: 150, r: "-8deg", ox: "20%", oy: "-56px", lazy: true },
        { src: "sticker-oil", pos: "br", w: 110, r: "10deg", ox: "34%", lazy: true },
      ]}
      actions={
        <ButtonRow>
          <ButtonLink href={mailto("Mimi brand pilot")} arrow>
            Sponsor a pilot
          </ButtonLink>{" "}
          <ButtonLink href={mailto()} variant="ghost">
            Talk to us
          </ButtonLink>
        </ButtonRow>
      }
    />
  );
}
