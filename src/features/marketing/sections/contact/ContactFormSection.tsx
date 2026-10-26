import { ContactFormEnhancer } from "@/features/marketing/forms/ContactFormEnhancer";
import { ButtonLink } from "@/components/ui/Button";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { Guarantee, PointList } from "@/components/ui/Cards";
import { Field, SelectField } from "@/components/ui/Form";
import { Section, Wrap } from "@/components/ui/Section";
import { Arrow, Heading, Label, Lead } from "@/components/ui/Text";
import { contactRoles, contactShopCounts, pilotIncludes } from "@/features/marketing/content/contact";
import { site, whatsappLink } from "@/config/site";

/** Book a free pilot: what a pilot includes, and the request form. */
export function ContactFormSection() {
  return (
    <Section tone="dark" className="x-cta" id="contact-form">
      <Wrap grid>
        <div className="x-pilot__head x-rv">
          <Label>Pilot</Label>
          <Heading as="h1" size="d1" reveal style={{ marginTop: "20px" }}>
            Book a free pilot.
          </Heading>
          <Lead style={{ marginTop: "20px" }}>
            Tell us about your routes. We'll reply within two working days.
          </Lead>
          <PointList items={pilotIncludes} label="What a pilot includes" />
          {site.whatsapp && (
            <>
              {" "}
              <ButtonLink
                href={whatsappLink("Hi Mimi, I'd like to book a pilot.")}
                id="contactWa"
                external
                arrow
              >
                Message us on WhatsApp
              </ButtonLink>
            </>
          )}
          <div className="x-contact__socials">
            <Label>Follow Mimi</Label>
            <SocialLinks id="contactSocials" />
          </div>
        </div>
        <form className="x-pilot x-cform x-rv" id="contactForm" noValidate>
          <div className="x-cform__row">
            <Field label="Full name" name="name" autoComplete="name" />{" "}
            <Field label="Company" name="company" autoComplete="organization" />
          </div>
          <div className="x-cform__row">
            <SelectField label="Role" name="role" options={contactRoles} />{" "}
            <SelectField label="Number of shops you serve" name="shops" options={contactShopCounts} />
          </div>
          <div className="x-cform__row">
            <Field label="Work email" name="email" type="email" autoComplete="email" />{" "}
            <Field label="Phone/WhatsApp" name="phone" type="tel" autoComplete="tel" />
          </div>{" "}
          <Field label="City/area" name="city" autoComplete="address-level2" />{" "}
          <label>
            <span className="x-label">
              Message <span className="x-cform__opt">(optional)</span>
            </span>
            <textarea name="message" rows={4}></textarea>
          </label>{" "}
          <p className="x-fine" id="contactErr" role="alert" hidden>
            Please fill in every field except Message.
          </p>{" "}
          <button className="x-btn x-btn--o" type="submit">
            Send pilot request
            <Arrow />
          </button>{" "}
          <p className="x-fine">
            {site.formEndpoint
              ? `Goes straight to ${site.contactEmail}.`
              : `Opens your email app, addressed to ${site.contactEmail}.`}
          </p>
        </form>
        <Guarantee label="Request ready" className="x-cform__ok" id="contactOk" statusMessage>
          Thanks. Your email app should open with your details. Send it and we'll be in touch.
        </Guarantee>
      </Wrap>
      <ContactFormEnhancer />
    </Section>
  );
}
