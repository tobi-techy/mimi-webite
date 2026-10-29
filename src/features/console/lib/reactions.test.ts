import assert from "node:assert/strict";
import { test } from "node:test";
import { TAPBACK_EMOJI, badgeOrder, leftReactions, reactionEmoji } from "./reactions.ts";

test("tapback keys render as real emoji, other reactions pass through", () => {
  assert.equal(reactionEmoji("heart"), "❤️");
  assert.equal(reactionEmoji("like"), "👍");
  assert.equal(reactionEmoji("dislike"), "👎");
  assert.equal(reactionEmoji("haha"), "😂");
  assert.equal(reactionEmoji("bang"), "‼️");
  assert.equal(reactionEmoji("question"), "❓");
  assert.equal(reactionEmoji("🔥"), "🔥");
  assert.equal(Object.keys(TAPBACK_EMOJI).length, 6);
  for (const e of Object.values(TAPBACK_EMOJI)) assert.doesNotMatch(e, /[A-Za-z!?]/);
});

test("badges put yours in front and keep at most three", () => {
  const list = [
    { by: "me", r: "like" },
    { by: "Proof", r: "heart" },
    { by: "Kola Mart", r: "haha" },
    { by: "Mimi", r: "bang" },
  ];
  assert.deepEqual(
    badgeOrder(list).map((q) => q.by),
    ["Kola Mart", "Mimi", "me"],
  );
  assert.deepEqual(
    badgeOrder([{ by: "me", r: "like" }]).map((q) => q.by),
    ["me"],
  );
});

test("a removed or changed reaction is reported as leaving", () => {
  const a = [
    { by: "me", r: "like" },
    { by: "Mimi", r: "heart" },
  ];
  assert.deepEqual(leftReactions(a, [{ by: "Mimi", r: "heart" }]), [{ by: "me", r: "like" }]);
  assert.deepEqual(
    leftReactions(a, [
      { by: "me", r: "haha" },
      { by: "Mimi", r: "heart" },
    ]),
    [{ by: "me", r: "like" }],
  );
  assert.deepEqual(leftReactions(a, a), []);
});
