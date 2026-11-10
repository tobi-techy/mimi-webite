/**
 * Command's rules (docs/PHASE1-COMMAND.md sections 5 to 7). These tests are the acceptance bar the
 * workstream set: a supervisor sees only their territories, a rep sees only their own items, and a
 * money item offers no Close on an agent's path (nor a rep's). The rest hold the state machine and
 * the wording, because a wrong word here is a wrong claim about money or about who owns a task.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Channel, CommandActor, Item, Provenance } from "../content/command.ts";
import {
  availableItemActions,
  digestLines,
  dueWords,
  groupChannels,
  isOverdue,
  mayActionItem,
  mayCloseItem,
  needsYou,
  provenanceWords,
  seesItem,
  visibleChannels,
  visibleItems,
} from "./command-rules.ts";

const NOW = Date.parse("2026-11-10T09:00:00+01:00");

const channel = (id: string, kind: Channel["kind"], name: string): Channel => ({
  id,
  kind,
  slug: id.replace(/^ch_/, ""),
  name,
  topic: "",
  unread: 0,
  openItems: 0,
  defaultOwnerUserId: "",
});

const item = (o: Partial<Item> = {}): Item => ({
  id: "it_1",
  channelId: "ch_a",
  kind: "finding",
  state: "assigned",
  severity: "normal",
  title: "A finding",
  body: "",
  subject: { shopId: "", relationshipId: "", approvalId: "", routineId: "", deliveryId: "" },
  ownerUserId: "u_rep",
  ownerName: "Bisi Lawal",
  createdByKind: "agent",
  createdByRef: "mimi",
  source: "",
  dueAt: "",
  slaMinutes: 0,
  createdAt: "2026-11-10T06:00:00+01:00",
  updatedAt: "",
  closedAt: "",
  closedByUserId: "",
  closedByName: "",
  closedReason: "",
  ...o,
});

const owner: CommandActor = { kind: "user", id: "u_ada", name: "Ada Okafor", role: "owner", channelIds: [], repIds: [] };
const supervisor = (id: string, channelIds: string[], repIds: string[] = []): CommandActor => ({
  kind: "user",
  id,
  name: "Tola Adeyemi",
  role: "supervisor",
  channelIds,
  repIds,
});
const rep = (id: string, channelIds: string[] = []): CommandActor => ({ kind: "user", id, name: "Bisi Lawal", role: "rep", channelIds, repIds: [] });
const agent = (channelIds: string[] = []): CommandActor => ({ kind: "agent", id: "mimi", name: "Mimi", channelIds });

const channels = [
  channel("ch_surulere", "territory", "Surulere"),
  channel("ch_ikeja", "territory", "Ikeja"),
  channel("ch_credit", "credit", "Credit watch"),
];

/* ---- acceptance 1: a supervisor sees only their territories ---- */

test("a supervisor sees only their territories, and a channel they are not in is not visible at all", () => {
  const tol = supervisor("u_tola", ["ch_surulere", "ch_credit"], ["u_rep"]);
  const shown = visibleChannels(tol, channels).map((c) => c.id);
  assert.deepEqual(shown, ["ch_surulere", "ch_credit"]);
  assert.ok(!shown.includes("ch_ikeja"), "the other supervisor's territory is not drawn");

  const groups = groupChannels(tol, channels);
  assert.deepEqual(
    groups.map((g) => g.label),
    ["Territories", "Credit watch"],
  );
  assert.deepEqual(groups[0]!.channels.map((c) => c.id), ["ch_surulere"]);
});

test("a supervisor's items stop at their territory, and an owner sees everything", () => {
  const tol = supervisor("u_tola", ["ch_surulere"], ["u_rep"]);
  const here = item({ id: "it_a", channelId: "ch_surulere", ownerUserId: "u_rep" });
  const away = item({ id: "it_b", channelId: "ch_ikeja", ownerUserId: "u_other" });
  assert.deepEqual(visibleItems(tol, [here, away]).map((i) => i.id), ["it_a"]);
  assert.equal(seesItem(tol, away), false);
  assert.deepEqual(visibleItems(owner, [here, away]).map((i) => i.id), ["it_a", "it_b"]);
});

/* ---- acceptance 2: a rep sees only their own items ---- */

