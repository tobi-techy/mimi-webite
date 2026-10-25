import Link from "next/link";
import type { LegalDoc } from "@/features/marketing/components/LegalPage";
import { ContactEmail } from "@/features/marketing/components/ContactEmail";

/** Terms of use. Draft for legal review. */
export const terms: LegalDoc = {
  title: "Terms of use.",
  tocLabel: "Terms contents",
  updated: "Last updated 16 October 2026",
  status: "Draft for review",
  clauses: [
    {
      id: "t-who",
      title: "Who we are",
      body: (
        <>
          <p>
            Mimi is a service of Rail Technology Concepts Ltd, trading as Rail Money, RC 9322751, of No 8
            Ifeoluwa Street, Nova Road 7, Ado-Ekiti, Ekiti State, Nigeria. “We” and “us” mean Rail Technology
            Concepts Ltd.
          </p>
        </>
      ),
    },
    {
      id: "t-what",
      title: "What Mimi does",
      body: (
        <>
          <p>Mimi is a set of AI agents on WhatsApp. They:</p>
          <ul>
            <li>read stock records;</li>
            <li>check payment notifications against account records;</li>
            <li>keep a debt book;</li>
            <li>send reorders that shops approve;</li>
            <li>draft documents that owners approve.</li>
          </ul>
          <p>
            <b>Mimi is not a bank and does not lend.</b> Payments are processed by licensed payment partners
            and go straight to the receiving business. We hold no customer balances.
          </p>
        </>
      ),
    },
    {
      id: "t-users",
      title: "Who can use it",
      body: (
        <>
          <ul>
            <li>Shop owners, and staff they permit.</li>
            <li>Distributors and brands with a signed agreement with us.</li>
          </ul>
          <p>You must be 18 or older.</p>
        </>
      ),
    },
    {
      id: "t-shops",
      title: "Shops",
      body: (
        <>
          <p>Mimi is free for shops. You are responsible for the records you send.</p>
          <p>
            Payment checks reduce risk but are not a guarantee. Check large amounts before you release goods.
          </p>
        </>
      ),
    },
    {
      id: "t-dist",
      title: "Distributors and brands",
      body: (
        <>
          <p>
            Billing is monthly, per active shop connection, with a monthly minimum set in your order form.
            Pilots are free for 4 weeks unless we agree otherwise in writing.
          </p>
          <p>You see only data that shops have approved, and only for your own products.</p>
        </>
      ),
    },
    {
      id: "t-use",
      title: "Acceptable use",
      body: (
        <>
          <p>You must not:</p>
          <ul>
            <li>use Mimi for fraud;</li>
            <li>send unwanted messages;</li>
            <li>try to see another business's data;</li>
            <li>reverse engineer Mimi or overload it.</li>
          </ul>
        </>
      ),
    },
    {
      id: "t-data",
      title: "Your data",
      body: (
        <>
          <p>
            Shops own their records. A shop can send STOP at any time. How we handle data is set out in our{" "}
            <Link href="/privacy">Privacy policy</Link>.
          </p>
        </>
      ),
    },
    {
      id: "t-avail",
      title: "Availability",
      body: (
        <>
          <p>
            Mimi depends on WhatsApp and on our payment partners, so we cannot promise it will always be
            available. We will tell you about material changes to the service.
          </p>
        </>
      ),
    },
    {
      id: "t-liab",
      title: "Liability",
      body: (
        <>
          <p>
            We are not liable for indirect losses, lost profit, or goods released on a payment that later
            fails.
          </p>
          <p>
            Our total liability to a distributor is limited to the fees it paid us in the 3 months before the
            claim.
          </p>
        </>
      ),
    },
    {
      id: "t-end",
      title: "Ending",
      body: (
        <>
          <p>
            A shop can stop at any time by sending STOP. Distributors and brands can end their use under the
            terms of their agreement. We may suspend or end access for anyone who breaks these terms.
          </p>
        </>
      ),
    },
    {
      id: "t-law",
      title: "Law",
      body: (
        <>
          <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>
        </>
      ),
    },
    {
      id: "t-contact",
      title: "Contact",
      body: (
        <>
          <p>
            Questions about these terms: <ContactEmail />
          </p>
        </>
      ),
    },
  ],
};
