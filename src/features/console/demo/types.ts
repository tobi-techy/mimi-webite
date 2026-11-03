import type { Automation } from "@/features/console/content/automations";

/** Demo engine types. Everything in the console demo is sample data, run client-side. */

export const helperNames = ["Order", "Collector", "Credit", "Stock", "Brand", "Proof"] as const;
export type HelperName = (typeof helperNames)[number];
/** Who can speak in a thread: a helper, Mimi herself, or the signed-in owner ("me"). */
export type Speaker = HelperName | "Mimi" | "me";

export type Folder = "Collections" | "Orders" | "Credit" | "Brands" | "Stock" | "Proof" | "General";
/** Sidebar state: needs you (orange), running (spinner), done (green), or quiet. */
export type ThreadState = "needs" | "run" | "done" | "idle";

export type Tone = "Firm" | "Soft" | "Skip";
export type Verdict = "verified" | "self" | "fake";

/** One shop line in a decision card (and the plan sheet). */
export type CardRow = {
  label: string;
  amount?: number;
  /** Right-hand note after the amount ("Firm", "9 days"). */
  note?: string;
  tone?: Tone;
  days?: number;
  /** The owner changed this row (shown in orange in docs). */
  edited?: boolean;
  /** Orange note, e.g. "Fake alert". */
  flag?: string;
  /** How sure the figure is (RAI-295): verified (bank or signed), likely, estimated. */
  proof?: ProofLevel;
};

/** How sure a figure is. Credit uses verified only. */
export type ProofLevel = "verified" | "likely" | "estimated";
/** What a card may do on its own: Auto (just does it), Notify (does it, tells you), Approve (asks first), Never (Mimi never does it). */
export type RiskTier = "Auto" | "Notify" | "Approve" | "Never";

export type CardStatus = "needs" | "sending" | "sent" | "declined";

/** A plan or approval card: reminder plan, order draft, credit change, restock, brand draft, flagged payment. */
export type DecisionCard = {
  kind: "plan" | "order" | "credit" | "stock" | "brand" | "flag" | "match" | "zoho" | "limit";
  /** Risk tier label; cards that wait on the owner are Approve. */
  tier?: RiskTier;
  /** Brand emails: the draft itself (stays a draft until the owner taps Send). */
  email?: { to: string; subject: string; body: string };
  /** Shop (or "4 shops") the card is about, for the Needs you pile. */
  shop?: string;
  /** Headline amount; plans and orders fall back to the sum of their live rows. */
  amount?: number;
  /** One short reason, shown in the Needs you pile. */
  why?: string;
  title: string;
  sub: string;
  rows: CardRow[];
  /** Extra lines in the plan sheet (goal, proof list, message preview). */
  goal?: string;
  proof?: { label: string; verdict: Verdict }[];
  message?: { to: string; tone: Tone; text: string };
  primary: string;
  /** "Review" opens the sheet; "Decline" declines. */
  secondary: "Review" | "Decline";
  status: CardStatus;
  sentAt?: string;
  /** Text shown once sent ("Sent to 4 shops on WhatsApp"). */
  doneText: string;
  /** Plain reasons under the title (an order over its limit: why Credit suggests a new one). */
  reasons?: string[];
  /** Button words when Approve / Discard would be vague ("Approve new limit" / "Keep limit"). */
  labels?: { primary: string; secondary: string };
  /** No total line (the title already carries the amount). */
  noTotal?: boolean;
  /** Pill and line once declined ("Limit kept"). */
  declinedText?: string;
  /**
   * What was done can still be taken back (a Zoho record, a new limit): Undo under the done line.
   * `done` once undone (the line then says `text`). `changeId` is a limit change on the API.
   */
  undo?: { state: "ready" | "busy" | "done"; text?: string; changeId?: string };
};

