import type { LegalDoc } from "./legal";

export const PRIVACY: LegalDoc = {
  sections: [
    {
      id: "p-1",
      number: "01",
      title: "Who we are",
      toc: "Who we are",
      blocks: [
        { type: "p", text: "Mimi is a WhatsApp helper for shops, built and run by Rail Technology Concepts Ltd (\"Rail Technology Concepts\", \"we\", \"us\" or \"our\"), a company registered in Nigeria with RC number 9322751. Our registered address is No 8 Ifeoluwa Street, Nova Road 7, Ado-Ekiti, Ekiti State, Nigeria." },
        { type: "p", text: "For the personal data described in this policy, we are the data controller. That means we decide why and how your data is processed, and we are responsible for protecting it. You can reach us, and our Data Protection Officer, at [contact@miriam.africa](mailto:contact@miriam.africa)." },
      ],
    },
    {
      id: "p-2",
      number: "02",
      title: "Scope",
      toc: "Scope",
      blocks: [
        { type: "p", text: "This policy explains how we handle personal data about:" },
        { type: "ul", items: [
          "**Shops:** shop owners who use Mimi on WhatsApp.",
          "**Shop helpers:** people a shop owner adds to help run the shop through Mimi.",
          "**Distributors:** businesses that supply shops and run Mimi with them.",
          "**Brands:** manufacturers and brand owners whose products shops sell.",
          "**Website visitors:** anyone who visits our website or fills in a form on it.",
        ] },
        { type: "p", text: "It covers data we collect through WhatsApp, our website, email and any other way you deal with us. It does not cover third-party services, such as WhatsApp itself or your bank, which have their own privacy policies." },
      ],
    },
    {
      id: "p-3",
      number: "03",
      title: "Laws we follow",
      toc: "Laws we follow",
      blocks: [
        { type: "p", text: "We process personal data in line with the Nigeria Data Protection Act 2023 (NDPA) and the General Application and Implementation Directive (GAID) issued under it by the Nigeria Data Protection Commission (NDPC). The NDPC is the regulator responsible for data protection in Nigeria, and you have the right to complain to it." },
        { type: "p", text: "Where other laws apply to records we hold, such as tax and company laws, we follow those too." },
      ],
    },
    {
      id: "p-4",
      number: "04",
      title: "Data we collect",
      toc: "Data we collect",
      blocks: [
        { type: "h3", text: "From shops and shop helpers" },
        { type: "ul", items: [
          "Your name, phone number and WhatsApp profile name.",
          "Your shop name and location.",
          "Photos of your stock book that you send, and the numbers we read from them.",
          "Payment alerts you forward to Mimi, and the transaction details in them, such as amount, sender name, bank and time.",
          "Voice notes and messages you send to Mimi.",
          "The sales and stock records Mimi builds from all of the above.",
        ] },
        { type: "h3", text: "From distributors and brands" },
        { type: "ul", items: [
          "Business details and the contact details of the people we deal with.",
          "Delivery records for the shops you supply.",
          "Product lists, including product names, pack sizes and prices.",
        ] },
        { type: "h3", text: "Collected automatically" },
        { type: "ul", items: [
          "Device and usage data when you visit our website, such as browser type, pages viewed and approximate location from your IP address.",
          "Timestamps of the messages you send to and receive from Mimi.",
        ] },
        { type: "h3", text: "From third parties" },
        { type: "ul", items: [
          "Payment confirmations from banks and payment partners, used to check whether a transfer really landed.",
          "Message delivery data from WhatsApp (Meta), such as whether a message was delivered or read.",
        ] },
      ],
    },
    {
      id: "p-5",
      number: "05",
      title: "How we use it",
      toc: "How we use it",
      blocks: [
        { type: "p", text: "We only use your data where the law gives us a reason, called a lawful basis. Here is what we do and the basis for each:" },
        { type: "ul", items: [
          "**Providing the service**, including running your account and replying in the chat. Basis: contract.",
          "**Reading and counting stock** from your stock book photos. Basis: contract.",
          "**Checking payments** you forward to us against bank or partner confirmation. Basis: contract.",
          "**Reminders**, such as telling you when a product is running low. Basis: contract.",
          "**Records and summaries** of your sales, stock and payments. Basis: contract.",
          "**Credit scores**, shared with a distributor or brand only when you agree. Basis: consent.",
          "**Support**, when you ask us for help. Basis: contract and legitimate interest.",
          "**Safety and fraud prevention**, such as spotting fake alerts and misuse. Basis: legitimate interest.",
          "**Improving accuracy** of how Mimi reads photos, messages and voice notes. Basis: legitimate interest.",
          "**Legal duties**, such as keeping tax records and responding to lawful requests. Basis: legal obligation.",
        ] },
        { type: "p", text: "Where we rely on legitimate interest, we have weighed our interest against your rights and only go ahead where your rights are not overridden. You can object at any time (see section 12)." },
      ],
    },
    {
      id: "p-6",
      number: "06",
      title: "Sharing with distributors and brands",
      toc: "Sharing with distributors",
      blocks: [
        { type: "p", text: "We only share a shop's data with a distributor or brand when the shop has agreed. The shop chooses which distributors or brands can see its data, and what they see is limited to their own products." },
        { type: "p", text: "With your consent, a distributor or brand can see:" },
        { type: "ul", items: [
          "Sales and stock levels of their own products in your shop.",
          "Payments you have made to them.",
          "A credit score, with the reasons behind it.",
          "Your total debt across suppliers, as an amount only, without supplier names.",
        ] },
        { type: "p", text: "They can never see your profit, your customers or another brand's sales. You can withdraw consent at any time by messaging Mimi or emailing us, and sharing stops from that point. Withdrawing consent does not affect sharing that happened before." },
      ],
    },
    {
      id: "p-7",
      number: "07",
      title: "Service providers",
      toc: "Service providers",
      blocks: [
        { type: "p", text: "We use trusted providers to run Mimi. They process data only on our instructions and under written contracts:" },
        { type: "ul", items: [
          "**Cloud hosting** providers that store and run our systems.",
          "**WhatsApp Business Platform by Meta**, which carries messages between you and Mimi.",
          "**AI model providers** that process images, voice and text on our instructions, under contract, to read stock books and understand messages. They may not use your data for their own purposes.",
          "**Payment and bank verification partners** that confirm whether a transfer landed.",
        ] },
        { type: "p", text: "We do not sell your data. We do not use it for advertising, and we do not let anyone else use it for advertising. We may also disclose data where the law requires it, for example to a court or regulator." },
      ],
    },
    {
      id: "p-8",
      number: "08",
      title: "International transfers",
      toc: "International transfers",
      blocks: [
        { type: "p", text: "Some of our providers process data outside Nigeria, for example in cloud data centres abroad. When data leaves Nigeria, we rely on the transfer rules in the NDPA: we transfer to countries the NDPC recognises as offering adequate protection, or we put appropriate safeguards in place, such as contracts with data protection terms that bind the provider. You can ask us for more detail about these safeguards." },
      ],
    },
    {
      id: "p-9",
      number: "09",
      title: "AI and automated decisions",
      toc: "AI and automated decisions",
      blocks: [
        { type: "p", text: "Mimi uses AI to read photos of stock books and to understand messages and voice notes. AI can make mistakes, so when a reading is unclear, Mimi asks you to confirm instead of guessing." },
        { type: "p", text: "Credit scores are worked out automatically from your records. Every score comes with the reasons behind it, and it is advisory only: the distributor or brand makes the credit decision, not Mimi. If you disagree with a score or any automated result, you can ask for a human review by emailing us or messaging Mimi \"privacy\"." },
      ],
    },
    {
      id: "p-10",
      number: "10",
      title: "How long we keep data",
      toc: "How long we keep data",
      blocks: [
        { type: "ul", items: [
          "**Account data:** while your account is active, and up to 12 months after you close it.",
          "**Stock book photos:** 12 months from when you send them.",
          "**Transaction records:** up to 6 years, for legal and tax reasons.",
        ] },
        { type: "p", text: "After these periods, we delete the data or anonymise it so it can no longer identify you." },
      ],
    },
    {
      id: "p-11",
      number: "11",
      title: "Security",
      toc: "Security",
      blocks: [
        { type: "p", text: "We protect your data with encryption in transit and at rest, access controls that limit who on our team can see what, and audit logs that record access. Our staff are bound by confidentiality." },
        { type: "p", text: "If a personal data breach happens that is likely to put your rights at risk, we will notify the NDPC within 72 hours of becoming aware of it, and tell affected users without undue delay, with what happened and what we are doing about it." },
      ],
    },
    {
      id: "p-12",
      number: "12",
      title: "Your rights",
      toc: "Your rights",
      blocks: [
        { type: "p", text: "Under the NDPA, you have the right to:" },
        { type: "ul", items: [
          "Access the personal data we hold about you.",
          "Correct data that is wrong or incomplete.",
          "Ask us to delete your data.",
          "Restrict how we use your data.",
          "Object to processing based on legitimate interest.",
          "Receive your data in a portable format, or have it sent to another provider.",
          "Withdraw consent at any time.",
          "Not be subject to decisions based solely on automated processing that have significant effects on you.",
          "Complain to the Nigeria Data Protection Commission.",
        ] },
        { type: "p", text: "To use any of these rights, email [contact@miriam.africa](mailto:contact@miriam.africa) or message Mimi \"privacy\". We may need to confirm who you are first. We will respond within 30 days." },
      ],
    },
    {
      id: "p-13",
      number: "13",
      title: "Children",
      toc: "Children",
      blocks: [
        { type: "p", text: "Mimi is not for anyone under 18. We do not knowingly collect data from children. If you believe a child has given us data, contact us and we will delete it." },
      ],
    },
    {
      id: "p-14",
      number: "14",
      title: "Cookies",
      toc: "Cookies",
      blocks: [
        { type: "p", text: "Our website uses only essential cookies or similar storage needed for it to work, such as remembering your light or dark theme. We do not use tracking or advertising cookies at launch. If that changes, we will update this policy and ask for your consent first where the law requires it." },
      ],
    },
    {
      id: "p-15",
      number: "15",
      title: "Changes to this policy",
      toc: "Changes",
      blocks: [
        { type: "p", text: "We may update this policy as Mimi grows or the law changes. We will change the \"Last updated\" date at the top and, for important changes, tell you on WhatsApp or by email before they take effect." },
      ],
    },
    {
      id: "p-16",
      number: "16",
      title: "Contact us and DPO",
      toc: "Contact and DPO",
      blocks: [
        { type: "p", text: "Rail Technology Concepts Ltd, RC 9322751\nNo 8 Ifeoluwa Street, Nova Road 7, Ado-Ekiti, Ekiti State, Nigeria\nContact and Data Protection Officer: [contact@miriam.africa](mailto:contact@miriam.africa)" },
        { type: "p", text: "If you are not happy with how we handled your request, you can complain to the Nigeria Data Protection Commission." },
      ],
    },
  ],
};
