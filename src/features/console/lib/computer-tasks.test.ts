import assert from "node:assert/strict";
import { test } from "node:test";
import {
  askedLabel,
  artifactUrl,
  deriveDomain,
  describeStop,
  holdsSession,
  isHttpUrl,
  isListedKind,
  isRunning,
  kindLabel,
  liveViewLink,
  looksLikeCode,
  needsOwner,
  needsSignIn,
  normalizeArtifacts,
  planOf,
  readKinds,
  screenshotRequest,
  STEP_NO_SENTENCE,
  stepNote,
  stepSentence,
  stepsOf,
  taskShortWord,
  taskStateWord,
  taskTitle,
  taskTone,
  validateNewTask,
} from "./computer-tasks.ts";

test("a known status reads as a tone and in plain words", () => {
  assert.equal(taskTone("proposed"), "proposed");
  assert.equal(taskTone("RUNNING"), "running");
  assert.equal(taskTone("cancelled"), "stopped");
  assert.equal(taskTone("failed"), "failed");
  assert.equal(taskTone(null), "unknown");
  assert.equal(taskTone("bedazzling"), "unknown");

  assert.equal(taskStateWord("proposed"), "Waiting for your approval");
  assert.equal(taskStateWord("running"), "Running");
  assert.equal(taskStateWord("done"), "Done");
  assert.equal(taskStateWord("stopped"), "Stopped");
  assert.equal(taskStateWord("failed"), "Failed");
  /* an unknown word is shown as the API's own, so nothing is hidden or invented */
  assert.equal(taskStateWord("bedazzling"), "Bedazzling");
  assert.equal(taskStateWord("half_done"), "Half done");
  assert.equal(taskStateWord(""), "In progress");
});

test("the short words used by the filter tabs", () => {
  assert.equal(taskShortWord("proposed"), "Waiting");
  assert.equal(taskShortWord("running"), "Running");
  assert.equal(taskShortWord("done"), "Done");
  assert.equal(taskShortWord("stopped"), "Stopped");
  assert.equal(taskShortWord("failed"), "Failed");
  assert.equal(taskShortWord("bedazzling"), "Bedazzling");
});

test("waiting and running are read from the status word", () => {
  assert.equal(needsOwner("proposed"), true);
  assert.equal(needsOwner("queued"), true);
  assert.equal(needsOwner("running"), false);
  assert.equal(isRunning("running"), true);
  assert.equal(isRunning("done"), false);
  assert.equal(isRunning(undefined), false);
});

test("only a full web address is accepted", () => {
  assert.equal(isHttpUrl("https://ibank.providusbank.com"), true);
  assert.equal(isHttpUrl(" http://example.com "), true);
  assert.equal(isHttpUrl("ibank.providusbank.com"), false);
  assert.equal(isHttpUrl("ftp://example.com"), false);
  assert.equal(isHttpUrl("https://"), false);
  assert.equal(isHttpUrl(""), false);
});

test("the domain is read from the address, never guessed", () => {
  assert.equal(deriveDomain("https://ibank.providusbank.com/login"), "ibank.providusbank.com");
  assert.equal(deriveDomain("ibank.providusbank.com"), "ibank.providusbank.com");
  assert.equal(deriveDomain("  https://example.com  "), "example.com");
  assert.equal(deriveDomain("not a url"), "");
  assert.equal(deriveDomain(""), "");
});

test("the new-task form says what to fix, in plain words", () => {
  const ok = { kind: "bank_statement", goal: "Read the statement", url: "https://ibank.providusbank.com" };
  assert.equal(validateNewTask({ ...ok, kind: "" }), "Choose what kind of task this is.");
  /* which kinds exist is the service's list, not this module's: the form only offers what it read */
  assert.equal(validateNewTask({ ...ok, goal: "" }), "Say what the task should do.");
  assert.equal(validateNewTask({ ...ok, goal: "ab" }), "Say what the task should do, in a little more detail.");
  assert.equal(validateNewTask({ ...ok, goal: "a".repeat(2001) }), "Keep the goal under 2000 characters.");
  assert.equal(validateNewTask({ ...ok, url: "" }), "Add the website the task should start on.");
  assert.equal(validateNewTask({ ...ok, url: "ibank.providusbank.com" }), "Use a full web address, starting with https://.");
  assert.equal(validateNewTask(ok), null);
});