/** The six classic tapbacks; any other reaction is a single emoji (iOS 18 style). */
export const tapbackKeys = ["heart", "like", "dislike", "haha", "bang", "question"] as const;
export type TapbackKey = (typeof tapbackKeys)[number];
/**
 * One person's reaction on a message (one per person, iMessage rules). `by` is "me" (the owner),
 * a helper, Mimi, or a shop's name. `r` is a tapback key or an emoji. `at` animates fresh badges.
 */
export type Reaction = { by: string; r: TapbackKey | string; at?: number };
type Reactable = { reactions?: Reaction[] };

/**
 * An attachment the owner sent from the console (demo build): while it uploads, while its turn is
 * sent, or after either failed (the bubble offers Retry). Absent once the API has it.
 */
export type Upload = {
  state: "uploading" | "sending" | "failed";
  progress: number;
  error?: string;
  /** The API refused the file itself (its type or size): trying again would not help, so it offers Remove. */
  final?: boolean;
};
/**
 * Where a voice note's sound comes from: a reply read aloud (`voice`) or an attachment the owner
 * sent (`media`), both fetched with the bearer in a header; or a recording still in this tab.
 */
export type VoiceAudio = { from: "voice" | "media"; id: string } | { from: "local"; url: string };
/** Demo build: an attachment's API message id ("in:console-…"), its upload state, its bytes on the API. */
type Sent = { apiId?: string; upload?: Upload; remote?: string };

export type Message =
  | { id: string; kind: "date"; label: string }
  | ({
      id: string;
      kind: "text";
      from: Speaker;
      text: string;
      at: number;
      read?: boolean;
      /** Sent while the helper was mid-task: waits for the current task ("Queued, after current task"). */
      queued?: boolean;
      /** Live demo: the API turn this message belongs to (routes it to the right helper's chat). */
      turn?: string;
      /** The chat it was typed in, while the API has not filed it under a turn yet. */
      to?: Worker;
    } & Reactable)
  | ({
      id: string;
      kind: "proof";
      from: Speaker;
      at: number;
      title: string;
      meta: string;
      amount: number;
      stamp: string;
      foot: string;
      footSub: string;
      verdict: Verdict;
      /** The verdict in other plain words ("Likely", "Confirmed by bank"). */
      verdictLabel?: string;
    } & Reactable)
  | ({ id: string; kind: "photos"; from: Speaker; at: number; label: string; photos: string[]; open?: boolean } & Sent & Reactable)
  | ({
      id: string;
      kind: "poll";
      from: Speaker;
      at: number;
      question: string;
      options: string[];
      voted?: number;
      /** What the helper says after the vote ({choice} is replaced). */
      reply?: string;
    } & Reactable)
  | ({ id: string; kind: "voice"; from: Speaker; at: number; seconds: number; caption: string; transcript?: string; audio?: VoiceAudio } & Sent & Reactable)
  /** A document the owner attached (an invoice PDF). `local` is a blob: URL while the tab keeps it. */
  | ({ id: string; kind: "file"; from: Speaker; at: number; name: string; mime: string; size: number; local?: string } & Sent)
  | ({ id: string; kind: "card"; from: Speaker; at: number; card: DecisionCard; turn?: string } & Reactable)
  /**
   * A helper needs the owner's answer (a question, or a paused job asking to go on). It shows in
   * the helper's own chat and, as "Needs you", in Mimi's. Answered in either place, both show it.
   */
  | {
      id: string;
      kind: "ask";
      from: HelperName;
      at: number;
      question: string;
      /** Buttons; each sends its `text`. Without options the owner types an answer. */
      options?: { label: string; text: string }[];
      answered?: AskAnswer;
      turn?: string;
    }
  | { id: string; kind: "doc"; from: Speaker; at: number; docId: string; title: string; sub: string }
  | { id: string; kind: "computer"; from: Speaker; at: number; title: string; sub: string }
  /** A system event, centred and grey: "Created routine: morning chase", "Handed to Credit". */
  | { id: string; kind: "event"; text: string; at: number; /** A send the API refused (the demo allowance): reads as a stop, not a quiet aside. */ tone?: "stop" }
  /** A helper work step shown as a muted activity line ("Checked GTBank statement · 2 matches"). */
  | { id: string; kind: "system"; text: string; at: number; icon?: ActivityIcon; /** API turn this line belongs to (shop tasks). */ turn?: string }
  /**
   * A helper's reasoning: while `live` a shimmering "Thinking…" that streams the text; then a
   * collapsed "Thought for 4s" line that opens to the reasoning in muted markdown.
   */
  | { id: string; kind: "thought"; from: Worker; at: number; text: string; secs?: number; live?: boolean; open?: boolean }
  /** One stage of a helper's work: a tool step, a group, a handoff, an approval gate, an error or a retry. */
  | {
      id: string;
      kind: "step";
      from: Worker;
      at: number;
      variant: StepVariant;
      icon?: ActivityIcon;
      text: string;
      state: WorkState;
      /** Short mono note after the text ("38 credits", "8.0s"). */
      meta?: string;
      /** The tool the step used ("GTBank", "WhatsApp"); falls back to one named by the icon. */
      tool?: string;
      /** How long it took ("1.2s"), from the run trace. */
      took?: string;
      /** What the step cost in naira (model + tool), from the run trace. */
      cost?: number;
      /** What opens under the step: inputs/outputs, a mini table or the grouped list. */
      detail?: WorkDetail;
      /** Handoffs: the helper asked. */
      to?: HelperName;
      /** Gates: the decision card message this waits on. */
      link?: string;
      /** Live demo: the API turn, and how the helper was picked ("assign" = the owner wrote in her chat). */
      turn?: string;
      via?: string;
      /** Handoffs, in the helper's chat: who handed it over (the line points back there). */
      peer?: Worker;
      /** Handoffs, in the chat that handed it over: one line on how it went. */
      result?: string;
    }
  /**
   * A structured helper answer (Claude/Factory style): "Worked for 34s" that folds the work lines,
   * a one-sentence plain answer, then blocks: stat cards, a data table, highlights, deliverables.
   */
  | {
      id: string;
      kind: "answer";
      from: Worker;
      at: number;
      turn?: string;
      worked?: { secs: number; work?: WorkLine[] };
      blocks: AnswerBlock[];
      /** What each numbered citation badge ([^n] in the copy) points at. */
      cites?: Record<number, Source>;
    };

