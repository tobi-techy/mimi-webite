import type { ImageLoaderProps } from "next/image";
import { photoManifest, type PhotoKey } from "@/features/marketing/assets/photos/photos.generated";

type PhotoFormat = "avif" | "webp";

const PHOTO_DIR = "/media/photos/";

/** "/media/photos/photo2-shop" -> generated widths, smallest first. */
function widthsFor(src: string): readonly number[] {
  const key = src.slice(PHOTO_DIR.length) as PhotoKey;
  return photoManifest[key]?.widths ?? [];
}

/** Picks the smallest pre-generated variant at least as wide as requested (else the largest). */
export function photoLoader(format: PhotoFormat) {
  return ({ src, width }: ImageLoaderProps): string => {
    const widths = widthsFor(src);
    const w = widths.find((x) => x >= width) ?? widths.at(-1) ?? width;
    return `${src}-${w}.${format}`;
  };
}

/** Default loader for next/image (next.config.ts images.loaderFile): WebP variants. */
export default function defaultLoader(props: ImageLoaderProps): string {
  return photoLoader("webp")(props);
}

export const photoSrc = (key: PhotoKey): string => `${PHOTO_DIR}${key}`;
