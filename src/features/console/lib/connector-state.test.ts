/**
 * Connected tools on the API (3 Nov 2026): a tool is connected only when the API lists an active
 * connection; Connect is offered only when the API says its real connect flow is there; a
 * placeholder consent page is never followed.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { callbackParams, safeRedirect, toolkitView } from "./connector-state.ts";
import type { ApiConnectorToolkit } from "../api/types.ts";

const zoho = (over: Partial<ApiConnectorToolkit> = {}): ApiConnectorToolkit => ({
  toolkit: "ZOHO_BOOKS", label: "Zoho Books", blurb: "Customers, invoices, payments and items from the books.",
  reads: ["zoho_books_contacts"], writes: [], connections: [], ...over,
});
const conn = (status: string, revoked_at: string | null = null) => ({ connection_id: "conn-abc", status, region: "com", connected_at: "2026-11-03T10:00:00+01:00", revoked_at });

test("no connections: not connected, and not connectable unless the API says its flow is there", () => {
  const v = toolkitView(zoho());
  assert.equal(v.state, "off");
  assert.equal(v.connectable, false, "an API without the connect field (today's demo server) gets no Connect");
  assert.match(v.unavailable!, /can't connect it yet/);
  const off = toolkitView(zoho({ connect: { available: false, reason: "No Composio key on this server." } }));
  assert.equal(off.unavailable, "No Composio key on this server.");
  assert.equal(toolkitView(zoho({ connect: { available: true } })).connectable, true);
});

test("an active connection reads connected with its id; a revoked one does not", () => {
  const on = toolkitView(zoho({ connections: [conn("active")] }));
  assert.equal(on.state, "connected");
  assert.equal(on.connectionId, "conn-abc");
  const gone = toolkitView(zoho({ connections: [conn("revoked", "2026-11-03T11:00:00+01:00")] }));
  assert.equal(gone.state, "revoked");
  assert.equal(gone.connectionId, undefined);
  assert.equal(toolkitView(zoho({ connections: [conn("FAILED")] })).state, "revoked");
});

test("Connect follows only a real https consent page", () => {
  assert.equal(safeRedirect("https://connect.example/zoho_books?state=x"), null, "the API's FakeComposio placeholder");
  assert.equal(safeRedirect("http://backend.composio.dev/link/x"), null);
  assert.equal(safeRedirect("javascript:alert(1)"), null);
  assert.equal(safeRedirect(""), null);
  assert.equal(safeRedirect("https://backend.composio.dev/api/v3/s/abc?state=s"), "https://backend.composio.dev/api/v3/s/abc?state=s");
});

test("the return from consent is read from the query in either spelling", () => {
  assert.equal(callbackParams(""), null);
  assert.equal(callbackParams("?tab=x"), null);
  assert.deepEqual(callbackParams("?state=s1&status=success&connected_account_id=ca_1"), { state: "s1", connected_account_id: "ca_1", status: "success" });
  assert.deepEqual(callbackParams("state=s2&connectedAccountId=ca_2"), { state: "s2", connected_account_id: "ca_2", status: "" });
});
