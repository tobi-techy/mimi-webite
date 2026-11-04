/** The demo workspace every console screen is about. All data in this folder is sample data. */
export const workspace = {
  name: "Coral Lane Trading",
  kind: "Distributor · 14 seats",
  initials: "WG",
  user: { name: "Tobi Omotade", email: "omotadetobiloba@gmail.com", initials: "TO" },
  /* the sample list has 12 shops (content/shops.ts): every count says the same */
  shopCount: 12,
} as const;
