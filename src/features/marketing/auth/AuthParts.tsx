import Link from "next/link";
import type { ReactNode } from "react";
import { GoogleIcon } from "@/features/marketing/auth/GoogleIcon";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { Spaced } from "@/components/ui/Spaced";
import { Stickers } from "@/components/ui/Sticker";
import { W } from "@/components/ui/Words";
import { authArtStickers, authTagline } from "@/features/marketing/content/auth";
import { routes } from "@/config/routes";
import { cx } from "@/lib/cx";

/**
 * Building blocks of the signup and login prototypes. The step logic lives in
 * src/components/forms/auth (it finds these elements by id), so ids here are part of the contract.
 */

/** Page shell: logo bar, sticker art panel with a tagline, and the form column. */
export function AuthShell({
  switchPrompt,
  switchLink,
  line,
  lineId,
  artId,
  artExtra,
  children,
}: {
  switchPrompt: string;
  switchLink: { href: string; label: string };
  line: string;
  lineId?: string;
  artId?: string;
  /** Extra art-panel content (the hidden stamp sticker used when signup completes). */
  artExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="x-su">
      <header className="x-su__top">
        <Logo />{" "}
        <p className="x-su__login">
          <span>{switchPrompt}</span> <Link href={switchLink.href}>{switchLink.label}</Link>
        </p>
      </header>
      <div className="x-su__grid">
        <div className="x-su__art" id={artId} aria-hidden="true">
          <Stickers items={authArtStickers} />
          {artExtra}
          <div className="x-su__copy">
            <p className="x-status x-status--live">{authTagline}</p>
            <p className="x-su__line" id={lineId}>
              {line}
            </p>
          </div>
        </div>
        <div className="x-su__main">
          <div className="x-su__form">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** One step panel. Every step but the first starts hidden. */
export function AuthStep({
  id,
  hidden,
  done,
  children,
}: {
  id: string;
  hidden?: boolean;
  done?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cx("x-su__step", done && "x-su__done")} id={id} hidden={hidden}>
      {children}
    </section>
  );
}

/** Step heading (focus target when the step opens), with an optional sub line. */
export function StepTitle({
  as: Tag = "h2",
  id,
  sub,
  subId,
  children,
}: {
  as?: "h1" | "h2";
  id?: string;
  sub?: ReactNode;
  subId?: string;
  children: ReactNode;
}) {
  // a page-level h1 rises in word by word like every other page headline
  const h = (
    <Tag className={Tag === "h1" ? "x-su__h x-hl" : "x-su__h"} tabIndex={-1} id={id}>
      {Tag === "h1" && typeof children === "string" ? <W>{children}</W> : children}
    </Tag>
  );
  if (sub === undefined) return h;
  return (
    <div>
      {h}
      <p className="x-su__sub" id={subId}>
        {sub}
      </p>
    </div>
  );
}

/** Spinner + label pair that the flow swaps while a button is busy. */
function BusyLabel({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="x-su__spin" hidden></span>
      <span data-lbl="">{children}</span>
    </>
  );
}

export function GoogleButton({ id }: { id: string }) {
  return (
    <>
      {" "}
      <button className="x-btn x-btn--full" type="button" id={id}>
        {" "}
        <GoogleIcon /> <BusyLabel>Continue with Google</BusyLabel>{" "}
      </button>{" "}
    </>
  );
}

/** Full-width primary submit button; `busy` adds the spinner/label used for async steps. */
export function SubmitButton({
  id,
  disabled,
  busy,
  children,
}: {
  id?: string;
  disabled?: boolean;
  busy?: boolean;
  children: ReactNode;
}) {
  return (
    <button className="x-btn x-btn--o x-btn--full" type="submit" id={id} disabled={disabled}>
      {busy ? <BusyLabel>{children}</BusyLabel> : children}
    </button>
  );
}

/** Field wrapper with label and the error line the flow writes into. */
export function AuthField({
  label,
  htmlFor,
  errorId,
  errorText,
  spaced,
  children,
}: {
  label: string;
  htmlFor: string;
  errorId?: string;
  errorText?: string;
  /** Spaces between label, input and error (as in the multi-line email field markup). */
  spaced?: boolean;
  children: ReactNode;
}) {
  const gap = spaced ? " " : null;
  return (
    <div className="x-su__f">
      <label className="x-label" htmlFor={htmlFor}>
        {label}
      </label>
      {gap}
      {children}
      {gap}
      <p className="x-su__err" id={errorId} aria-live={errorId && !errorText ? "polite" : undefined}>
        {errorText}
      </p>
    </div>
  );
}

/** Work email step (shared by signup and login). */
export function EmailForm({ prefix, submitLabel }: { prefix: "su" | "li"; submitLabel: string }) {
  return (
    <form id={`${prefix}F1`} noValidate>
      <AuthField label="Work email" htmlFor={`${prefix}Email`} errorId={`${prefix}EmailErr`} spaced>
        <input
          id={`${prefix}Email`}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          aria-describedby={`${prefix}EmailErr`}
        />
      </AuthField>{" "}
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

/** Text input inside an AuthField; `required` holds the message shown when it is left empty. */
export function TextInput({
  id,
  name,
  autoComplete,
  required,
}: {
  id: string;
  name: string;
  autoComplete?: string;
  required: string;
}) {
  return <input id={id} name={name} autoComplete={autoComplete} data-req={required} />;
}

export function SelectInput({
  id,
  name,
  required,
  options,
}: {
  id: string;
  name: string;
  required: string;
  options: readonly string[];
}) {
  return (
    <div className="x-su__sel">
      <select id={id} name={name} data-req={required}>
        <option value="">Choose</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

/** Nigerian WhatsApp number: fixed +234 prefix and the 10 national digits. */
export function PhoneInput({ id }: { id: string }) {
  return (
    <div className="x-su__phone">
      <span>+234</span>
      <input
        id={id}
        name="whatsapp"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="803 123 4567"
        data-phone=""
      />
    </div>
  );
}

/** Pill choices in a fieldset; `required` is the message shown when nothing is picked. */
export function ChoiceGroup({
  legend,
  name,
  options,
  required,
  multiple,
}: {
  legend: string;
  name: string;
  options: readonly string[];
  required: string;
  multiple?: boolean;
}) {
  return (
    <fieldset className="x-su__f" data-group={required}>
      <legend className="x-label">{legend}</legend>
      <div className={cx("x-radios", multiple && "x-su__multi")}>
        <Spaced>
          {options.map((o) => (
            <label key={o}>
              <input type={multiple ? "checkbox" : "radio"} name={name} value={o} />
              <span>{o}</span>
            </label>
          ))}
        </Spaced>
      </div>
      <p className="x-su__err"></p>
    </fieldset>
  );
}

/** The 6-digit code step: boxes, resend timer and "change email" (shared by signup and login). */
export function CodeStep({
  prefix,
  submit,
}: {
  prefix: "su" | "li";
  /** The submit button (signup: plain Verify; login: busy "Log in"). */
  submit: ReactNode;
}) {
  return (
    <>
      <StepTitle
        sub={
          <>
            We sent a 6-digit code to <span id={`${prefix}SentTo`}></span>.
          </>
        }
      >
        Check your email
      </StepTitle>
      <form id={`${prefix}F2`} noValidate>
        <fieldset className="x-su__f" id={`${prefix}OtpSet`} aria-describedby={`${prefix}OtpErr`}>
          <legend className="x-label">6-digit code</legend>
          <div className="x-su__otp">
            <Spaced>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <input
                  key={n}
                  inputMode="numeric"
                  autoComplete={n === 1 ? "one-time-code" : "off"}
                  aria-label={`Digit ${n}`}
                />
              ))}
            </Spaced>
          </div>
          <p className="x-su__err" id={`${prefix}OtpErr`} aria-live="polite"></p>
        </fieldset>{" "}
        {submit}
      </form>
      <div className="x-su__row">
        <span className="x-mono" id={`${prefix}Wait`}>
          Resend code in 30s
        </span>{" "}
        <button className="x-su__txt" type="button" id={`${prefix}Resend`} hidden>
          Resend code
        </button>{" "}
        <span>
          Wrong email?{" "}
          <button className="x-su__txt" type="button" id={`${prefix}Change`}>
            Change it
          </button>
        </span>
      </div>
      <p className="x-su__err" id={`${prefix}ResendMsg`} aria-live="polite"></p>
    </>
  );
}

/** Buttons on the final step. */
export function DoneActions({ children }: { children: ReactNode }) {
  return <div className="x-su__btns">{children}</div>;
}

/** Finishes the auth prototype: continues to the console demo (no real session is created). */
export function ConsoleButton({ children }: { children: ReactNode }) {
  return (
    <ButtonLink href={routes.consoleUrl} arrow>
      {children}
    </ButtonLink>
  );
}
