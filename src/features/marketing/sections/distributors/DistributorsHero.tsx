import { ButtonLink, ButtonRow } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { distributorsHero as hero } from "@/features/marketing/content/distributors";

export function DistributorsHero() {
  return (
    <PageHero
      label={hero.label}
      title={hero.title}
      lead={hero.lead}
      photo={hero.photo}
      stickers={[
        { src: "sticker-keke", pos: "at", x: "9%", y: "30%", mx: "10%", my: "8%", w: 150, r: "-10deg", depth: 0.7 },
        { src: "sticker-cash", pos: "at", x: "91%", y: "24%", mx: "90%", my: "6%", w: 120, r: "9deg", depth: 0.9 },
        { src: "sticker-receipt", pos: "at", x: "13%", y: "78%", mx: "8%", my: "86%", w: 120, r: "7deg", depth: 0.5 },
        { src: "sticker-van", pos: "at", x: "87%", y: "74%", mx: "92%", my: "84%", w: 160, r: "-8deg", depth: 0.6 },
      ]}
      actions={
        <ButtonRow reveal>
          <ButtonLink href="/contact" arrow>
            Book a free pilot
          </ButtonLink>{" "}
          <ButtonLink href="/pricing" variant="ghost">
            See pricing
          </ButtonLink>
        </ButtonRow>
      }
    />
  );
}
