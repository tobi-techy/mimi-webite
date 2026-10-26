import type { IconName } from "@/features/console/components/ui/icon-paths";

export type SettingsControl =
  | { kind: "switch"; on: boolean }
  | { kind: "select"; options: readonly string[]; value: string }
  | { kind: "kbd"; keys: readonly string[]; on: boolean }
  | { kind: "button"; label: string; toast?: string; to?: SettingsSectionId }
  | { kind: "pauseAll"; label: string }
  /** A value shown in the select style that cannot be changed (the owner's role). */
  | { kind: "fixed"; label: string; hint: string }
  | { kind: "bar"; percent: number };

export type SettingsRow = { title: string; detail?: string; control?: SettingsControl; avatar?: string };

export type SettingsGroup =
  { title: string; rows: readonly SettingsRow[] } | { title: string; providers: true };

export type SettingsSectionId =
  | "general"
  | "appearance"
  | "connectors"
  | "computers"
  | "support"
  | "organization"
  | "members"
  | "shops"
  | "billing"
  | "usage";

export type SettingsSection = {
  id: SettingsSectionId;
  title: string;
  icon: IconName;
  sub?: string;
  action?: { label: string; toast: string; primary?: boolean };
  groups: readonly SettingsGroup[];
};

const sw = (on: boolean): SettingsControl => ({ kind: "switch", on });
const sel = (options: readonly string[], value: string): SettingsControl => ({
  kind: "select",
  options,
  value,
});
const btn = (label: string, toast?: string, to?: SettingsSectionId): SettingsControl => ({
  kind: "button",
  label,
  toast,
  to,
});
const kbd = (...keys: string[]): SettingsControl => ({ kind: "kbd", keys, on: true });
const WHO = ["Alone", "Ask first", "Coral Lane only"] as const;
const ROLE = ["Admin", "Sales rep"] as const;

