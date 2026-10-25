import { ButtonLink, ButtonRow, TextLink } from "@/components/ui/Button";
import { MimiAlive } from "@/components/ui/mimi-alive";
import { Split } from "@/components/ui/Split";
import { Heading, Label, Lead } from "@/components/ui/Text";

/** 404: "This page fell off the van." */
export function NotFoundSection() {
  return (
    <Split
      className="x-404"
      aside={<MimiAlive mood="thinking" />}
      stickers={[
        { src: "sticker-van", pos: "at", x: "28%", y: "26%", w: 170, r: "-10deg" },
        { src: "sticker-crate", pos: "at", x: "72%", y: "30%", w: 130, r: "9deg" },
        { src: "sticker-goods", pos: "at", x: "40%", y: "76%", w: 140, r: "6deg" },
        { src: "sticker-pin", pos: "at", x: "80%", y: "78%", w: 110, r: "-12deg" },
      ]}
    >
      <Label>Error 404</Label>
      <Heading as="h1" size="d1" reveal>
        This page fell off the van.
      </Heading>
      <Lead reveal>The link may be old or mistyped. Everything else is where you left it.</Lead>
      <ButtonRow reveal>
        <ButtonLink href="/">Back home</ButtonLink>{" "}
        <ButtonLink href="/pricing" variant="ghost">
          See pricing
        </ButtonLink>{" "}
        <TextLink href="/contact">Book a pilot</TextLink>
      </ButtonRow>
    </Split>
  );
}