test("a rep sees only the items assigned to them, even inside a channel they belong to", () => {
  const bisi = rep("u_bisi", ["ch_surulere"]);
  const mine = item({ id: "it_mine", channelId: "ch_surulere", ownerUserId: "u_bisi" });
  const colleague = item({ id: "it_theirs", channelId: "ch_surulere", ownerUserId: "u_chidi" });
  const unowned = item({ id: "it_none", channelId: "ch_surulere", ownerUserId: "" });
  assert.deepEqual(visibleItems(bisi, [mine, colleague, unowned]).map((i) => i.id), ["it_mine"]);
  assert.equal(seesItem(bisi, colleague), false, "the same channel does not make a colleague's item visible");
  assert.equal(seesItem(bisi, unowned), false, "nor does an unowned one");
});

/* ---- acceptance 3: a money item offers no Close on an agent's path (nor a rep's) ---- */

test("a money item offers no Close to an agent, and none to a rep", () => {
  const money = item({ id: "it_money", channelId: "ch_credit", kind: "approval", state: "actioned", ownerUserId: "u_bisi", severity: "high" });
  for (const a of [agent(["ch_credit"]), rep("u_bisi", ["ch_credit"])]) {
    const keys = availableItemActions(money, a).map((x) => x.key);
    assert.ok(!keys.includes("close"), `no Close for ${a.kind === "agent" ? "an agent" : "a rep"}`);
    assert.ok(!keys.includes("drop"), "and no way around it by dropping it");
  }
  /* the same card, in a supervisor's hands for one of their own reps: Approve is the close */
  const tol = supervisor("u_tola", ["ch_credit"], ["u_bisi"]);
  const keys = availableItemActions(money, tol).map((x) => x.key);
  assert.deepEqual(keys, ["approve"], "a supervisor approves for their own rep, and only that");
  /* the owner may close it directly */
  assert.ok(availableItemActions(money, owner).some((x) => x.key === "close"));
});

test("a supervisor cannot approve a money item for a rep who is not theirs", () => {
  const tol = supervisor("u_tola", ["ch_credit"], ["u_bisi"]);
  const otherRep = item({ id: "it_x", channelId: "ch_credit", kind: "approval", state: "assigned", ownerUserId: "u_chidi" });
  assert.equal(availableItemActions(otherRep, tol).some((x) => x.key === "approve"), false);
  assert.equal(mayCloseItem(tol, { ...otherRep, state: "actioned" }), false);
});

test("a money item's next step is a decision, never a bare Mark done", () => {
  const mine = item({ id: "it_ap", channelId: "ch_credit", kind: "approval", state: "assigned", ownerUserId: "u_bisi" });
  const tol = supervisor("u_tola", ["ch_credit"], ["u_bisi"]);
  assert.deepEqual(availableItemActions(mine, tol).map((x) => x.key), ["approve", "drop"], "Approve and Not now, as the approval card always has");
  /* even the owner, who may close it later, is not offered Mark done on a money item */
  assert.deepEqual(availableItemActions(mine, owner).map((x) => x.key), ["drop"]);
});

/* ---- the state machine ---- */

test("an item cannot be worked on without an owner", () => {
  const unowned = item({ state: "assigned", ownerUserId: "" });
  assert.equal(mayActionItem(owner, unowned), false);
  assert.equal(availableItemActions(unowned, owner).some((x) => x.key === "action"), false);
  assert.equal(mayActionItem(owner, { ...unowned, ownerUserId: "u_rep" }), true);
});

test("the permitted actions follow the state: assign while flagged, work while assigned, close once actioned", () => {
  assert.deepEqual(availableItemActions(item({ state: "flagged" }), owner).map((x) => x.key), ["assign", "drop"]);
  assert.deepEqual(availableItemActions(item({ state: "assigned" }), owner).map((x) => x.key), ["action", "drop"]);
  assert.deepEqual(availableItemActions(item({ state: "actioned" }), owner).map((x) => x.key), ["close"]);
  assert.deepEqual(availableItemActions(item({ state: "closed" }), owner).map((x) => x.key), []);
  assert.deepEqual(availableItemActions(item({ state: "dropped" }), owner).map((x) => x.key), []);
});

test("a non-money item may be closed by whoever is over it, agent included", () => {
  const done = item({ state: "actioned", kind: "finding" });
  assert.ok(availableItemActions(done, agent(["ch_a"])).some((x) => x.key === "close"));
});

