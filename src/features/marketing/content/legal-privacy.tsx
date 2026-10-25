import Link from "next/link";
import type { LegalDoc } from "@/features/marketing/components/LegalPage";
import { ContactEmail } from "@/features/marketing/components/ContactEmail";

/** Privacy policy. Draft for legal review. */
export const privacy: LegalDoc = {
  title: "Privacy policy.",
  tocLabel: "Privacy contents",
  updated: "Last updated 16 October 2026",
  status: "Draft for review",
  clauses: [
    {
      id: "p-who",
      title: "Who we are",
      body: (
        <>
          <p>
            Rail Technology Concepts Ltd, trading as Rail Money, RC 9322751, is the data controller for Mimi.
          </p>
        </>
      ),
    },
    {
      id: "p-collect",
      title: "What we collect",
      body: (
        <>
          <p>
            <b>From shops:</b>
          </p>
          <ul>
            <li>WhatsApp number and name;</li>
            <li>stock book photos and counts;</li>
            <li>voice notes;</li>
            <li>forwarded payment alerts;</li>
            <li>delivery records;</li>
            <li>recorded debts;</li>
            <li>payment confirmations from our partners: amount, time, sender name and bank.</li>
          </ul>
          <p>
            <b>From distributors:</b>
          </p>
          <ul>
            <li>business and staff contacts;</li>
            <li>catalogue and price lists;</li>
            <li>delivery records.</li>
          </ul>
          <p>
            <b>From brands:</b> contact details. Brands receive only data that shops have consented to share.
          </p>
        </>
      ),
    },
    {
      id: "p-why",
      title: "Why we use it",
      toc: "Why",
      body: (
        <>
          <p>
            To run Mimi and keep it secure. <b>We never sell personal data.</b>
          </p>
        </>
      ),
    },
    {
      id: "p-basis",
      title: "Lawful basis",
      body: (
        <>
          <p>Under the Nigeria Data Protection Act 2023 we rely on:</p>
          <ul>
            <li>
              <b>Contract</b>, to provide the service;
            </li>
            <li>
              <b>Consent</b>, for sharing with distributors and brands;
            </li>
            <li>
              <b>Legitimate interest</b>, for security and fraud prevention.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "p-share",
      title: "Sharing",
      body: (
        <>
          <p>We share personal data only:</p>
          <ul>
            <li>with your consent;</li>
            <li>with licensed payment partners;</li>
            <li>with service providers under contract with us.</li>
          </ul>
        </>
      ),
    },
    {
      id: "p-store",
      title: "Storage and security",
      body: (
        <>
          <p>Data is encrypted in transit and at rest. Access is limited by role.</p>
        </>
      ),
    },
    {
      id: "p-keep",
      title: "Retention",
      body: (
        <>
          <ul>
            <li>Photos and voice notes: up to 12 months.</li>
            <li>Records: while the account is active.</li>
          </ul>
        </>
      ),
    },
    {
      id: "p-rights",
      title: "Your rights",
      body: (
        <>
          <p>You can:</p>
          <ul>
            <li>access your data;</li>
            <li>correct it;</li>
            <li>ask us to delete it;</li>
            <li>withdraw consent;</li>
            <li>complain to the Nigeria Data Protection Commission.</li>
          </ul>
        </>
      ),
    },
    {
      id: "p-kids",
      title: "Children",
      body: (
        <>
          <p>Mimi is not for anyone under 18.</p>
        </>
      ),
    },
    {
      id: "p-changes",
      title: "Changes",
      body: (
        <>
          <p>
            We will post changes to this policy here and update the date above. We will tell you about
            material changes.
          </p>
        </>
      ),
    },
    {
      id: "p-contact",
      title: "Contact",
      body: (
        <>
          <p>
            Privacy questions or requests: <ContactEmail />. See also our{" "}
            <Link href="/terms">Terms of use</Link>.
          </p>
        </>
      ),
    },
  ],
};
