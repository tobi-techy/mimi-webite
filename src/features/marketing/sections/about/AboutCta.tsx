import { ButtonLink } from "@/components/ui/Button";
import { CtaBand } from "@/components/ui/CtaBand";

export function AboutCta() {
  return (
    <CtaBand
      label="04 / Start small"
      title="Try Mimi on one route."
      actions={
        <ButtonLink href="/contact" arrow>
          Book a pilot
        </ButtonLink>
      }
    />
  );
}
