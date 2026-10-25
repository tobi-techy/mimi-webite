import { MimiLooking } from "@/components/ui/MimiLooking";
import { PilotFormEnhancer } from "@/features/marketing/forms/PilotFormEnhancer";
import { Field, RadioPills } from "@/components/ui/Form";
import { Section, Wrap } from "@/components/ui/Section";
import { Spaced } from "@/components/ui/Spaced";
import { Stickers } from "@/components/ui/Sticker";
import { Arrow, Heading, Label, Lead, Note } from "@/components/ui/Text";
import { pilotFormFields, pilotShopRanges } from "@/features/marketing/content/pricing";
import { site } from "@/config/site";

/** Pilot request form: opens the visitor's email app with the details filled in. */
export function PricingPilot() {
  return (
    <Section tone="dark" className="x-cta" id="pilot">
      <Wrap grid>
        <div className="x-pilot__head x-rv">
          <Label>Pilot</Label>
          <Heading size="d1" reveal style={{ marginTop: "20px" }}>
            Try Mimi on one route.
          </Heading>
          <Lead style={{ marginTop: "20px" }}>4 weeks, up to 20 shops, Growth features included. Free.</Lead>
          <Note style={{ marginTop: "20px" }}>Start small.</Note>
        </div>{" "}
        <Stickers
          items={[
            { src: "sticker-receipt", pos: "tr", w: 110, r: "10deg", ox: "12%", oy: "-50px", lazy: true },
            { src: "sticker-keke", pos: "bl", w: 140, r: "-8deg", ox: "10%", lazy: true },
          ]}
        />
        <form className="x-pilot x-rv" id="pilotForm">
          <Spaced>
            {pilotFormFields.map((f) => (
              <Field
                key={f.name}
                label={f.name}
                name={f.name}
                type={"type" in f ? f.type : undefined}
                autoComplete={"autoComplete" in f ? f.autoComplete : undefined}
              />
            ))}
            <RadioPills legend="Shops on route" name="Shops on route" options={pilotShopRanges} />
            <button className="x-btn x-btn--o" type="submit">
              Request a pilot
              <Arrow />
            </button>
            <p className="x-fine">Opens your email app, addressed to {site.contactEmail}.</p>
            <p className="x-pilot__sent" id="pilotSent" role="status" hidden>
              <MimiLooking size="xs" />
              Your details are in the email. Hit send and we&apos;ll reply on WhatsApp.
            </p>
          </Spaced>
        </form>
      </Wrap>
      <PilotFormEnhancer />
    </Section>
  );
}
