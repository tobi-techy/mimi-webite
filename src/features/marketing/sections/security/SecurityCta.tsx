import { ButtonLink } from "@/components/ui/Button";
import { CtaBand } from "@/components/ui/CtaBand";
import { mailto } from "@/config/site";

export function SecurityCta() {
  return (
    <CtaBand
      label="04 / Questions"
      title="Questions about your data?"
      lead="We answer every privacy and security question."
      actions={
        <>
          <ButtonLink href={mailto("Mimi data question")} arrow>
            Email us
          </ButtonLink>{" "}
          <ButtonLink href="/privacy" variant="ghost">
            Privacy policy
          </ButtonLink>
        </>
      }
    />
  );
}