/** How an ask was answered: in Mimi's chat (she passed it on) or in the helper's own. */
export type AskAnswer = { text: string; at: number; via: "mimi" | "helper" };

/** A work line folded under "Worked for Ns": the same reasoning and step lines the feed shows. */
export type WorkLine = Extract<Message, { kind: "thought" | "step" }>;

/* ---------- answer blocks ---------- */

/**
 * An inline entity chip in copy: `[[shop:Joy Provisions]]`, `[[route:Ikeja route]]`,
 * `[[helper:Proof]]`, `[[brand:Hypo]]`, `[[bank:GTBank]]`, `[[file:credit-rules.md]]`.
 */
export type EntityKind = "shop" | "route" | "helper" | "brand" | "bank" | "file";
export type Entity = { kind: EntityKind; label: string };

/** Where a fact came from: a file, a sheet, a doc, a PDF, a tool, the bank or a WhatsApp chat. */
export type SourceKind = "file" | "sheet" | "doc" | "pdf" | "tool" | "bank" | "whatsapp";
export type Source = { kind: SourceKind; name: string; docId?: string };

/** bad: orange delta and marks · good / flat: muted. */
export type StatTone = "bad" | "good" | "flat";
export type StatItem = {
  label: string;
  value: string;
  /** Mono delta after the number ("−₦374,000", "+2%"). */
  delta?: string;
  tone?: StatTone;
  /** Rounded-bar sparkline values (any scale). */
  spark?: number[];
  /** Bars from this index on are marked (orange on bad cards): where the drop starts. */
  markFrom?: number;
  /** Mono caption under the sparkline ("Mon 12 → Fri 23"). */
  caption?: string;
};

