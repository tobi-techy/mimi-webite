import { ButtonLink } from "@/components/ui/Button";
import { CtaBand } from "@/components/ui/CtaBand";

/** 06 / Start small: closing pilot call to action with the mascot. */
export function HomeCta() {
  return (
    <CtaBand
      label="06 / Start small"
      title="Try Mimi on one route."
      size="d1"
      lead="Four weeks, up to 20 shops, free."
      side
      stickers={[
        {
          src: "sticker-cash",
          pos: "tr",
          w: 170,
          r: "-10deg",
          ox: "18%",
          oy: "-60px",
          depth: 0.6,
          lazy: true,
        },
        { src: "sticker-van", pos: "bl", w: 150, r: "7deg", ox: "40%", lazy: true },
      ]}
      actions={
        <>
          <img className="x-sticker" src="/brand/mimi-mascot-orange.svg" alt="Mimi mascot sticker" />{" "}
          <ButtonLink href="/contact" arrow>
            Book a pilot
          </ButtonLink>
        </>
      }
    />
  );
}
