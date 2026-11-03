import assert from "node:assert/strict";
import { test } from "node:test";
import { hideTourEcho } from "./tour-echo.ts";

const msgs = [
  { id: "d1", kind: "date" },
  { id: "api-m:old", kind: "text", from: "Mimi" },
  { id: "api-m:brief", kind: "text", from: "Mimi" },
  { id: "apr:a1", kind: "card", from: "Mimi" },
  { id: "api-m:recorded", kind: "text", from: "Mimi" },
  { id: "api-m:in:mine", kind: "text", from: "me" },
];

test("while the tour plays, only the owner thread from before it started shows", () => {
  const out = hideTourEcho(msgs, { active: true, baseline: new Set(["api-m:old"]), approvals: new Set(["a1"]) });
  assert.deepEqual(
    out.map((m) => m.id),
    ["d1", "api-m:old", "api-m:in:mine"],
  );
});

test("the tour's own Zoho card never shows twice, even once the tour has finished", () => {
  const out = hideTourEcho(msgs, { active: false, baseline: new Set(["api-m:old"]), approvals: new Set(["a1"]) });
  assert.deepEqual(
    out.map((m) => m.id),
    ["d1", "api-m:old", "api-m:brief", "api-m:recorded", "api-m:in:mine"],
  );
});

test("a card for an approval the tour does not own still shows after the tour", () => {
  const out = hideTourEcho([{ id: "apr:other", kind: "card" }], { active: false, baseline: null, approvals: new Set(["a1"]) });
  assert.equal(out.length, 1);
});

test("with no baseline read yet, every owner message is new while the tour plays", () => {
  const out = hideTourEcho(msgs, { active: true, baseline: null, approvals: new Set() });
  assert.deepEqual(
    out.map((m) => m.id),
    ["d1", "api-m:in:mine"],
  );
});