export const settingsSections: readonly SettingsSection[] = [
  {
    id: "general",
    title: "General",
    icon: "settings",
    groups: [
      {
        title: "Your account",
        rows: [{ title: "Tobi Omotade", detail: "omotadetobiloba@gmail.com", avatar: "TO" }],
      },
      {
        title: "Your organization",
        rows: [
          {
            title: "Coral Lane Trading",
            detail: "Distributor · 14 seats",
            control: btn("Edit", undefined, "organization"),
            avatar: "WG",
          },
        ],
      },
      { title: "Payment providers", providers: true },
      {
        title: "Preferences",
        rows: [
          { title: "Language", control: sel(["English", "Pidgin", "Yoruba"], "English") },
          { title: "Role", control: sel(["Owner", "Admin", "Sales rep"], "Owner") },
          { title: "Auto-verify transfers under ₦50,000", control: sw(true) },
          { title: "Ask before messaging a new shop", control: sw(true) },
          {
            title: "Keep computers awake during runs",
            detail: "Stops a computer sleeping mid-task. Uses more agent hours.",
            control: sw(false),
          },
        ],
      },
      {
        title: "Keyboard shortcuts",
        rows: [
          { title: "New thread", control: kbd("⌘", "N") },
          { title: "Pause all computers", control: kbd("⌘", "⇧", "P") },
          { title: "Take over", control: kbd("⌘", "T") },
          { title: "Search", control: kbd("⌘", "K") },
        ],
      },
      {
        title: "Notifications",
        rows: [
          {
            title: "Approvals waiting",
            detail: "When Mimi stops for a decision",
            control: sel(["WhatsApp and email", "WhatsApp only", "Email only"], "WhatsApp and email"),
          },
          {
            title: "Payment verified",
            detail: "Each time a shop's transfer is matched on a statement",
            control: sw(false),
          },
          {
            title: "Computer needs help",
            detail: "When a computer hits a login, OTP or captcha",
            control: sw(true),
          },
          {
            title: "Weekly sell-through report",
            detail: "Sent to owners and admins",
            control: sel(["Monday 8am", "Friday 5pm", "Off"], "Monday 8am"),
          },
        ],
      },
    ],
  },
  { id: "appearance", title: "Appearance", icon: "palette", groups: [] },
  { id: "connectors", title: "Connected tools", icon: "plug", groups: [] },
  {
    id: "computers",
    title: "Computers",
    icon: "monitor",
    action: { label: "New computer", toast: "coral-06 is starting", primary: true },
    groups: [
      {
        title: "Computers",
        rows: [
          {
            title: "Region",
            detail: "Where new computers start",
            control: sel(["Maritime", "Lagos Island", "Abuja"], "Maritime"),
          },
          {
            title: "Sleep after",
            detail: "Idle computers sleep to save agent hours",
            control: sel(["15 minutes", "1 hour", "Never"], "15 minutes"),
          },
          {
            title: "Live window in threads",
            detail: "The small preview while a computer works",
            control: sw(true),
          },
          {
            title: "Pause all computers",
            detail: "Stops every running computer at its next safe step",
            control: { kind: "pauseAll", label: "Pause all" },
          },
        ],
      },
      {
        title: "Saved logins",
        rows: [
          {
            title: "Providus internet banking",
            detail: "Used by computers to read statements",
            control: btn("Edit", "Providus login opened"),
          },
          {
            title: "Paystack secret key",
            detail: "Stored encrypted, never shown in threads",
            control: btn("Rotate", "Paystack key rotation started"),
          },
          {
            title: "WhatsApp Business PIN",
            detail: "Two-step PIN for the Business number",
            control: btn("Edit", "WhatsApp PIN opened"),
          },
        ],
      },
      {
        title: "Access",
        rows: [
          {
            title: "Computers can use secrets",
            detail: "Only during runs you or an admin started",
            control: sw(true),
          },
          { title: "Mask secrets in screenshots", control: sw(true) },
        ],
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    icon: "life-buoy",
    groups: [
      {
        title: "Get help",
        rows: [
          {
            title: "Help centre",
            detail: "Guides for collections, restock and onboarding",
            control: btn("Open", "Opening help"),
          },
          {
            title: "Chat with support",
            detail: "Replies on WhatsApp",
            control: btn("Start chat", "Support chat opened"),
          },
          {
            title: "Report a problem",
            detail: "Sends the last run's logs with your note",
            control: btn("Report", "Report started"),
          },
        ],
      },
    ],
  },
  {
    id: "organization",
    title: "Organization",
    icon: "building-2",
    groups: [
      {
        title: "Details",
        rows: [
          {
            title: "Coral Lane Trading",
            detail: "Distributor · 14 seats",
            control: btn("Edit", "Organization details opened"),
            avatar: "WG",
          },
        ],
      },
      {
        title: "Agent",
        rows: [
          {
            title: "Ask before money moves",
            detail: "Mimi stops for approval before any payment, refund or credit change",
            control: sw(true),
          },
          {
            title: "Default language for shops",
            detail: "Used on WhatsApp unless a shop prefers another",
            control: sel(["English", "Pidgin", "Yoruba", "Hausa", "Igbo"], "Pidgin"),
          },
          {
            title: "Quiet hours",
            detail: "No messages to shops in this window",
            control: sel(["9pm to 7am", "10pm to 6am", "8pm to 8am", "Off"], "9pm to 7am"),
          },
          {
            title: "Daily summary on WhatsApp",
            detail: "Payments, restocks and approvals in one message at 7pm",
            control: sw(true),
          },
        ],
      },
      {
        title: "Input",
        rows: [
          {
            title: "Enter behaviour",
            detail: "What the Enter key does in the composer",
            control: sel(["Send", "Newline"], "Send"),
          },
        ],
      },
    ],
  },
  {
    id: "members",
    title: "Members",
    icon: "users",
    sub: "4 people in Coral Lane Trading",
    action: { label: "Invite", toast: "Invite link copied", primary: true },
    groups: [
      {
        title: "People",
        rows: [
          {
            title: "Tobi Omotade",
            detail: "omotadetobiloba@gmail.com",
            control: { kind: "fixed", label: "Owner", hint: "The owner's role can't be changed" },
            avatar: "TO",
          },
          {
            title: "Adaeze Nwosu",
            detail: "ada@corallane.example",
            control: sel(ROLE, "Admin"),
            avatar: "AN",
          },
          {
            title: "Kunle Bakare",
            detail: "kunle@corallane.example",
            control: sel(ROLE, "Sales rep"),
            avatar: "KB",
          },
          {
            title: "Hauwa Sani",
            detail: "hauwa@corallane.example",
            control: sel(ROLE, "Sales rep"),
            avatar: "HS",
          },
        ],
      },
    ],
  },
  {
    id: "shops",
    title: "Shops access",
    icon: "store",
    sub: "What Mimi does with shops alone, and what waits for you",
    groups: [
      {
        title: "Actions",
        rows: [
          {
            title: "Send payment reminders",
            detail: "Polite WhatsApp nudges, up to 2 a week per shop",
            control: sel(WHO, "Alone"),
          },
          {
            title: "Offer payment plans",
            detail: "Splitting a balance into weekly payments",
            control: sel(WHO, "Ask first"),
          },
          {
            title: "Change credit limits",
            detail: "Raising or lowering a shop's limit",
            control: sel(WHO, "Coral Lane only"),
          },
          {
            title: "Message new shops",
            detail: "First contact with a shop not yet on the ledger",
            control: sel(WHO, "Ask first"),
          },
        ],
      },
    ],
  },
  {
    id: "billing",
    title: "Billing",
    icon: "credit-card",
    groups: [
      {
        title: "Plan",
        rows: [
          {
            title: "Growth · ₦150,000 a month",
            detail: "14 seats · renews 1 Nov",
            control: btn("Change plan", "Plans opened"),
          },
          { title: "Agent hours", detail: "38 of 60 used", control: btn("See usage", undefined, "usage") },
          {
            title: "Payment method",
            detail: "Paystack · card ending 4417",
            control: btn("Update", "Card update opened"),
          },
          {
            title: "Invoices",
            detail: "Last paid 1 Oct · ₦150,000",
            control: btn("View invoices", "Invoices opened"),
          },
        ],
      },
    ],
  },
  { id: "usage", title: "Usage", icon: "gauge", groups: [] },
];

/** Sidebar groups for settings (usage opens from Billing, so it is not listed). */
export const settingsNav: ReadonlyArray<{ title: string; ids: readonly SettingsSectionId[] }> = [
  { title: "Account", ids: ["general", "appearance", "connectors", "computers", "support"] },
  { title: "Workspace (Coral Lane)", ids: ["organization", "members", "shops", "billing"] },
];

export const findSettingsSection = (id: string): SettingsSection | undefined =>
  settingsSections.find((s) => s.id === id);

export const settingsHref = (id: SettingsSectionId): string =>
  id === "general" ? "/console/settings" : `/console/settings/${id}`;
