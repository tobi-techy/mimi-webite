import { ButtonLink } from "@/components/ui/Button";
import { CtaBand } from "@/components/ui/CtaBand";

export function PostCta() {
  return (
    <CtaBand
      label="Start small"
      title="Running routes? Book a free pilot."
      reveal={false}
      actions={
        <ButtonLink href="/contact" arrow>
          Book a free pilot
        </ButtonLink>
      }
    />
  );
}
