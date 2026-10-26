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

/** A screenshot inside a post body: plain image (pre-optimised in public/blog/<slug>/), caption below. */
function Shot({
  src,
  alt,
  caption,
  width,
  height,
}: {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}) {
  return (
    <figure className="x-post__fig">
      <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/** Blog posts, newest first. The first post is featured on the blog index and the home page. */
export const posts: Post[] = [
  {
    slug: "how-we-designed-mimis-helpers",
    title: "How we designed Mimi's helpers, after studying Grok Bot",
    excerpt:
      "I spent a morning taking apart how xAI designed Grok Bot. Here's what we borrowed for Mimi, and where shops in Nigeria need us to go further.",
    date: "2026-10-26",
    readMins: 6,
    tag: "Product",
    author: "Tobi Omotade",
    image: {
      src: "post-helpers-cover",
      alt: "The Mimi console: the helper roster on the left, Collector's conversation in the middle and Proof's computer open on a GTBank statement",
    },
    body: (
      <>
        <p>
          Mimi is an AI helper for distributors and the shops they supply. This morning I sat down with xAI's{" "}
          <a href="https://x.ai/news/designing-grok-bot">write-up on designing Grok Bot</a> and their{" "}
          <a href="https://x.ai/bot">product page</a>, and took both apart screen by screen. It's one of the
          clearest pieces I've read on how people should work with AI agents. A lot of what you'll now see in
          the Mimi console came from it. Some of it we changed, because a shop in Oshodi is not an office in
          San Francisco.
        </p>
        <p>
          Quick honesty first. The console is a demo. The shops, the money and the messages are sample data,
          and no distributor is live on Mimi yet. I'm sharing it early because the design decisions matter
          more right now than the polish.
        </p>
        <h2>You manage helpers, not chats</h2>
        <p>
          Grok Bot's biggest idea is a roster of bots instead of a long list of chat history. We copied that.
          Mimi has six helpers: Order, Collector, Credit, Stock, Brand and Proof, with Mimi on top handing out
          the work. Each helper has one conversation, like a contact in your messages.
        </p>
        <p>
          Our first version had a separate thread for every task, and the sidebar got crowded fast. So now
          each helper's tasks sit inside her one conversation, with a small line marking where each new task
          starts.
        </p>
        <p>
          The sidebar shows each helper with a one-line outcome, not the last thing somebody typed. Collector
          says "Chased 5 shops, ₦385,900 owed · plan waiting". When a helper needs you, her row gets a small
          orange count. You can tell what your team is doing without opening anything.
        </p>
        <Shot
          src="/blog/how-we-designed-mimis-helpers/roster-match.webp"
          width={1440}
          height={900}
          alt="Proof's conversation in the Mimi console. Step lines show she read Mama Tunde's WhatsApp, matched a ₦42,000 bank alert and found the invoice, then a payment match card waits for approval"
          caption="Proof matched Mama Tunde's ₦42,000 transfer to her invoice and is waiting for a yes. Sample data."
        />
        <h2>Faces that show state</h2>
        <p>
          Grok Bot gives every bot a simple face that changes with what it's doing. We did the same. Each
          helper's face shows if she's idle, working, waiting on you, blocked or done. Hover a row, or
          long-press it on your phone, and you see the step she's on and what she has cost today. It sounds
          small. It's the difference between opening seven chats and glancing once.
        </p>
        <h2>Step lines instead of three dots</h2>
        <p>
          The three dots that mean "typing" tell you nothing. Grok Bot swapped them for a list of the steps
          the bot actually took. Ours read like this: the tool, what came back, how long it took and what it
          cost. "Read bank alert → matched Mama Tunde ₦42,000 · 1.2s · ₦3." You see what she did, and you see
          it in money you actually spend.
        </p>
        <p>
          When something goes wrong, you see that too. The bank page timed out, she tried again, it loaded.
          Nothing is hidden behind a spinner.
        </p>
        <h2>Cards you approve in the conversation</h2>
        <p>
          When a helper wants to do something that matters, she puts a card in the conversation. A reminder
          plan, an order, a new credit limit, a payment match. You approve or discard it right there, without
          going to another page. Every card shows its risk tier, and every number on it says how sure we are.
        </p>
        <Shot
          src="/blog/how-we-designed-mimis-helpers/approve.webp"
          width={1440}
          height={900}
          alt="Credit's conversation after approval: Iya Femi's credit limit change card marked as approved"
          caption="Approving Iya Femi's new credit limit inside Credit's conversation. Sample data."
        />
        <h2>Her computer, in a side panel</h2>
        <p>
          Grok Bot treats the bot's computer as the bot's own, with three levels. A status, a preview and a
          full takeover. We kept all three. There's a small status in the header while she works, a side panel
          that shows her screen, and full screen when you want a closer look. Take control pauses her and
          gives you the mouse. "I'm done" hands it back.
        </p>
        <p>
          We drew her computer as a Windows desktop, with a taskbar, a browser on the bank statement and a
          spreadsheet behind it. Most owners here use Windows every day, so it should feel familiar.
        </p>
        <Shot
          src="/blog/how-we-designed-mimis-helpers/computer.webp"
          width={1440}
          height={900}
          alt="Proof's computer open in the side panel: a Windows-style desktop with a browser on a GTBank statement, one row highlighted with the cursor on it, and a spreadsheet window behind"
          caption="Proof checking a POS payment on the bank statement. Take control is one tap away."
        />
        <h2>Routines and the composer</h2>
        <p>
          Routines live with the helper that runs them, not in a settings page. Collector's morning chase sits
          on Collector's own page, with its last run, its history and an on/off switch.
        </p>
        <p>
          In the composer, / shows that helper's skills and @ brings in another helper or a shop. If you type
          while she's working, she doesn't start over. She takes your message at her next step.
        </p>
        <h2>Where Mimi has to go further</h2>
        <p>
          Grok Bot is built for people at a desk. Our users are a distributor in a warehouse and shop owners
          behind a counter. So a few things had to be different.
        </p>
        <ul>
          <li>
            Shops install nothing. They talk to Mimi on WhatsApp, where they already are. A shop owner
            shouldn't need a new app to answer a reminder. The console is for the distributor.
          </li>
          <li>
            Risk tiers are fixed in code, not left to the model. Some things just happen, some tell you after,
            some wait for your yes. Moving money is always Never. Mimi doesn't move anyone's money.
          </li>
          <li>Every figure carries a proof label: verified, likely or estimated.</li>
          <li>
            Approvals expire. If you don't answer in time, Mimi doesn't go ahead. She asks you again on
            WhatsApp.
          </li>
          <li>Cost shows in naira, per step and per day.</li>
        </ul>
        <Shot
          src="/blog/how-we-designed-mimis-helpers/phone.webp"
          width={780}
          height={1688}
          alt="The Mimi console on a phone: the menu with Needs you, Shops and Automations above the helper roster, each helper with a face, an outcome and an orange count"
          caption="The same team on a phone."
        />
        <h2>What we're building next</h2>
        <p>
          The part you can't see in a demo is the runtime. For Mimi to be useful she has to keep working when
          nobody is watching. So that's the work now: jobs that survive a crash and carry on from the last
          step, budgets that park the work and ask you when they run out, and checks so no reminder ever goes
          out twice.
        </p>
        <p>
          Big thanks to the xAI team for writing their thinking down in public. If you're building agents,
          read it. And if you run a distribution business in Nigeria and want to try Mimi early, talk to me.
        </p>
      </>
    ),
  },
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
