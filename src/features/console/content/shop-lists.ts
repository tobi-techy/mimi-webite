/**
 * Shop lists (Tobi, 31 Oct 2026): a saved set of shops that one message goes out to. Each shop gets
 * it privately on WhatsApp, one by one and never as a group, and every reply comes back to the list.
 * Demo data only: Coral Lane's Ikere route and all its supermarkets. Group chats with shops are parked.
 */
export type ListReplyStatus = "ordered" | "replied" | "read" | "none";

export type ListShopReply = {
  shop: string;
  /** What the shop said back, in their words, or a plain receipt line ("Read 12:51"). */
  reply: string;
  /** True when `reply` is the shop's own words (shown in quotes). */
  quoted: boolean;
  status: ListReplyStatus;
  /** Cartons ordered, when status is "ordered". */
  cartons?: number;
};

export type ShopList = {
  id: string;
  name: string;
  /** Shops on the list. */
  count: number;
  /** One line for the sidebar, written as an outcome. */
  preview: string;
  /** Sidebar time. */
  ago: string;
  /** The last message sent to the list. */
  message: string;
  /** Who sent it and when. */
  sentBy: "Brand" | "Order" | "Collector" | "Stock";
  sentAt: string;
  stats: { delivered: number; read: number; replied: number; ordersNaira: number };
  replies: ListShopReply[];
};

export const shopLists: ShopList[] = [
  {
    id: "ikere-route",
    name: "Ikere route",
    count: 14,
    preview: "Price change: 7 replies, 3 orders",
    ago: "12:30",
    message:
      "From Mon 3 Nov, Golden Penny spaghetti 500g goes from ₦17,800 to ₦18,400 a carton. Order before Sunday to get the old price.",
    sentBy: "Brand",
    sentAt: "12:30",
    stats: { delivered: 14, read: 11, replied: 7, ordersNaira: 612000 },
    replies: [
      { shop: "Mama Sola Stores", reply: "Send 5 cartons before Monday abeg", quoted: true, status: "ordered", cartons: 5 },
      { shop: "Joy Mart", reply: "Ok noted. I go call Emeka", quoted: true, status: "replied" },
      { shop: "Chidi & Sons", reply: "Abeg hold 10 for me", quoted: true, status: "ordered", cartons: 10 },
      { shop: "Kola Ventures", reply: "Read 12:51", quoted: false, status: "read" },
      { shop: "Blessing Foods", reply: "Not read yet", quoted: false, status: "none" },
      { shop: "Ade Provisions", reply: "How much for 20 cartons?", quoted: true, status: "replied" },
      { shop: "Tola Supermarket", reply: "Book me 8, same as last time", quoted: true, status: "ordered", cartons: 8 },
    ],
  },
  {
    id: "all-supermarkets",
    name: "All supermarkets",
    count: 125,
    preview: "New stock: Indomie Belle Full",
    ago: "Tue",
    message: "Indomie Belle Full is in stock from today. ₦9,600 a carton, delivery with your next order.",
    sentBy: "Stock",
    sentAt: "Tue 10:05",
    stats: { delivered: 123, read: 96, replied: 31, ordersNaira: 1488000 },
    replies: [
      { shop: "Tola Supermarket", reply: "Add 6 to my order", quoted: true, status: "ordered", cartons: 6 },
      { shop: "Joy Mart", reply: "Price for 20?", quoted: true, status: "replied" },
      { shop: "Blessing Foods", reply: "Read Tue 11:40", quoted: false, status: "read" },
      { shop: "Mama Sola Stores", reply: "Send 4 with Thursday van", quoted: true, status: "ordered", cartons: 4 },
      { shop: "Kola Ventures", reply: "Not read yet", quoted: false, status: "none" },
    ],
  },
];

export const findShopList = (id: string): ShopList | undefined => shopLists.find((l) => l.id === id);

export const listStatusLabel = (r: ListShopReply): string =>
  r.status === "ordered" ? `Ordered ${r.cartons ?? ""} ctns`.replace("  ", " ") : r.status === "replied" ? "Replied" : r.status === "read" ? "Read" : "No reply";
