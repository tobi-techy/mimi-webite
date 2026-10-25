export type ConnectorCategory =
  "Messaging" | "Docs" | "Payments" | "Accounting" | "Banking" | "Storage" | "Calendar" | "Commerce" | "CRM";

export type Connector = {
  key: string;
  name: string;
  description: string;
  category: ConnectorCategory;
  connected: boolean;
  logo?: string;
  /** Shown in the "Needs action" group of Connected tools (e.g. expired access). */
  needs?: string;
  /** Small grey "Beta" tag on the card. */
  beta?: boolean;
};

const logo = (k: string, ext: "svg" | "png" = "svg") => `/console/logos/${k}.${ext}`;

export const connectors: readonly Connector[] = [
  {
    key: "whatsapp",
    name: "WhatsApp Business",
    description: "Send and read shop messages from your Business number",
    category: "Messaging",
    connected: true,
    logo: logo("whatsapp"),
  },
  {
    key: "googlesheets",
    name: "Google Sheets",
    description: "Read and update price lists and route sheets",
    category: "Docs",
    connected: true,
    logo: logo("googlesheets"),
  },
  {
    key: "gmail",
    name: "Gmail",
    description: "Read supplier invoices and delivery notes",
    category: "Messaging",
    connected: true,
    logo: logo("gmail"),
    needs: "Access expired on 22 Oct · Reconnect so Proof can keep reading invoices",
  },
  {
    key: "paystack",
    name: "Paystack",
    description: "Verify incoming transfers on your virtual accounts",
    category: "Payments",
    connected: true,
    logo: logo("paystack", "png"),
  },
  {
    key: "moniepoint",
    name: "Moniepoint",
    description: "Match POS and transfer settlements",
    category: "Payments",
    connected: false,
    logo: logo("moniepoint", "png"),
  },
  {
    key: "quickbooks",
    name: "QuickBooks",
    description: "Sync invoices and shop balances with your books",
    category: "Accounting",
    connected: false,
    logo: logo("quickbooks"),
  },
  {
    key: "mono",
    name: "Mono",
    description: "Bank statements from any Nigerian bank",
    category: "Banking",
    connected: false,
    logo: logo("mono", "png"),
    beta: true,
  },
  {
    key: "flutterwave",
    name: "Flutterwave",
    description: "Collect card and transfer payments from shops",
    category: "Payments",
    connected: false,
    logo: logo("flutterwave", "png"),
  },
  {
    key: "zoho",
    name: "Zoho Books",
    description: "Post verified payments against Zoho invoices",
    category: "Accounting",
    connected: false,
    logo: logo("zoho"),
  },
  {
    key: "xero",
    name: "Xero",
    description: "Reconcile bank feeds with shop invoices",
    category: "Accounting",
    connected: false,
    logo: logo("xero"),
  },
  {
    key: "sage",
    name: "Sage",
    description: "Export sales and receipts to Sage ledgers",
    category: "Accounting",
    connected: false,
    logo: logo("sage"),
  },
  {
    key: "monnify",
    name: "Monnify",
    description: "Reserved accounts and transfer notifications",
    category: "Payments",
    connected: false,
    logo: logo("monnify", "png"),
  },
  {
    key: "stripe",
    name: "Stripe",
    description: "Card payments from buyers outside Nigeria",
    category: "Payments",
    connected: false,
    logo: logo("stripe"),
  },
  {
    key: "googledrive",
    name: "Google Drive",
    description: "Store reports, receipts and signed agreements",
    category: "Storage",
    connected: false,
    logo: logo("googledrive"),
  },
  {
    key: "dropbox",
    name: "Dropbox",
    description: "Read delivery photos and shared folders",
    category: "Storage",
    connected: false,
    logo: logo("dropbox"),
  },
  {
    key: "googlecalendar",
    name: "Google Calendar",
    description: "Plan delivery days and shop visits",
    category: "Calendar",
    connected: false,
    logo: logo("googlecalendar"),
  },
  {
    key: "microsoftoutlook",
    name: "Outlook",
    description: "Read supplier email and send statements",
    category: "Messaging",
    connected: false,
    logo: logo("microsoftoutlook"),
  },
  {
    key: "microsoftexcel",
    name: "Microsoft Excel",
    description: "Read stock sheets and credit ledgers",
    category: "Docs",
    connected: false,
    logo: logo("microsoftexcel"),
  },
  {
    key: "notion",
    name: "Notion",
    description: "Read route notes and sales playbooks",
    category: "Docs",
    connected: false,
    logo: logo("notion"),
  },
  {
    key: "airtable",
    name: "Airtable",
    description: "Sync shop lists and visit logs",
    category: "Docs",
    connected: false,
    logo: logo("airtable"),
  },
  {
    key: "slack",
    name: "Slack",
    description: "Post approvals and daily summaries to your team",
    category: "Messaging",
    connected: false,
    logo: logo("slack"),
  },
  {
    key: "telegram",
    name: "Telegram",
    description: "Message shops and riders on Telegram",
    category: "Messaging",
    connected: false,
    logo: logo("telegram"),
    beta: true,
  },
  {
    key: "shopify",
    name: "Shopify",
    description: "Read online orders and stock levels",
    category: "Commerce",
    connected: false,
    logo: logo("shopify"),
  },
  {
    key: "hubspot",
    name: "HubSpot",
    description: "Track new shop leads and follow-ups",
    category: "CRM",
    connected: false,
    logo: logo("hubspot"),
  },
];

/** Bank connector shown only in the payment providers table. */
export const providus: Connector = {
  key: "providus",
  name: "Providus",
  description: "Read statements and match shop transfers",
  category: "Payments",
  connected: false,
};

/** Category order for the Connected tools grid. */
export const connectorCategories: readonly ConnectorCategory[] = [
  "Messaging", "Payments", "Banking", "Accounting", "Docs", "Storage", "Calendar", "Commerce", "CRM",
];
export const paymentProviders = ["paystack", "moniepoint", "providus"] as const;

export const connectorPermissions: Record<ConnectorCategory, readonly string[]> = {
  Payments: ["Read transactions", "Read virtual accounts", "Never moves money"],
  Banking: ["Read bank statements", "Read account balances", "Never moves money"],
  Accounting: ["Read invoices and bills", "Create draft invoices", "Never posts without your approval"],
  Messaging: ["Read messages", "Send messages within your approval rules", "Never deletes conversations"],
  Docs: ["Read sheets and pages you share", "Update rows when asked", "Never shares files outside Wigmore"],
  Storage: ["Read folders you pick", "Save reports and receipts", "Never deletes files"],
  Calendar: ["Read events", "Create delivery reminders", "Never invites outside people"],
  Commerce: ["Read orders and products", "Read stock levels", "Never changes prices"],
  CRM: ["Read contacts and deals", "Log WhatsApp activity", "Never emails contacts on its own"],
};
