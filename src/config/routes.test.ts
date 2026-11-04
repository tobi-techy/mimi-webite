import { test } from "node:test";
import assert from "node:assert/strict";

import { routes } from "./routes.ts";

test("every Live demo link points at the live demo console", () => {
  if (process.env.NEXT_PUBLIC_CONSOLE_URL) return; // an explicit override wins
  assert.equal(routes.consoleUrl, "https://demo.userail.money");
});
