import assert from "node:assert/strict";
import { test } from "node:test";
import {
  chatterRuns,
  finishLine,
  joinNames,
  liveWork,
  splitLongReplies,
  splitReply,
  statusLine,
  stepLine,
  taskState,
  timeLabel,
  typingMs,
  updatedBy,
  visibleMessages,
} from "./thread-view.ts";

const feed = [
  { kind: "text", from: "me", text: "chase joy" },
  { kind: "thought", from: "Collector", live: false, text: "..." },
  { kind: "step", from: "Collector", state: "done", text: "Read the book" },
  { kind: "card", from: "Collector" },
  { kind: "step", from: "Collector", state: "run", text: "Checking **Ikeja** payments" },
];

test("the work trail hides unless showWork is on; cards and bubbles stay", () => {
  assert.deepEqual(
    visibleMessages(feed, false).map((m) => m.kind),
    ["text", "card"],
  );
  assert.equal(visibleMessages(feed, true).length, feed.length);
});

test("live work drives the dots and the header status line", () => {
  assert.deepEqual(liveWork(feed), { who: "Collector", doing: "Checking Ikeja payments" });
  assert.equal(statusLine(liveWork(feed), "Idle"), "Checking Ikeja payments…");
  assert.equal(liveWork([{ kind: "thought", from: "Mimi", live: true }])?.doing, "Thinking");
  assert.equal(liveWork(feed.slice(0, 4)), null);
  assert.equal(statusLine(null, "Collections"), "Collections");
});

test("long replies split into 2-3 short bubbles at sentence ends", () => {
  const long =
    "Kola Mart's alert said ₦120,000 landed at 16:05 yesterday. GTB shows nothing, so it's fake. They stay on Firm and their next order is on hold until the money lands in your account.";
  const parts = splitReply(long);
  assert.ok(parts.length >= 2 && parts.length <= 3, String(parts.length));
  assert.equal(parts.join(" "), long);
  for (const p of parts) assert.match(p, /[.!?]$/);
  assert.deepEqual(splitReply("Done. Sent to Joy."), ["Done. Sent to Joy."]);
  assert.equal(
    splitReply(
      "Line one is here.\nLine two is here and it is long enough to pass the limit for sure, really it is quite long indeed.",
    ).length,
    1,
  );
  const huge = Array.from({ length: 12 }, (_, i) => `Sentence number ${i} says a little more here.`).join(
    " ",
  );
  assert.ok(splitReply(huge).length <= 3);
});

test("message time reads like iMessage", () => {
  const now = new Date(2026, 9, 29, 21, 0).getTime();
  assert.match(timeLabel(new Date(2026, 9, 29, 9, 41).getTime(), now), /^Today 9:41\sAM$/);
  assert.match(timeLabel(new Date(2026, 9, 28, 16, 5).getTime(), now), /^Yesterday 4:05\sPM$/);
});

test("seeded long helper replies split with stable ids, reactions on the last bubble", () => {
  const long =
    "First I read your book and found six shops that owe you money this week. Joy owes the most at ₦120,000 and is 12 days late. I drafted a soft reminder for each of them, ready when you are.";
  const out = splitLongReplies([
    { kind: "text", id: "a", from: "Collector", text: long, reactions: [{ by: "me", r: "like" }] },
    { kind: "text", id: "b", from: "me", text: long },
    { kind: "card", id: "c", from: "Collector" },
  ]);
  const a = out.filter((m) => m.id.startsWith("a"));
  assert.ok(a.length >= 2);
  assert.equal(a[0]!.id, "a");
  assert.equal(a[1]!.id, "a-2");
  assert.equal("reactions" in a[0]!, false);
  assert.ok("reactions" in a[a.length - 1]!);
  assert.deepEqual(
    out.slice(a.length).map((m) => m.id),
    ["b", "c"],
  );
});

test("helper-to-helper chatter folds into one row, Mimi and you never fold", () => {
  const list = [
    { kind: "text", from: "me" },
    { kind: "text", from: "Collector" },
    { kind: "text", from: "Credit" },
    { kind: "text", from: "Collector" },
    { kind: "text", from: "Mimi" },
    { kind: "text", from: "Proof" },
    { kind: "text", from: "Proof" },
    { kind: "text", from: "Proof" },
  ];
  assert.deepEqual(chatterRuns(list), [{ start: 1, count: 3, names: ["Collector", "Credit"] }]);
  assert.equal(joinNames(["Collector", "Credit"]), "Collector and Credit");
  assert.equal(joinNames(["A", "B", "C"]), "A, B and C");
  assert.equal(stepLine("Checking **Ikeja** `POS 2281`  payments"), "Checking Ikeja POS 2281 payments");
});

test("task state, a clear finish and who changed it last", () => {
  const run = {
    state: "run",
    messages: [
      { kind: "text", from: "me" },
      { kind: "step", from: "Collector", state: "run" },
    ],
  };
  assert.equal(taskState(run), "working");
  assert.equal(
    taskState({ state: "run", messages: [{ kind: "card", from: "Collector", card: { status: "needs" } }] }),
    "needs",
  );
  assert.equal(
    taskState({
      state: "run",
      messages: [{ kind: "step", from: "Proof", state: "failed" }, { kind: "event" }],
    }),
    "stuck",
  );
  assert.equal(taskState({ state: "run", messages: [{ kind: "text", from: "Collector" }] }), "waiting");
  assert.equal(taskState({ state: "done", messages: [] }), "done");
  assert.equal(finishLine("done", "Paid · 3 of 3 witnesses"), "Paid · 3 of 3 witnesses");
  assert.equal(finishLine("done"), "Check needed");
  assert.equal(finishLine("working", "x"), null);
  assert.equal(
    updatedBy({
      state: "done",
      messages: [
        { kind: "text", from: "Collector" },
        { kind: "text", from: "me" },
      ],
    }),
    "Collector",
  );
});

test("typing dots last 600-1400ms by length, capped at 1.6s, 300ms for reduced motion", () => {
  assert.equal(typingMs("ok"), 600);
  assert.ok(typingMs("x".repeat(80)) > 1000 && typingMs("x".repeat(80)) <= 1400);
  assert.equal(typingMs("x".repeat(400)), 1600);
  assert.equal(typingMs("x".repeat(400), 1, true), 300);
});
