import { getImageProps } from "next/image";
import { photoManifest, type PhotoKey } from "@/features/marketing/assets/photos/photos.generated";
import { photoLoader, photoSrc } from "@/lib/image-loader";

export type PhotoSpec = { src: PhotoKey; alt: string };

/** next/image quality for photos (owner rule: keep photos visibly lossless). */
const PHOTO_QUALITY = 85;

type PhotoProps = {
  photo: PhotoSpec;
  /** Above the fold: load eagerly with high priority (page heroes only). */
  priority?: boolean;
  sizes?: string;
};

/**
 * A content photo: <picture> with AVIF and WebP sources from the pre-generated variants
 * (scripts/optimize-images.mjs), responsive widths up to 2x, a blur placeholder and lazy loading
 * below the fold. Works the same on Vercel and in the static export.
 */
export function Photo({ photo, priority, sizes = "(min-width: 900px) 50vw, 100vw" }: PhotoProps) {
  const meta = photoManifest[photo.src];
  const common = {
    src: photoSrc(photo.src),
    alt: photo.alt,
    width: meta.width,
    height: meta.height,
    sizes,
    quality: PHOTO_QUALITY,
    priority,
    placeholder: meta.blurDataURL,
  } as const;
  const avif = getImageProps({ ...common, loader: photoLoader("avif") }).props.srcSet;
  const { props } = getImageProps({ ...common, loader: photoLoader("webp") });
  return (
    <picture>
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is in props */}
      <img {...props} />
    </picture>
  );
}

/** Open Graph image for a photo: the 1200px JPEG variant. */
export function photoOgImage(key: PhotoKey): { url: string; width: number; height: number } {
  const m = photoManifest[key];
  const width = Math.min(1200, m.width);
  return { url: m.og, width, height: Math.round((m.height * width) / m.width) };
}
