import type { ReactNode } from "react";
import { Photo, type PhotoSpec } from "@/components/ui/Photo";
import { Section, Wrap } from "@/components/ui/Section";
import { Stickers, type StickerSpec } from "@/components/ui/Sticker";

type MediaSplitProps = {
  tone?: "plain" | "cream" | "dark";
  id?: string;
  photo: PhotoSpec;
  /** Stickers on the photo. */
  photoStickers?: readonly StickerSpec[];
  /** Stickers on the band itself. */
  stickers?: readonly StickerSpec[];
  children: ReactNode;
};

/** Photo beside text (`.x-wit__img` / `.x-wit__txt`), on a clipped band. */
export function MediaSplit({
  tone = "dark",
  id,
  photo,
  photoStickers = [],
  stickers = [],
  children,
}: MediaSplitProps) {
  return (
    <Section tone={tone} clip id={id}>
      <Wrap grid>
        <Stickers items={stickers} />
        <div className="x-wit__img x-rv x-ph">
          <Photo photo={photo} />
          <Stickers items={photoStickers} lead trail={false} />
        </div>
        <div className="x-wit__txt x-rv">{children}</div>
      </Wrap>
    </Section>
  );
}
