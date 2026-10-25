import type { PhotoSpec } from "@/components/ui/Photo";
import Link from "next/link";
import type { ReactNode } from "react";

export const POST_TAGS = ["Distribution", "Trust", "Product"] as const;
export type PostTag = (typeof POST_TAGS)[number];

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  readMins: number;
  tag: PostTag;
  author: string;
  image: PhotoSpec;
  body: ReactNode;
};

/** Blog posts, newest first. The first post is featured on the blog index and the home page. */
export const posts: Post[] = [
  {
    slug: "why-distributors-run-on-notebooks",
    title: "Why distributors still run on notebooks",
    excerpt: "The notebook isn't the problem. It's the only tool that fits how the route actually works.",
    date: "2026-10-21",
    readMins: 4,
    tag: "Distribution",
    author: "Tobi Omotade",
    image: { src: "photo-notebook", alt: "A distributor's handwritten notebook of shops and balances" },
    body: (
      <>
        <p>
          Walk into most FMCG distributors in Nigeria and you'll find the same thing: a notebook, a few
          WhatsApp groups and an owner who remembers more than any software ever has.
        </p>
        <p>
          It's easy to call that old-fashioned. We think it's the opposite. The notebook survives because it
          fits the work. It goes in a bag, it needs no data, nobody has to be trained on it and it never asks
          for a password at 6am when the van is loading.
        </p>
        <h2>Where it breaks</h2>
        <p>
          The trouble starts when the business grows past one person's memory. A second rep joins. A shop says
          it paid last week. A transfer alert arrives that nobody can confirm. The notebook still holds the
          facts, but nobody can see them together.
        </p>
        <ul>
          <li>Who owes what, and since when</li>
          <li>Which shop took which cartons on which run</li>
          <li>Whether a payment really landed</li>
        </ul>
        <h2>What we're building instead</h2>
        <p>
          Mimi doesn't ask anyone to give up how they work. Reps keep using WhatsApp. Owners keep the final
          say. Mimi listens to what's already happening (deliveries, payments, reorders) and keeps one book
          that everyone can trust.
        </p>
        <p>The goal isn't to replace the notebook. It's to make sure what's in it never gets lost again.</p>
      </>
    ),
  },
  {
    slug: "three-witnesses-for-every-naira",
    title: "Three witnesses for every naira",
    excerpt:
      "A sale is only real when the route, the shop and the money agree. That's the idea Mimi is built on.",
    date: "2026-10-21",
    readMins: 3,
    tag: "Trust",
    author: "Tobi Omotade",
    image: { src: "photo2-counter", alt: "Hands with a phone, a ledger and naira notes on a shop counter" },
    body: (
      <>
        <p>
          Every sale between a distributor and a shop has three sides. The rep says the goods were delivered.
          The shop says what it received. The bank says what was paid.
        </p>
        <p>
          Most disputes happen when those three stories don't line up, and nobody notices until month end.
        </p>
        <h2>Matching the stories</h2>
        <p>
          Mimi treats each side as a witness. When the delivery, the shop's confirmation and the payment all
          agree, the sale is settled. When one is missing or different, Mimi flags it early and drafts a
          polite follow-up for the owner to approve.
        </p>
        <h2>Why it matters for credit</h2>
        <p>
          Shops that pay on time deserve more credit. Distributors want to give it, but they need proof. A
          clean record of matched sales is that proof, built quietly from work that's already happening.
        </p>
        <p>
          Mimi never moves money and never sets credit limits. It just makes sure everyone is looking at the
          same facts.
        </p>
      </>
    ),
  },
  {
    slug: "shops-own-their-data",
    title: "Shops own their data. Here's what that means.",
    excerpt:
      "Shop owners decide who sees their numbers, one partner at a time. Brands see totals, not names.",
    date: "2026-10-21",
    readMins: 3,
    tag: "Trust",
    author: "Tobi Omotade",
    image: { src: "photo2-shop", alt: "A smiling shop owner at her kiosk counter with her phone" },
    body: (
      <>
        <p>
          When we talk to shop owners, the first question is rarely about features. It's "who will see my
          business?"
        </p>
        <p>It's the right question. So we answered it before writing much code.</p>
        <h2>The rules</h2>
        <ul>
          <li>A shop's book belongs to the shop. It can see it, export it or delete it.</li>
          <li>
            Consent is per partner. A shop can share with its distributor and not with a brand, and change its
            mind later.
          </li>
          <li>Brands see area totals and trends by default, with no shop names or money owed.</li>
          <li>Nothing goes out in anyone's name without the owner approving it.</li>
        </ul>
        <h2>Why we're strict about it</h2>
        <p>
          Trust is the whole product. If shops don't trust Mimi, the book is empty. If the book is empty,
          nobody gets better credit, better stock or better forecasts. Strict data rules aren't a cost for us.
          They're how the system works at all.
        </p>
        <p>
          You can read the full version on our <Link href="/security">Security and data</Link> page.
        </p>
      </>
    ),
  },
  {
    slug: "one-question-a-week",
    title: "One question a week, and no more",
    excerpt:
      "Why we stopped asking shops to snap their stock books and started learning from what already happens.",
    date: "2026-10-21",
    readMins: 3,
    tag: "Product",
    author: "Tobi Omotade",
    image: { src: "photo2-shelf", alt: "A hand straightening products on a colourful store shelf" },
    body: (
      <>
        <p>
          Our first idea was simple: ask shop owners to snap a photo of their stock book every day. It made
          sense on paper. In real shops, it didn't.
        </p>
        <p>Owners are busy. A daily task from a supplier feels like homework, and homework gets ignored.</p>
        <h2>What we changed</h2>
        <p>
          Now most of what Mimi knows comes as a by-product of work that already happens: deliveries, payments
          and WhatsApp reorders. On top of that, Mimi asks at most one short question a week, like "How many
          cartons of noodles do you have left?" A typed number or a voice note is enough.
        </p>
        <p>
          If a shop skips three check-ins in a row, Mimi stops asking and offers another option instead.
          Bigger shops can connect a spreadsheet or their POS, with their consent.
        </p>
        <h2>The rule we keep</h2>
        <p>
          Never nag. If Mimi needs more than one question a week to be useful, that's our problem to fix, not
          the shop's.
        </p>
      </>
    ),
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

/** Up to two other posts, same tag first (the "More posts" row under a post). */
export function morePosts(post: Post, count = 2): Post[] {
  return posts
    .filter((o) => o.slug !== post.slug)
    .sort((a, b) => Number(b.tag === post.tag) - Number(a.tag === post.tag))
    .slice(0, count);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-21" -> "21 Oct 2026". */
export function formatPostDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}
