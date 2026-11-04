import assert from "node:assert/strict";
import { test } from "node:test";
import {
  askedLabel,
  artifactUrl,
  canStop,
  deriveDomain,
  describeStop,
  isFinished,
  isHttpUrl,
  isListedKind,
  isRunning,
  kindLabel,
  liveViewLink,
  looksLikeCode,
  needsOwner,
  needsSignIn,
  normalizeArtifacts,
  PLAN_UNREADABLE,
  planOf,
  readKinds,
  screenshotRequest,
  STEP_NO_SENTENCE,
  STEP_UNREADABLE,
  stepNote,
  stepSentence,
  stepsOf,
  stepUrl,
  STOP_UNSAID,
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
  /* the service's vocabulary has no `queued`: an unknown word is shown as itself, not guessed at */
  assert.equal(needsOwner("queued"), false);
  assert.equal(taskTone("queued"), "unknown");
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
  assert.equal(
    validateNewTask({ ...ok, url: "ibank.providusbank.com" }),
    "Use a full web address, starting with http:// or https://.",
  );
  /* both schemes are taken, and the form says so */
  assert.equal(validateNewTask({ ...ok, url: "http://ibank.providusbank.com" }), null);
  assert.equal(validateNewTask(ok), null);
});

test("a live view link is shown whenever the service hands one over, and never without one", () => {
  const link = "https://live.example/session/abc";
  assert.equal(liveViewLink({ task_id: "t1", status: "running", live_view_url: link }), link);
  assert.equal(liveViewLink({ task_id: "t1", status: "RUNNING", live_view_url: link }), link);
  /* the state that exists so the owner can sign in keeps its session and its link: the link must show */
  assert.equal(liveViewLink({ task_id: "t1", status: "awaiting_owner", live_view_url: link }), link);
  assert.equal(liveViewLink({ task_id: "t1", status: "awaiting-owner", live_view_url: link }), link);
  /* other live statuses are shown too when the service still offers a link; it is the service's call */
  assert.equal(liveViewLink({ task_id: "t1", status: "proposed", live_view_url: link }), link);
  /* a finished task is never offered the link, even when a merged answer still carries one */
  assert.equal(liveViewLink({ task_id: "t1", status: "done", live_view_url: link }), null);
  assert.equal(liveViewLink({ task_id: "t1", status: "stopped", live_view_url: link }), null);
  assert.equal(liveViewLink({ task_id: "t1", status: "cancelled", live_view_url: link }), null);
  assert.equal(liveViewLink({ task_id: "t1", status: "failed", live_view_url: link }), null);
  assert.equal(liveViewLink({ task_id: "t1", status: "done", live_view_url: null }), null);
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
  for (const token of [
    "goto_url",
    "read_order_list",
    "sign_in_with_saved_session",
    "click_btn_2",
    "`extract_data`",
    "GOTO_URL",
    "Goto_Url",
    "goto-url",
    "Click_btn_2",
  ]) {
    const line = stepSentence({ index: 1, action: token });
    assert.equal(line, STEP_UNREADABLE, `token ${token} was not caught`);
    assert.ok(!line.includes(token.replace(/`/g, "")), `the token ${token} was rendered`);
  }
  /* the two blank cases are told apart: nothing sent, versus something unreadable */
  assert.notEqual(STEP_UNREADABLE, STEP_NO_SENTENCE);
  assert.equal(looksLikeCode("goto_url"), true);
  assert.equal(looksLikeCode("GOTO_URL"), true);
  assert.equal(looksLikeCode("goto-url"), true);
  assert.equal(looksLikeCode("Click_btn_2"), true);
  assert.equal(looksLikeCode("extract_data"), true);
  /* prose is never second-guessed, whatever it is made of */
  assert.equal(looksLikeCode("Opened the supplier portal"), false);
  assert.equal(looksLikeCode("Opened the supplier_portal page"), false);
  assert.equal(looksLikeCode("Read order list"), false);
  assert.equal(looksLikeCode("Refer to step_2 above"), false);
  assert.equal(looksLikeCode("step-2.png"), false);
  /* a capital keeps its hyphens, and a figure range has no letter in it */
  assert.equal(looksLikeCode("Follow-up"), false);
  assert.equal(looksLikeCode("Sign-in"), false);
  assert.equal(looksLikeCode("Cost-price"), false);
  assert.equal(looksLikeCode("5-10"), false);
  assert.equal(stepNote({ index: 1, note: "Follow-up" }), "Follow-up");
  assert.deepEqual(planOf({ task_id: "t", status: "proposed", plan: ["Follow-up", "5-10"] }), [
    "Follow-up",
    "5-10",
  ]);
  /* residual risk, named in the PR: a bare one-word token with no separator is passed through */
  assert.equal(looksLikeCode("extract"), false);
  assert.equal(stepSentence({ index: 1, action: "extract" }), "extract");
  assert.equal(looksLikeCode(""), false);
  assert.equal(looksLikeCode(null), false);
});

test("a plan line that is a token is said so, and the plan keeps its shape", () => {
  assert.deepEqual(planOf({ task_id: "t", status: "proposed", plan: ["Open the portal", "read_price_list"] }), [
    "Open the portal",
    PLAN_UNREADABLE,
  ]);
  assert.deepEqual(planOf({ task_id: "t", status: "proposed", plan: ["Open the portal"] }), ["Open the portal"]);
  assert.deepEqual(planOf(null, ["Kept line"]), ["Kept line"]);
  assert.ok(!PLAN_UNREADABLE.includes("read_price_list"));
});

test("a step's page is shown only as a full web address, and never reshaped", () => {
  assert.equal(stepUrl({ index: 1, url: "https://web.whatsapp.com/" }), "https://web.whatsapp.com/");
  assert.equal(stepUrl({ index: 2, url: "http://portal.example/orders" }), "http://portal.example/orders");
  /* a bare host or a token is not turned into an address */
  assert.equal(stepUrl({ index: 3, url: "web.whatsapp.com" }), "");
  assert.equal(stepUrl({ index: 4, url: "goto_url" }), "");
  assert.equal(stepUrl({ index: 5, url: "javascript:alert(1)" }), "");
  assert.equal(stepUrl({ index: 6 }), "");
  assert.equal(stepUrl(null), "");
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
  /* a service that lists its kinds as bare strings is read too, rather than going dead */
  assert.deepEqual(readKinds({ kinds: ["bank_statement", "order_list", ""] }), [
    { kind: "bank_statement", label: "" },
    { kind: "order_list", label: "" },
  ]);
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
});

test("there is a way out of every task the service has not finished with", () => {
  /* running, parked at a sign-in, and not started yet all keep an action */
  assert.equal(canStop("running"), true);
  assert.equal(canStop("awaiting_owner"), true);
  assert.equal(canStop("proposed"), true);
  assert.equal(canStop("queued"), true);
  /* an unknown status word means the console cannot be sure it is over, so it keeps the way out */
  assert.equal(canStop("bedazzling"), true);
  assert.equal(canStop(null), true);
  /* finished tasks have nothing left to stop */
  assert.equal(canStop("done"), false);
  assert.equal(canStop("stopped"), false);
  assert.equal(canStop("cancelled"), false);
  assert.equal(canStop("failed"), false);
  assert.equal(isFinished("done"), true);
  assert.equal(isFinished("awaiting_owner"), false);
  assert.equal(isFinished("running"), false);
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
  /* a picture on another host is not attempted: the shipped console's CSP would block the fetch and
     the step would read "could not be shown" anyway */
  assert.equal(screenshotRequest("https://cdn.example/shot.png", api, "t1"), null);
  assert.equal(screenshotRequest("https://api.example/shot.png", "", "t1"), null);
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

test("the stop line is the service's own sentence, never its code", () => {
  /* the two fields the service sends together: a code and the sentence for a person */
  assert.equal(
    describeStop({ stop_reason: "stopped_by_owner", note: "Stopped by the owner." }),
    "Stopped by the owner.",
  );
  assert.equal(
    describeStop({ stop_reason: "off_domain", note: "Stopped: the browser left the domain you approved. Nothing after that was read or kept." }),
    "Stopped: the browser left the domain you approved. Nothing after that was read or kept.",
  );
  /* the sentence is passed through as written: the service's own notes carry their own framing */
  assert.equal(describeStop({ note: "  Stopped by the owner.\n " }), "Stopped by the owner.");
  /* every code the service can send: none of them ever reaches the screen */
  for (const code of [
    "off_domain",
    "forbidden_page",
    "login_wall",
    "budget_steps",
    "budget_seconds",
    "stopped_by_owner",
    "engine_error",
    "unsupported_step",
  ]) {
    const line = describeStop({ stop_reason: code });
    assert.equal(line, STOP_UNSAID, `${code} reached the screen`);
    assert.equal(line.includes(code), false, `${code} reached the screen`);
    /* and a code that arrives in the sentence field instead is refused too */
    assert.equal(describeStop({ note: code }), STOP_UNSAID, `${code} reached the screen through note`);
  }
  assert.equal(describeStop({ note: "", stop_reason: "" }), STOP_UNSAID);
  assert.equal(describeStop(null), STOP_UNSAID);
  assert.equal(describeStop(undefined), STOP_UNSAID);
  /* a service that stopped naming a reason at all is still said plainly */
  assert.equal(STOP_UNSAID, "The service did not say why this task stopped.");
});

test("a task the budgets ended reads as stopped, not as still going", () => {
  assert.equal(taskTone("stopped_runaway"), "stopped");
  assert.equal(taskStateWord("stopped_runaway"), "Stopped");
  assert.equal(taskShortWord("stopped_runaway"), "Stopped");
  assert.equal(isRunning("stopped_runaway"), false);
  assert.equal(isFinished("stopped_runaway"), true);
  assert.equal(canStop("stopped_runaway"), false);
  assert.equal(
    liveViewLink({ task_id: "t", status: "stopped_runaway", live_view_url: "https://live.example/x" }),
    null,
  );
  /* a status of that family the service adds later reads the same way rather than as "in progress" */
  for (const word of ["stopped_runaway", "STOPPED_RUNAWAY", "stopped-budget", "stopped_future_reason"]) {
    assert.equal(taskTone(word), "stopped", word);
    assert.equal(isFinished(word), true, word);
    assert.equal(canStop(word), false, word);
  }
  /* and the words that are not stopped stay where they were */
  assert.equal(taskTone("proposed"), "proposed");
  assert.equal(taskTone("running"), "running");
  assert.equal(taskTone("awaiting_owner"), "paused");
  assert.equal(taskTone("queued"), "unknown");
});

test("a plan line is the service's own words, from either shape, and never its code", () => {
  /* the service's own object: note is the line written for the owner, action its plain verb words */
  assert.deepEqual(
    planOf({
      task_id: "t",
      status: "proposed",
      plan: [
        { action: "Open the page", code: "goto", url: "https://x.example", note: "Open the internet banking site" },
        { action: "Read what the page shows", code: "extract", note: "Read the prices and promos shown on the page" },
      ],
    }),
    ["Open the internet banking site", "Read the prices and promos shown on the page"],
  );
  /* no note: the plain words for the verb, still never the code */
  assert.deepEqual(
    planOf({ task_id: "t", status: "proposed", plan: [{ action: "Scroll the page", code: "scroll" }] }),
    ["Scroll the page"],
  );
  /* a bare string is still read, and an empty line is left out rather than shown blank */
  assert.deepEqual(planOf({ task_id: "t", status: "proposed", plan: ["Open the site", "  ", ""] }), ["Open the site"]);
  /* a line the service sent as a machine token is said so, and the plan keeps its shape */
  assert.deepEqual(
    planOf({ task_id: "t", status: "proposed", plan: [{ action: "read_price_list", code: "extract" }, "Follow-up"] }),
    [PLAN_UNREADABLE, "Follow-up"],
  );
  assert.deepEqual(planOf({ task_id: "t", status: "proposed", plan: [] }, ["Open the site"]), ["Open the site"]);
  assert.deepEqual(planOf(null, ["Open the site"]), ["Open the site"]);
});

test("the asked time is Lagos time", () => {
  /* 09:39 UTC is 10:39 in Lagos (UTC+1 all year) */
  assert.equal(askedLabel(Date.UTC(2026, 10, 3, 9, 39)), "3 Nov, 10:39");
});
