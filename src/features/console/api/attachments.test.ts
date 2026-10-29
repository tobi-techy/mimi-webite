/** Attachment checks: `npm run test:console`. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_ATTACH_BYTES, baseMime, checkAttachment, pickRecorderMime, sizeLabel, uploadRefusal } from "./attachments.ts";

test("types are read from the file, then its name", () => {
  assert.equal(baseMime("audio/webm;codecs=opus"), "audio/webm");
  assert.equal(baseMime("image/JPG"), "image/jpeg");
  assert.equal(baseMime("", "Invoice 2304.PDF"), "application/pdf");
  assert.equal(baseMime("application/octet-stream", "note.m4a"), "audio/mp4");
  assert.equal(baseMime("", "noext"), "");
});

test("each picker takes only its own kinds", () => {
  const f = (type: string, size = 1000, name = "") => ({ type, size, name });
  assert.deepEqual(checkAttachment(f("image/png"), "photo"), { ok: true, kind: "image", mime: "image/png" });
  assert.equal(checkAttachment(f("image/gif"), "photo").ok, false);
  assert.equal(checkAttachment(f("application/pdf"), "photo").ok, false);
  assert.deepEqual(checkAttachment(f("audio/mp4"), "voice"), { ok: true, kind: "voice", mime: "audio/mp4" });
  assert.equal(checkAttachment(f("video/mp4"), "voice").ok, false);
  assert.deepEqual(checkAttachment(f("application/pdf"), "invoice"), { ok: true, kind: "document", mime: "application/pdf" });
  assert.deepEqual(checkAttachment(f("image/jpeg"), "invoice"), { ok: true, kind: "image", mime: "image/jpeg" });
  assert.equal(checkAttachment(f("application/msword", 10, "x.doc"), "invoice").ok, false);
});

test("size: empty and over 10 MB are refused in plain words", () => {
  const empty = checkAttachment({ type: "image/png", size: 0, name: "" }, "photo");
  assert.ok(!empty.ok && empty.error === "That file is empty.");
  const big = checkAttachment({ type: "image/png", size: MAX_ATTACH_BYTES + 1, name: "" }, "photo");
  assert.ok(!big.ok && big.error.includes("10 MB") && !big.error.includes("—"));
  assert.equal(checkAttachment({ type: "image/png", size: MAX_ATTACH_BYTES, name: "" }, "photo").ok, true);
});

test("API refusals read as plain words; anything else falls through", () => {
  assert.match(uploadRefusal(413) ?? "", /10 MB/);
  assert.match(uploadRefusal(415, "the file is not the type it says it is") ?? "", /isn't what its name says/);
  assert.match(uploadRefusal(422, "attach the file again: it is not one of this demo copy's uploads") ?? "", /Attach it again/);
  assert.match(uploadRefusal(429, "this demo copy has all the files it can take") ?? "", /Reset the demo/);
  assert.equal(uploadRefusal(429, "you have used today's demo allowance"), null);
  assert.equal(uploadRefusal(500), null);
});

test("sizes and recorder types", () => {
  assert.equal(sizeLabel(512), "512 B");
  assert.equal(sizeLabel(2048), "2 KB");
  assert.equal(sizeLabel(3 * 1024 * 1024), "3 MB");
  assert.equal(pickRecorderMime((t) => t === "audio/mp4"), "audio/mp4");
  assert.equal(pickRecorderMime(() => false), "");
  assert.equal(
    pickRecorderMime(() => {
      throw new Error("no");
    }),
    "",
  );
});