/* ---- the pile and its order ---- */

test("needs you holds the caller's items, overdue first", () => {
  const tol = supervisor("u_tola", ["ch_a"], []);
  const soon = item({ id: "it_soon", ownerUserId: "u_tola", dueAt: "2026-11-10T15:00:00+01:00" });
  const late = item({ id: "it_late", ownerUserId: "u_tola", dueAt: "2026-11-10T06:00:00+01:00" });
  const notMine = item({ id: "it_x", ownerUserId: "u_other" });
  assert.deepEqual(needsYou(tol, [soon, late, notMine], NOW).map((i) => i.id), ["it_late", "it_soon"]);
  assert.equal(isOverdue(late, NOW), true);
  assert.equal(dueWords(late, NOW), "Overdue by 3 h");
  assert.equal(dueWords(soon, NOW), "Due in 6 h");
  assert.equal(dueWords(item({ state: "closed", dueAt: "2026-11-10T06:00:00+01:00" }), NOW), "");
});

test("a supervisor's pile includes the money items awaiting their sign-off for their own reps", () => {
  const tol = supervisor("u_tola", ["ch_credit"], ["u_bisi"]);
  const approving = item({ id: "it_ap", channelId: "ch_credit", kind: "approval", state: "assigned", ownerUserId: "u_bisi" });
  const othersApproval = item({ id: "it_ap2", channelId: "ch_credit", kind: "approval", state: "assigned", ownerUserId: "u_chidi" });
  assert.deepEqual(needsYou(tol, [approving, othersApproval], NOW).map((i) => i.id), ["it_ap"]);
});

/* ---- how a message says it was written ---- */

test("a deterministic message says so, and a model-written one shows what it cost", () => {
  const code: Provenance = { deterministic: true, model: "", tool: "", evidence: ["item:a", "item:b"], costKobo: 0 };
  assert.deepEqual(provenanceWords(code), { label: "Written by code", detail: "2 records checked" });
  const model: Provenance = { deterministic: false, model: "Muse Spark", tool: "", evidence: [], costKobo: 4200 };
  assert.deepEqual(provenanceWords(model), { label: "Muse Spark", detail: "₦42.00 spent" });
  const unexplained: Provenance = { deterministic: false, model: "", tool: "", evidence: [], costKobo: 0 };
  assert.equal(provenanceWords(unexplained).detail, "not explained by the API", "a model message with no model or cost is not papered over");
});

/* ---- the digest is built from records, in code ---- */

test("the digest counts what needs the caller, names what closed and who closed it, and flags what slipped", () => {
  const tol = supervisor("u_tola", ["ch_a", "ch_b"], ["u_rep"]);
  const needs = item({ id: "it_n", channelId: "ch_a", ownerUserId: "u_tola", dueAt: "2026-11-10T07:00:00+01:00" });
  const closed = item({
    id: "it_c",
    channelId: "ch_a",
    ownerUserId: "u_rep",
    state: "closed",
    closedAt: "2026-11-09T18:00:00+01:00",
    closedByName: "Tola Adeyemi",
    closedReason: "done",
    title: "Take the price list to Yaba Mart",
  });
  const slipped = item({ id: "it_s", channelId: "ch_b", ownerUserId: "u_rep", dueAt: "2026-11-10T06:00:00+01:00", title: "Ikeja Stores was not visited" });
  const lines = digestLines({ actor: tol, items: [needs, closed, slipped], sinceIso: "2026-11-09T07:30:00+01:00", now: NOW });
  assert.match(lines[0]!, /1 item needs you today, 1 of them overdue/);
  assert.match(lines.join("\n"), /Take the price list to Yaba Mart \(Tola Adeyemi\)/);
  assert.match(lines.join("\n"), /Slipped and escalating/);
  assert.ok(!lines.join("").includes("—"), "no em dash reaches a person");
});

test("a quiet digest says so plainly rather than inventing a line", () => {
  const lines = digestLines({ actor: owner, items: [], sinceIso: "2026-11-09T07:30:00+01:00", now: NOW });
  assert.equal(lines.length, 2);
  assert.match(lines[0]!, /Nothing is waiting on you today/);
  assert.equal(lines[1], "Nothing has come in yet.");
});
