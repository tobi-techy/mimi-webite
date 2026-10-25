import Link from "next/link";
import {
  AuthField,
  AuthShell,
  AuthStep,
  ChoiceGroup,
  CodeStep,
  ConsoleButton,
  DoneActions,
  EmailForm,
  GoogleButton,
  PhoneInput,
  SelectInput,
  StepTitle,
  SubmitButton,
  TextInput,
} from "@/features/marketing/auth/AuthParts";
import { ButtonLink } from "@/components/ui/Button";
import { Spaced } from "@/components/ui/Spaced";
import { Heading } from "@/components/ui/Text";
import {
  accountTypes,
  brandRoles,
  consents,
  distributorCounts,
  distributorRoles,
  productCategories,
  regions,
  shopCounts,
  states,
} from "@/features/marketing/content/auth";

/** Shared company/name/role/phone fields of step 4 (distributor "d", brand "b"). */
function BusinessBasics({ p, roles }: { p: "d" | "b"; roles: readonly string[] }) {
  return (
    <>
      <AuthField label="Company name" htmlFor={`${p}-co`}>
        <TextInput
          id={`${p}-co`}
          name="company"
          autoComplete="organization"
          required="Enter your company name."
        />
      </AuthField>
      <AuthField label="Your name" htmlFor={`${p}-nm`}>
        <TextInput id={`${p}-nm`} name="name" autoComplete="name" required="Enter your name." />
      </AuthField>
      <AuthField label="Your role" htmlFor={`${p}-rl`}>
        <SelectInput id={`${p}-rl`} name="role" required="Choose your role." options={roles} />
      </AuthField>
      <AuthField label="WhatsApp number" htmlFor={`${p}-ph`}>
        <PhoneInput id={`${p}-ph`} />
      </AuthField>
    </>
  );
}

/** Sign up: account, code, type, business details, consent, done. Wired up by SignupFlow. */
export function SignupView() {
  return (
    <AuthShell
      switchPrompt="Already have an account?"
      switchLink={{ href: "/login", label: "Log in" }}
      line="One book for the route, the shop and the money."
      lineId="suLine"
      artId="suArt"
      artExtra={
        <>
          <img id="suStamp" src="/stickers/sticker-stamp.webp" alt="" style={{ display: "none" }} />{" "}
        </>
      }
    >
      <Heading as="h1" className="x-su__vh" reveal>
        Sign up for Mimi
      </Heading>
      <div className="x-su__prog">
        <button className="x-btn x-btn--ghost is-off" type="button" id="suBack">
          <span aria-hidden="true">←</span> Back
        </button>{" "}
        <p className="x-mono" id="suStepTxt" aria-live="polite">
          Step 1 of 5
        </p>
      </div>
      <div
        className="x-su__bar"
        id="suBar"
        role="progressbar"
        aria-label="Signup progress"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={1}
      >
        <i className="is-on"></i>
        <i></i>
        <i></i>
        <i></i>
        <i></i>
      </div>

      <AuthStep id="su1">
        <StepTitle sub="For distributors and brands. Shops join free through their distributor's link.">
          Create your Mimi account
        </StepTitle>
        <GoogleButton id="suGoogle" />
        <p className="x-su__or x-mono">Or use your work email</p>
        <EmailForm prefix="su" submitLabel="Continue" />
        <p className="x-su__fine">
          By continuing you agree to the <Link href="/terms">Terms</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </AuthStep>

      <AuthStep id="su2" hidden>
        <CodeStep prefix="su" submit={<SubmitButton>Verify</SubmitButton>} />
      </AuthStep>

      <AuthStep id="su3" hidden>
        <StepTitle>What best describes you?</StepTitle>
        <form id="suF3" noValidate>
          <fieldset className="x-su__f">
            <legend className="x-su__vh">Account type</legend>
            <div className="x-su__opts">
              <Spaced>
                {accountTypes.map((t) => (
                  <label key={t.value} className="x-su__opt">
                    <input type="radio" name="suType" value={t.value} />
                    <span className="x-mono">{t.name}</span>
                    <span>{t.body}</span>
                  </label>
                ))}
              </Spaced>
            </div>
          </fieldset>{" "}
          <SubmitButton id="suCont3" disabled>
            Continue
          </SubmitButton>
        </form>
      </AuthStep>

      <AuthStep id="su4d" hidden>
        <StepTitle>Tell us about your business</StepTitle>
        <form id="suF4d" noValidate>
          <BusinessBasics p="d" roles={distributorRoles} />
          <AuthField label="State" htmlFor="d-st">
            <SelectInput id="d-st" name="state" required="Choose your state." options={states} />
          </AuthField>
          <ChoiceGroup
            legend="Shops you supply"
            name="shops"
            options={shopCounts}
            required="Choose how many shops you supply."
          />
          <AuthField
            label="Brands you distribute"
            htmlFor="d-br"
            errorId="suTagHint"
            errorText="Press Enter or comma to add each brand."
          >
            <div className="x-su__tags" id="suTags">
              <input
                id="d-br"
                placeholder="Indomie, Peak, Golden Penny"
                autoComplete="off"
                aria-describedby="suTagHint"
              />
            </div>
          </AuthField>{" "}
          <SubmitButton>Continue</SubmitButton>
        </form>
      </AuthStep>

      <AuthStep id="su4b" hidden>
        <StepTitle>Tell us about your brand</StepTitle>
        <form id="suF4b" noValidate>
          <BusinessBasics p="b" roles={brandRoles} />
          <AuthField label="Product category" htmlFor="b-ct">
            <SelectInput
              id="b-ct"
              name="category"
              required="Choose a product category."
              options={productCategories}
            />
          </AuthField>
          <ChoiceGroup
            legend="Distributors you work with"
            name="distributors"
            options={distributorCounts}
            required="Choose how many distributors you work with."
          />
          <ChoiceGroup
            legend="Regions"
            name="regions"
            options={regions}
            required="Choose at least one region."
            multiple
          />{" "}
          <SubmitButton>Continue</SubmitButton>
        </form>
      </AuthStep>

      <AuthStep id="su5" hidden>
        <StepTitle>Your shops stay in control</StepTitle>
        <form id="suF5" noValidate>
          <fieldset className="x-su__f" id="suTrust" data-group="Tick all three to continue.">
            <legend className="x-su__vh">Agreements</legend>
            <div className="x-su__trust">
              <Spaced>
                {consents.map((c) => (
                  <label key={c.name} className="x-su__chk">
                    <input type="checkbox" name={c.name} />
                    <span className="x-label">{c.label}</span>
                    <span id={c.id}>{c.text}</span>
                  </label>
                ))}
              </Spaced>
            </div>
            <p className="x-su__err"></p>
          </fieldset>{" "}
          <label className="x-su__chk x-su__chk--opt">
            <input type="checkbox" name="updates" />
            <span>Send me product updates on WhatsApp</span>
          </label>{" "}
          <SubmitButton id="suCreate" busy>
            Create workspace
          </SubmitButton>
        </form>
      </AuthStep>

      <AuthStep id="suDone" hidden done>
        <p className="x-status x-status--live">Workspace ready</p>
        <StepTitle id="suDoneH" sub="" subId="suDoneSub">
          You're in.
        </StepTitle>
        <DoneActions>
          <ConsoleButton>Continue to your console</ConsoleButton>{" "}
          <ButtonLink href="/contact" variant="ghost">
            Book a demo
          </ButtonLink>
        </DoneActions>
      </AuthStep>
    </AuthShell>
  );
}
