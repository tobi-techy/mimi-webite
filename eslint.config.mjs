import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier,
  {
    rules: {
      // Marketing copy is full of apostrophes and quotes; escaping them would hurt readability.
      "react/no-unescaped-entities": "off",
      // Logos, the mascot and die-cut stickers are decorative, CSS-sized and cloned by the sticker
      // slap effect, so they stay plain <img>. Photos use next/image.
      "@next/next/no-img-element": "off",
    },
  },
  {
    ignores: [".next/**", "out/**", "out-console/**", ".console-build/**", "node_modules/**", "next-env.d.ts"],
  },
];

export default config;
