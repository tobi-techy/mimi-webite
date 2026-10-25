import type { ReactNode } from "react";
import { Photo, type PhotoSpec } from "@/components/ui/Photo";
import { Stickers, type StickerSpec } from "@/components/ui/Sticker";
import { Heading, Label, Lead } from "@/components/ui/Text";

type PageHeroProps = {
  label: string;
  title: string;
  lead: ReactNode;
  /** Extra line under the lead (shops: "Ask your distributor..."). */
  aside?: ReactNode;
  actions: ReactNode;
  photo: PhotoSpec;
  stickers: readonly StickerSpec[];
};

/**
 * Audience page hero: the home hero's layout (text block, then a full-width picture) with the
 * label, headline, lead and actions centred. Stickers are scattered around the text, not on the picture.
 */
export function PageHero({ label, title, lead, aside, actions, photo, stickers }: PageHeroProps) {
  return (
    <section className="x-khero x-khero--page">
      <div className="x-khero__top">
        <Stickers items={stickers} trail={false} />
        <div className="x-wrap">
          <div className="x-khero__in">
            <Label>{label}</Label>
            <Heading as="h1" size="d1" reveal>
              {title}
            </Heading>
            <Lead reveal>{lead}</Lead>
            {aside}
            {actions}
          </div>
        </div>
      </div>
      <div className="x-khero__vid x-khero__ph">
        <Photo photo={photo} priority sizes="100vw" />
      </div>
    </section>
  );
}
