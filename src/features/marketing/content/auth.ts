import type { StickerSpec } from "@/components/ui/Sticker";

/** Sticker art beside the signup and login forms (`mx`/`my` = mobile positions; `dsk` = desktop only). */
export const authArtStickers: StickerSpec[] = [
  { src: "sticker-crate", pos: "at", x: "22%", y: "20%", w: 200, r: "-8deg", mx: "16%", my: "34%" },
  { src: "sticker-cash", pos: "at", x: "58%", y: "16%", w: 180, r: "10deg", mx: "40%", my: "62%" },
  { src: "sticker-pos", pos: "at", x: "36%", y: "30%", w: 150, r: "6deg", className: "x-su__dsk" },
  { src: "sticker-keke", pos: "at", x: "42%", y: "48%", w: 240, r: "-4deg", mx: "64%", my: "34%" },
  { src: "sticker-goods", pos: "at", x: "82%", y: "36%", w: 170, r: "7deg", mx: "86%", my: "62%" },
  { src: "sticker-notebook", pos: "at", x: "16%", y: "52%", w: 150, r: "-12deg", className: "x-su__dsk" },
  { src: "sticker-receipt", pos: "at", x: "72%", y: "62%", w: 140, r: "12deg", className: "x-su__dsk" },
  { src: "sticker-phone", pos: "at", x: "86%", y: "84%", w: 130, r: "-10deg", className: "x-su__dsk" },
];

export const authTagline = "Mimi · For distributors and brands";

export const accountTypes = [
  { value: "distributor", name: "Distributor", body: "I supply shops on routes and collect payments." },
  { value: "brand", name: "Brand", body: "I make or own products sold through distributors." },
];

export const distributorRoles = ["Owner", "Director", "Finance", "Sales manager", "Other"];
export const states = [
  "Lagos",
  "Ogun",
  "Oyo",
  "Ekiti",
  "Osun",
  "Ondo",
  "Abuja FCT",
  "Rivers",
  "Kano",
  "Other",
];
export const shopCounts = ["Under 20", "20 to 50", "50 to 200", "200+"];

export const brandRoles = ["Founder", "Trade marketing", "Sales", "Finance", "Other"];
export const productCategories = ["Food", "Beverages", "Personal care", "Home care", "Pharma", "Other"];
export const distributorCounts = ["1 to 5", "6 to 20", "21 to 50", "50+"];
export const regions = [
  "South West",
  "South South",
  "South East",
  "North Central",
  "North West",
  "North East",
];

export const consents = [
  {
    name: "money",
    label: "Money",
    text: "Mimi never moves or holds money. Payments settle to our own account.",
    id: "suMoneyTxt",
  },
  {
    name: "data",
    label: "Data",
    text: "We only see a shop's data for our own products, and only with its consent.",
  },
  {
    name: "drafts",
    label: "Emails",
    text: "Emails to manufacturers, brands and banks stay drafts until we approve them.",
  },
];
