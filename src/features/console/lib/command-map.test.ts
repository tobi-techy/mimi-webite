/**
 * Command's mapper: the documented payloads (api/command-contract.ts) into what the screens read. The
 * tests hold the two things that would otherwise reach a person: a machine id shown as a name, and a
 * value this console does not know being guessed instead of dropped.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { ApiCommandBundle } from "../api/command-contract.ts";
import { assembleCommand, mapUserRole } from "./command-map.ts";

const bundle = (o: Partial<ApiCommandBundle> = {}): ApiCommandBundle => ({
  me: {
    user: { user_id: "u_tola", name: "Tola Adeyemi", role: "supervisor", status: "active" },
    channels: [{ channel_id: "ch_a", kind: "territory", slug: "a", name: "Surulere", topic: "", default_owner_user_id: "u_tola", unread: 2, open_items: 3 }],
  },
  users: [{ user_id: "u_bisi", name: "Bisi Lawal", role: "rep", status: "active" }],
  names: { u_bisi: "Bisi Lawal", mimi: "Mimi" },
  channels: [
    { channel_id: "ch_a", kind: "territory", slug: "a", name: "Surulere", topic: "", default_owner_user_id: "u_tola", unread: 0, open_items: 0 },
    { channel_id: "ch_b", kind: "territory", slug: "b", name: "Ikeja", topic: "", default_owner_user_id: "u_kunle", unread: 9, open_items: 9 },
  ],
  messages: [],
  items: [],
  digest: { for_user_id: "u_tola", generated_at: "2026-11-10T07:30:00+01:00", lines: ["Good morning."] },
  as_of: "2026-11-10T08:00:00+01:00",
  ...o,
});

test("the caller's membership comes from /v1/me, so a channel they are not in stays in the record but out of the rail", () => {
  const data = assembleCommand(bundle());
  assert.equal(data.actor.kind, "user");
  assert.equal(data.actor.role, "supervisor");
  assert.deepEqual(data.actor.channelIds, ["ch_a"]);
  assert.deepEqual(data.actor.repIds, ["u_bisi"]);
  /* both channels are read, and the caller's own counts are overlaid from /v1/me */
  assert.deepEqual(data.channels.map((c) => c.id), ["ch_a", "ch_b"]);
  assert.equal(data.channels[0]!.unread, 2);
  assert.equal(data.channels[0]!.openItems, 3);
  assert.equal(data.channels[1]!.unread, 9);
  assert.equal(data.asOf, "2026-11-10T08:00:00+01:00");
});

test("an item never shows a machine id: the owner becomes a name, and an unknown owner a neutral word", () => {
  const data = assembleCommand(
    bundle({
      items: [
        {
          item_id: "it_1",
          channel_id: "ch_a",
          kind: "finding",
          state: "assigned",
          severity: "normal",
          title: "A finding",
          body: "",
          subject: {},
          owner_user_id: "u_bisi",
          created_by_kind: "agent",
          created_by_ref: "mimi",
          source: "",
          due_at: "",
          sla_minutes: 0,
          created_at: "2026-11-10T06:00:00+01:00",
          updated_at: "",
          closed_at: "",
          closed_by_user_id: "",
          closed_reason: "",
        },
        {
          item_id: "it_2",
          channel_id: "ch_a",
          kind: "finding",
          state: "closed",
          severity: "normal",
          title: "Another",
          body: "",
          subject: {},
          owner_user_id: "u_unknown",
          created_by_kind: "agent",
          created_by_ref: "mimi",
          source: "",
          due_at: "",
          sla_minutes: 0,
          created_at: "",
          updated_at: "",
          closed_at: "",
          closed_by_user_id: "u_unknown",
          closed_reason: "done",
        },
      ],
    }),
  );
  assert.equal(data.items[0]!.ownerName, "Bisi Lawal");
  assert.equal(data.items[0]!.closedReason, "", "an open item carries no close reason");
  assert.equal(data.items[1]!.ownerName, "Someone", "an unknown owner is words, never the id");
  assert.equal(data.items[1]!.closedByName, "Someone");
  assert.equal(data.items[1]!.closedReason, "done");
});

test("a message that carries an item gets the card, and a model message keeps its cost", () => {
  const data = assembleCommand(
    bundle({
      items: [
        {
          item_id: "it_1",
          channel_id: "ch_a",
          kind: "approval",
          state: "assigned",
          severity: "high",
          title: "A payment",
          body: "",
          subject: {},
          owner_user_id: "u_bisi",
          created_by_kind: "agent",
          created_by_ref: "mimi",
          source: "",
          due_at: "",
          sla_minutes: 0,
          created_at: "",
          updated_at: "",
          closed_at: "",
          closed_by_user_id: "",
          closed_reason: "",
        },
      ],
      messages: [
        {
          message_id: "cm_1",
          channel_id: "ch_a",
          author_kind: "agent",
          author_ref: "mimi",
          text: "This one needs a yes.",
          item_id: "it_1",
          reply_to: null,
          source_thread_id: null,
          provenance: { deterministic: false, model: "Muse Spark", tool: null, evidence: [], cost_kobo: 4200 },
          created_at: "2026-11-10T06:00:00+01:00",
        },
      ],
    }),
  );
  assert.equal(data.messages[0]!.authorName, "Mimi");
  assert.equal(data.messages[0]!.item?.id, "it_1");
  assert.equal(data.messages[0]!.provenance.costKobo, 4200);
  assert.equal(data.messages[0]!.provenance.deterministic, false);
});

test("a value this console does not know is dropped to a safe default, never guessed", () => {
  const data = assembleCommand(
    bundle({
      items: [
        {
          item_id: "it_1",
          channel_id: "ch_a",
          kind: "mystery" as unknown as "task",
          state: "what" as unknown as "flagged",
          severity: "urgent" as unknown as "normal",
          title: "T",
          body: "",
          subject: {},
          owner_user_id: "",
          created_by_kind: "agent",
          created_by_ref: "mimi",
          source: "",
          due_at: "",
          sla_minutes: 0,
          created_at: "",
          updated_at: "",
          closed_at: "",
          closed_by_user_id: "",
          closed_reason: "",
        },
      ],
    }),
  );
  assert.equal(data.items[0]!.kind, "task");
  assert.equal(data.items[0]!.state, "flagged");
  assert.equal(data.items[0]!.severity, "normal");
});

test("brand_viewer is deferred; if one appears it reads with the least privilege", () => {
  assert.equal(mapUserRole("brand_viewer"), "rep");
  assert.equal(mapUserRole("owner"), "owner");
  assert.equal(mapUserRole("supervisor"), "supervisor");
});