test("a live view link is shown whenever the service hands one over, and never without one", () => {
  const link = "https://live.example/session/abc";
  assert.equal(liveViewLink({ task_id: "t1", status: "running", live_view_url: link }), link);
  assert.equal(liveViewLink({ task_id: "t1", status: "RUNNING", live_view_url: link }), link);
  /* the state that exists so the owner can sign in keeps its session and its link: the link must show */
  assert.equal(liveViewLink({ task_id: "t1", status: "awaiting_owner", live_view_url: link }), link);
  assert.equal(liveViewLink({ task_id: "t1", status: "awaiting-owner", live_view_url: link }), link);
  /* other statuses are shown too when the service still offers a link; it is the service's call */
  assert.equal(liveViewLink({ task_id: "t1", status: "proposed", live_view_url: link }), link);
  /* the link is gone once the session closes */
  assert.equal(liveViewLink({ task_id: "t1", status: "done", live_view_url: null }), null);
  assert.equal(liveViewLink({ task_id: "t1", status: "stopped", live_view_url: null }), null);
  /* nothing to link to, or nothing safe to link to */
  assert.equal(liveViewLink({ task_id: "t1", status: "running" }), null);
  assert.equal(liveViewLink({ task_id: "t1", status: "running", live_view_url: null }), null);
  assert.equal(liveViewLink({ task_id: "t1", status: "running", live_view_url: "javascript:alert(1)" }), null);
  assert.equal(liveViewLink({ task_id: "t1", status: "running", live_view_url: "http://live.example/x" }), null);
  assert.equal(liveViewLink(null), null);
});

test("a step reads in its own words, never in an invented one", () => {
  assert.equal(stepSentence({ index: 1, action: "Opened the supplier portal" }), "Opened the supplier portal");
  assert.equal(stepSentence({ index: 2, action: "**Read** the `order list`" }), "Read the order list");
  /* nothing readable: said plainly, not dressed up as a step that did something */
  assert.equal(stepSentence({ index: 3, action: "" }), STEP_NO_SENTENCE);
  assert.equal(stepSentence({ index: 4 }), STEP_NO_SENTENCE);
  assert.equal(stepSentence(null), STEP_NO_SENTENCE);
});