export type TableCell =
  | string
  | { entity: Entity; href?: string }
  | { score: number }
  | { money: number; tone?: StatTone }
  | { link: string; href?: string; docId?: string }
  /** v2: a status pill (icon + tint), e.g. Overdue · 33 days. */
  | { status: CellStatus; text?: string };
/** Status keys a table cell can show (matches ui/StatusPill). */
export type CellStatus = "paid" | "verified" | "partial" | "overdue" | "failed" | "fake" | "awaiting" | "queued" | "upcoming" | "self" | "sent" | "skipped" | "running";
export type TableColumn = { label: string; align?: "left" | "right" };

export type DeliverableType = "Sheet" | "Doc" | "PDF";
export type Deliverable = { title: string; type: DeliverableType; docId?: string };

export type HighlightItem = { text: string; cite?: number[]; sources?: Source[] };

export type AnswerBlock =
  /** Plain answer copy: `**bold**`, `==orange==`, entity chips and `[^n]` citations inline. */
  | { type: "text"; text: string; lead?: boolean }
  | { type: "stats"; items: StatItem[] }
  | { type: "table"; columns: TableColumn[]; rows: TableCell[][]; files?: Source[]; label?: string }
  | { type: "highlights"; title?: string; items: HighlightItem[] }
  /** Preview cards and/or a compact row list with a "Show all" expander after `visible` rows. */
  | { type: "deliverables"; title?: string; cards?: Deliverable[]; rows?: Deliverable[]; visible?: number };

/** Who does the work in a thread (never the owner). */
export type Worker = HelperName | "Mimi";
export type StepVariant = "tool" | "group" | "handoff" | "gate" | "error" | "retry";
/** run: spinner · done: check · failed: red · wait: waiting on the owner (orange mark). */
export type WorkState = "run" | "done" | "failed" | "wait";
export type WorkDetail =
  | { type: "kv"; rows: [string, string][] }
  | { type: "code"; label?: string; text: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "list"; items: { icon?: ActivityIcon; text: string; meta?: string }[] };

/** The thread's live checklist, pinned above the composer ("Step 3 of 6"). */
export type PlanItemState = "done" | "run" | "wait" | "todo" | "failed";
export type WorkPlan = { title: string; items: { label: string; state: PlanItemState }[] };

/** Icons an activity line or work step can carry (a subset of the console icon set). */
export type ActivityIcon =
  | "search"
  | "monitor"
  | "file-text"
  | "check"
  | "list-checks"
  | "refresh-cw"
  | "receipt"
  | "send"
  | "book-text"
  | "store"
  | "landmark"
  | "package"
  | "bar-chart"
  | "message-square"
  | "users"
  | "hand"
  | "shield-check"
  | "pen"
  | "folder"
  | "circle-x"
  | "sheet"
  | "map-pin"
  | "truck";

export type MessageKind = Message["kind"];
/** Messages that take reactions: bubbles, photos, voice notes and bubble-like cards (not chips, dates or system lines). */
export const reactableKinds = ["text", "proof", "photos", "poll", "voice", "card"] as const;
export type ReactableMessage = Extract<Message, { kind: (typeof reactableKinds)[number] }>;

/** A reply chip: tapping it types `text` (or the label) into the composer, sends it and runs `step`. */
export type Reply = {
  label: string;
  text?: string;
  step: string;
  /** Live demo (handoffs contract): the helper a chip's ask goes to (`assign_to`). */
  assign?: string;
  /** Live demo: a chip that opens a page instead of asking (`shop:<id>`, `order:<id>`, `approvals`). */
  open?: string;
};

