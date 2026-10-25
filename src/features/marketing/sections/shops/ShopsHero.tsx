import { ButtonLink, ButtonRow } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { shopsHero as hero } from "@/features/marketing/content/shops";

export function ShopsHero() {
  return (
    <PageHero
      label={hero.label}
      title={hero.title}
      lead={hero.lead}
      aside={<p className="x-ask">{hero.ask}</p>}
      photo={hero.photo}
      stickers={[
        { src: "sticker-sachet", pos: "at", x: "9%", y: "30%", mx: "10%", my: "8%", w: 150, r: "-10deg", depth: 0.7 },
        { src: "sticker-sugar", pos: "at", x: "91%", y: "24%", mx: "90%", my: "6%", w: 120, r: "9deg", depth: 0.9 },
        { src: "sticker-pos", pos: "at", x: "13%", y: "78%", mx: "8%", my: "86%", w: 120, r: "7deg", depth: 0.5 },
        { src: "sticker-notebook", pos: "at", x: "87%", y: "74%", mx: "92%", my: "84%", w: 160, r: "-8deg", depth: 0.6 },
      ]}
      actions={
        <ButtonRow reveal>
          <ButtonLink href="/shops#jobs" arrow variant="plain">
            What Mimi does
          </ButtonLink>
        </ButtonRow>
      }
    />
  );
}