test("a machine token never reaches a person, and the step says why it is blank", () => {
  for (const token of ["goto_url", "read_order_list", "sign_in_with_saved_session", "click_btn_2", "`extract_data`"]) {
    const line = stepSentence({ index: 1, action: token });
    assert.equal(line, STEP_NO_SENTENCE);
    assert.ok(!line.includes(token.replace(/`/g, "")), `the token ${token} was rendered`);
  }
  assert.equal(looksLikeCode("goto_url"), true);
  assert.equal(looksLikeCode("sign_in_with_saved_session"), true);
  assert.equal(looksLikeCode("`extract_data`".replace(/`/g, "")), true);
  /* prose is never second-guessed, whatever it is made of */
  assert.equal(looksLikeCode("Opened the supplier portal"), false);
  assert.equal(looksLikeCode("Opened the supplier_portal page"), false);
  assert.equal(looksLikeCode("Read order list"), false);
  assert.equal(looksLikeCode("Refer to step_2 above"), false);
  assert.equal(looksLikeCode("step-2.png"), false);
  assert.equal(looksLikeCode(""), false);
  assert.equal(looksLikeCode(null), false);
});

test("a step note is the service's own words, and a token is left out of it too", () => {
  assert.equal(stepNote({ index: 1, note: "Balance is 12 days late." }), "Balance is 12 days late.");
  assert.equal(stepNote({ index: 2, note: "**Waiting** on approval" }), "Waiting on approval");
  assert.equal(stepNote({ index: 3, note: "goto_url" }), "");
  assert.equal(stepNote({ index: 4, note: "" }), "");
  assert.equal(stepNote({ index: 5 }), "");
  assert.equal(stepNote(null), "");
});

test("the kinds come from the service, and nothing is invented for one it does not list", () => {
  const kinds = readKinds({
    kinds: [
      { kind: "price_check", label: "Price lists and promos" },
      { kind: "order_list", label: "Order list" },
      { kind: "bank_statement", label: "Bank statement" },
      { kind: "gov_form", label: "Form or filing" },
      { kind: "generic", label: "Something else" },
      { kind: "" },
      "nonsense",
      null,
    ],
  });
  assert.deepEqual(
    kinds.map((k) => k.kind),
    ["price_check", "order_list", "bank_statement", "gov_form", "generic"],
  );
  assert.equal(kindLabel("bank_statement", kinds), "Bank statement");
  assert.equal(kindLabel("BANK_STATEMENT", kinds), "Bank statement");
  assert.equal(isListedKind("generic", kinds), true);
  /* a kind the service does not list reads as nothing, never as a label the console made up */
  assert.equal(kindLabel("blog_post", kinds), "");
  assert.equal(isListedKind("blog_post", kinds), false);
  assert.equal(kindLabel("generic", []), "");
  assert.equal(kindLabel(null, kinds), "");
  assert.equal(kindLabel("", kinds), "");
  /* an entry with no label keeps its kind, and reads as nothing */
  assert.deepEqual(readKinds({ kinds: [{ kind: "odd" }] }), [{ kind: "odd", label: "" }]);
  assert.deepEqual(readKinds({}), []);
  assert.deepEqual(readKinds(null), []);
});

test("a task parked at a sign-in is waiting on the owner, not on an approval", () => {
  assert.equal(taskTone("awaiting_owner"), "paused");
  assert.equal(needsSignIn("awaiting_owner"), true);
  assert.equal(needsSignIn("Awaiting-Owner"), true);
  assert.equal(needsSignIn("running"), false);
  /* the approval button belongs to a proposed task only */
  assert.equal(needsOwner("awaiting_owner"), false);
  assert.equal(needsOwner("proposed"), true);
  assert.equal(taskShortWord("awaiting_owner"), "Waiting");
  assert.equal(taskStateWord("awaiting_owner"), "Waiting for you to sign in");
  /* the screen keeps re-reading both states: the service keeps moving in each */
  assert.equal(holdsSession("running"), true);
  assert.equal(holdsSession("awaiting_owner"), true);
  assert.equal(holdsSession("done"), false);
  assert.equal(holdsSession("stopped"), false);
});

test("steps and plan carry only what the API sent", () => {
  assert.deepEqual(stepsOf(null), []);
  assert.deepEqual(stepsOf({ task_id: "t", status: "running" }), []);
  const steps = stepsOf({ task_id: "t", status: "running", steps: [{ index: 1, action: "Opened the site" }, null as never] });
  assert.equal(steps.length, 1);
  assert.equal(steps[0]?.action, "Opened the site");

  assert.deepEqual(planOf(null), []);
  assert.deepEqual(planOf(null, ["fallback"]), ["fallback"]);
  assert.deepEqual(planOf({ task_id: "t", status: "proposed", plan: ["one", "  ", "two"] }), ["one", "two"]);
  assert.deepEqual(planOf({ task_id: "t", status: "proposed", plan: [] }, ["fallback"]), ["fallback"]);
});

test("a task with no goal of its own is never given a made-up one", () => {
  assert.equal(taskTitle(""), "Computer task");
  assert.equal(taskTitle(undefined), "Computer task");
  assert.equal(taskTitle("  read   the statement "), "read the statement");
  const long = "word ".repeat(40).trim();
  const short = taskTitle(long);
  assert.ok(short.length <= 90 && short.endsWith("…"));
});

test("a screenshot is only read when the console can fetch it safely", () => {
  const api = "https://api.example";
  assert.deepEqual(screenshotRequest("/v1/computer/tasks/t1/steps/1/screenshot", api, "t1"), {
    url: "https://api.example/v1/computer/tasks/t1/steps/1/screenshot",
    auth: true,
  });
  assert.deepEqual(screenshotRequest("https://api.example/shot.png", api, "t1"), {
    url: "https://api.example/shot.png",
    auth: true,
  });
  assert.deepEqual(screenshotRequest("https://cdn.example/shot.png", api, "t1"), {
    url: "https://cdn.example/shot.png",
    auth: false,
  });
  assert.equal(screenshotRequest("http://api.example/shot.png", api, "t1"), null);
  assert.equal(screenshotRequest("//cdn.example/shot.png", api, "t1"), null);
  assert.equal(screenshotRequest("data:image/png;base64,AAAA", api, "t1"), null);
  assert.equal(screenshotRequest("blob:https://api.example/x", api, "t1"), null);
  assert.equal(screenshotRequest("", api, "t1"), null);
  assert.equal(screenshotRequest(null, api, "t1"), null);
  assert.equal(screenshotRequest("/shot.png", "", "t1"), null);
});

test("a named picture is read from the task's artifacts, and only from the API's own origin", () => {
  const api = "https://api.example";
  assert.deepEqual(screenshotRequest("step-2.png", api, "t1"), {
    url: "https://api.example/v1/computer/tasks/t1/artifacts/step-2.png",
    auth: true,
  });
  /* a name with a slash or a space is escaped, not pasted in */
  assert.equal(
    screenshotRequest("a b/c.png", api, "t1")?.url,
    "https://api.example/v1/computer/tasks/t1/artifacts/a%20b%2Fc.png",
  );
  /* without an API address or a task there is nothing safe to ask for */
  assert.equal(screenshotRequest("step-2.png", "", "t1"), null);
  assert.equal(screenshotRequest("step-2.png", api, ""), null);
  assert.equal(artifactUrl(api, "t1", ""), null);
});

test("files are read defensively: a label, a safe link, or nothing", () => {
  assert.deepEqual(normalizeArtifacts(["https://files.example/a.pdf"]), [
    { label: "https://files.example/a.pdf", href: "https://files.example/a.pdf" },
  ]);
  assert.deepEqual(normalizeArtifacts([{ name: "Statement.pdf", url: "https://files.example/a.pdf" }]), [
    { label: "Statement.pdf", href: "https://files.example/a.pdf" },
  ]);
  assert.deepEqual(normalizeArtifacts([{ label: "Statement" }]), [{ label: "Statement" }]);
  assert.deepEqual(normalizeArtifacts([{ name: "Receipt", path: "/console/a.png" }]), [{ label: "Receipt", href: "/console/a.png" }]);
  /* a bare name is a file on the task's artifacts sub-resource, not a link nobody serves */
  assert.deepEqual(normalizeArtifacts(["order-list.csv"]), [{ label: "order-list.csv", file: "order-list.csv" }]);
  assert.deepEqual(normalizeArtifacts([{ name: "statement.pdf" }]), [{ label: "statement.pdf", file: "statement.pdf" }]);
  assert.deepEqual(normalizeArtifacts([{ label: "Statement there" }]), [{ label: "Statement there" }]);
  /* a link the console will not follow is dropped; the API's own name still lets it be fetched */
  assert.deepEqual(normalizeArtifacts([{ name: "x", url: "javascript:alert(1)" }]), [{ label: "x", file: "x" }]);
  assert.deepEqual(normalizeArtifacts([{ url: "javascript:alert(1)" }]), []);
  assert.deepEqual(normalizeArtifacts([{}]), []);
  assert.deepEqual(normalizeArtifacts([null as never, undefined as never]), []);
  assert.deepEqual(normalizeArtifacts(null), []);
});

test("a stop reason is tidied but never rewritten", () => {
  assert.equal(describeStop("  hit a login\npage  "), "hit a login page");
  assert.equal(describeStop(null), "");
});

test("the asked time is Lagos time", () => {
  /* 09:39 UTC is 10:39 in Lagos (UTC+1 all year) */
  assert.equal(askedLabel(Date.UTC(2026, 10, 3, 9, 39)), "3 Nov, 10:39");
});
