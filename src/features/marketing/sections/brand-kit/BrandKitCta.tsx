import { ButtonLink } from "@/components/ui/Button";
import { CtaBand } from "@/components/ui/CtaBand";
import { mailto } from "@/config/site";
import { brandKitZip } from "@/features/marketing/content/brand-kit";

export function BrandKitCta() {
  return (
    <CtaBand
      label="09 / Press"
      title="Writing about Mimi?"
      lead="Ask for interviews, product screenshots or anything not in the kit."
      actions={
        <>
          <ButtonLink href={mailto("Mimi press")} arrow>
            Email us
          </ButtonLink>{" "}
          <a className="x-btn x-btn--ghost" href={brandKitZip.href} download>
            Download brand kit
          </a>
        </>
      }
    />
  );
}
