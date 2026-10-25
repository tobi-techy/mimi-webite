import type { NextConfig } from "next";

/**
 * `npm run build` produces a normal Next.js build (Vercel, `next start`).
 * `npm run build:export` sets STATIC_EXPORT=1 and writes a fully static site to `out/`.
 *
 * Photos are pre-generated as AVIF/WebP variants (scripts/optimize-images.mjs) and served through
 * a custom loader, so both builds ship the same optimised files and need no image server.
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";

/** Must match PHOTO_WIDTHS in scripts/optimize-images.mjs. */
const PHOTO_WIDTHS = [480, 768, 1024, 1376, 1600, 1920, 2560];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /* The dev-only route indicator sits over the console sidebar footer. */
  devIndicators: false,
  /* app/global-not-found.tsx: the 404 brings its own document, so its marketing CSS is not
     attached to every route (the console would otherwise load the site stylesheet too). */
  experimental: { globalNotFound: true },
  ...(isStaticExport ? { output: "export" as const } : {}),
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: PHOTO_WIDTHS,
    imageSizes: [],
    qualities: [85],
  },
};

export default nextConfig;