export type Conversation = {
  slug: string;
  title: string;
  helper: HelperName | "Mimi";
  folder: Folder;
  code: string;
  state: ThreadState;
  /** Mono status line under the helper's name ("checking Joy's POS payment"). */
  status: string;
  /** Spinner next to the status line. */
  working: boolean;
  /** Sidebar age ("2m"), or a clock time for new threads. */
  ago: string;
  /** Created in this demo session (lives at /console/threads/new?id=). */
  created?: boolean;
  /** One-line preview for home lists. */
  preview: string;
  /** Reply chips offered under the newest helper message (the scripted, film-safe path). */
  replies?: Reply[];
  /** What a finished task proves ("Paid · 3 of 3 witnesses"); done without it reads "Check needed". */
  proof?: string;
  /** Live checklist pinned above the composer while the helper works through a job. */
  plan?: WorkPlan;
  messages: Message[];
  /** Set on threads that come from the MIMI-AGENT API (demo build); absent on sample threads. */
  api?: { threadId: string; kind: string; shopId: string; shopName: string };
};

/** File type label in the docs list (mono). */
export type DocKind = "PDF" | "MD" | "IMG" | "CSV" | "TXT" | "DOCX";
/**
 * What the viewer renders. Plans and reports are Markdown generated from live rows (so plan edits
 * show up); pdf/image/file point at public/console-demo; csv/text/markdown carry their text.
 */
export type DocBody =
  | { type: "invoice" }
  | { type: "plan"; rows: CardRow[]; total: number }
  | { type: "report"; rows: { area: string; cartons: number; change: string }[] }
  | { type: "markdown"; text: string }
  | { type: "pdf"; src: string }
  | { type: "image"; src: string }
  | { type: "csv"; text: string }
  | { type: "text"; text: string }
  | { type: "file"; src: string; name: string };

export type DocVersion = { v: number; by: HelperName | "you"; at: string; note: string };

export type Doc = {
  id: string;
  title: string;
  kind: DocKind;
  by: HelperName | "you";
  at: string;
  thread?: string;
  body: DocBody;
  /** The owner's note on the doc (editable; edits are highlighted). */
  note: string;
  noteEdited?: boolean;
  versions: DocVersion[];
};

export type StepState = "done" | "run" | "todo";
export type Step = { label: string; detail?: string; at: string; state: StepState };
export type StatementRow = { date: string; narration: string; credit: string; mark?: "hl" | "ok" | "fake"; isNew?: boolean };

export type ComputerStatus = "idle" | "live" | "paused" | "user" | "done";
export type ComputerState = {
  helper: HelperName;
  status: ComputerStatus;
  /** Short mono line: "reading GTB statement". */
  activity: string;
  url: string;
  rows: StatementRow[];
  steps: Step[];
  /** Cursor tag over the screen. */
  tag?: string;
  /** Row index the cursor points at. */
  cursorRow?: number;
};

export type SideMessage = { id: string; from: "me" | "Mimi"; text: string; quote?: string; at: number };

export type DocFilter = "All" | "By helpers" | "By you" | "This thread";
export type PanelTab = "Computer" | "Side chat" | "Docs" | "Launcher";

export type DemoState = {
  version: number;
  conversations: Conversation[];
  docs: Doc[];
  computer: ComputerState;
  side: SideMessage[];
  panel: { open: boolean; tab: PanelTab; full: boolean; docId?: string; filter?: DocFilter };
  /** Who is typing, and where. */
  typing: { slug: string; who: Speaker } | null;
  sideTyping: boolean;
  /** Plan sheet open on this card message. */
  sheet: { slug: string; messageId: string } | null;
  /** Composer text the guided demo is typing. */
  draft: { slug: string; text: string } | null;
  /** The guided demo is playing. */
  playing: boolean;
  /** The thread on screen (sidebar highlight). Not meaningful after reload. */
  active?: string;
  counter: number;
  automations: Record<string, boolean>;
  /** Every automation (seeded and made in this session) with its run history. */
  autos: Automation[];
};
