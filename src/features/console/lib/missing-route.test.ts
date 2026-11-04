/**
 * The two 404s, pinned (Tobi, 4 Nov 2026). An answer the API sends is never turned into "not
 * available yet" just because the status says 404: the route's own 404 for a routine it does not
 * have carries a sentence, and that sentence is shown. Tests run with `npm run test:console`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { routeMissing } from "./missing-route.ts";

test("a path this build does not serve is a missing route, whatever it says", () => {
  assert.equal(routeMissing(404, "Not Found"), true, "FastAPI's own body for an unknown path");
  assert.equal(routeMissing(404, ""), true, "no sentence at all is still no route");
  assert.equal(routeMissing(405, "Not Found"), true);
  /* the console always sends the right method, so a 405 means the path exists: its sentence is shown,
     not swallowed as "not available yet" */
  assert.equal(routeMissing(405, "Method Not Allowed"), false, "the path is there, so this is an answer");
});

test("the run route's own 404 is a refusal, not a missing route", () => {
  assert.equal(routeMissing(404, "unknown routine"), false, "the route is deployed: this is a real answer");
  assert.equal(routeMissing(409, "It is paused, so it did not run. The reason: on hold"), false, "a refusal is never hidden");
  assert.equal(routeMissing(401, ""), false, "no owner key is not a missing route");
});

test("a sentence that happens to mention not found is not the missing-route body", () => {
  assert.equal(routeMissing(404, "No invoice not found here"), false, "only the exact body counts");
});
