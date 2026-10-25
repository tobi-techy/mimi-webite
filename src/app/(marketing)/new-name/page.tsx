import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { ButtonLink } from "@/components/ui/Button";
import { NumberedCards, stagger } from "@/components/ui/Cards";
import { CtaBand } from "@/components/ui/CtaBand";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Split } from "@/components/ui/Split";
import { Heading, Label, Lead } from "@/components/ui/Text";
import { site } from "@/config/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Rail Money is now Mimi",
  description:
    "Rail Money is now Mimi: the same team and company, now building a WhatsApp assistant for Nigerian shops and the distributors that supply them.",
  path: "/new-name",
});

const same = [
  { label: "Company", title: "Rail Technology Concepts Ltd", body: "RC 9322751. Mimi is built by the same company, in Nigeria." },
  { label: "Price", title: "Free for shops", body: "Distributors and brands pay. No new app to learn. Just WhatsApp." },
  { label: "Contact", title: site.contactEmail, body: "Questions about Rail Money or Mimi still reach us here." },
];

export default function NewNamePage() {
  return (
    <RouteView route="new-name">
      <Split
        style={{ paddingBottom: "clamp(48px,6vw,80px)" }}
        stickers={[
          { src: "sticker-notebook", pos: "at", x: "32%", y: "30%", w: 160, r: "-8deg" },
          { src: "sticker-phone", pos: "at", x: "70%", y: "46%", w: 130, r: "10deg" },
          { src: "sticker-receipt", pos: "at", x: "42%", y: "78%", w: 140, r: "-4deg" },
        ]}
      >
        <Label>Rail Money is now Mimi</Label>
        <Heading as="h1" size="d1" reveal style={{ marginTop: "24px", maxWidth: "14em" }}>
          Same team. New name. Sharper focus.
        </Heading>
        <Lead style={{ marginTop: "24px" }}>
          Rail Money started as an AI money app for people. Today we build Mimi, a WhatsApp assistant for Nigerian
          shops and the distributors that supply them.
        </Lead>
      </Split>

      <Section tone="cream" id="why">
        <Wrap>
          <SectionHeader label="01 / Why we changed the name" title="We followed the shops." />
          <div className="x-rv" style={{ display: "grid", gap: "20px" }}>
            <Lead>
              We spent our time with shop owners and distributors. Their biggest problem wasn&apos;t saving money. It
              was the notebook: stock that doesn&apos;t add up, credit nobody can track, and fake transfer alerts that
              walk goods out of the shop.
            </Lead>
            <Lead>
              Rail Money sounded like a bank. We don&apos;t hold or move anyone&apos;s money. Mimi sounds like what it
              is: a helper you text on WhatsApp.
            </Lead>
          </div>
        </Wrap>
      </Section>

      <Section id="what" style={{ paddingBlock: "clamp(56px,6vw,88px)" }}>
        <Wrap>
          <SectionHeader label="02 / What Mimi does" title="Snap the stock book. Mimi does the rest." />
          <NumberedCards
            kind="outc"
            items={[
              {
                title: "Reads the book",
                body: "Send a photo of the stock book, an invoice or a delivery note, or just a voice note. Mimi turns it into clean records.",
              },
              { title: "Catches fake alerts", body: "Mimi checks payment screenshots before the goods leave the shop." },
              {
                title: "Shows what sold",
                body: "With the shop's consent, distributors and brands see what is moving and which shops need restock.",
              },
            ]}
          />
        </Wrap>
      </Section>

      <Section tone="cream" id="same">
        <Wrap>
          <SectionHeader label="03 / What stays the same" title="Same company. Same people." />
          <div className="x-outc x-rv x-stag">
            {same.map((it, i) => (
              <div key={it.label} style={stagger(i)}>
                <span className="x-label">{it.label}</span>
                <h3>{it.title}</h3>
                <p>{it.body}</p>
              </div>
            ))}
          </div>
        </Wrap>
      </Section>

      <CtaBand
        label="04 / What's next"
        title="meetmimi.ng is coming. Until then, Mimi lives here."
        actions={
          <>
            <ButtonLink href="/contact" arrow>
              Book a pilot
            </ButtonLink>{" "}
            <ButtonLink href="/shops" variant="ghost">
              For shops
            </ButtonLink>
          </>
        }
      />
    </RouteView>
  );
}
