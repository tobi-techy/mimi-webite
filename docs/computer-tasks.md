# Computer tasks: what the console expects from the service

The console surface for computer tasks (`/computers`) is a static export: it talks to the MIMI-AGENT
API from the browser with the session bearer, over the routes below, and it has no server of its own.
This document is the console side of that contract, written from the API's own source
(`mimi/computer/types.py`, `mimi/computer/store.py`, `mimi/api/schemas.py`) so the two sides cannot
drift without this file being wrong on the record. It is not published to reviewers as a spec.

## The routes

| What | Route | Response |
| --- | --- | --- |
| The kinds | `GET /v1/computer/kinds` | `{"kinds":[{"kind":"price_check","label":"Price lists and promos"}]}` |
| The list | `GET /v1/computer/tasks` | `{"tasks":[ …list rows… ]}` |
| One task | `GET /v1/computer/tasks/{id}` | the detail view |
| Start a task | `POST /v1/computer/tasks` | `{task_id, status:"proposed", plan}` (201) |
| Approve | `POST /v1/computer/tasks/{id}/approve` | the detail view |
| Stop | `POST /v1/computer/tasks/{id}/stop` | the detail view |
| A step's screenshot, or a file the task left | `GET /v1/computer/tasks/{id}/artifacts/{name}` | the bytes |

A list row is `task_id, goal, domain, status, created_at, step_count, stop_reason`. It carries no
`kind`, no `note` and no plan, so the list's kind column appears only when a row has a kind and
otherwise says the service does not name it.

A detail view is the task plus `kind, url, note, plan, inputs, steps, artifacts, live_view_url`. The
plan is there on both the proposal and a later read.

## Status words

The vocabulary is closed: `proposed`, `running`, `awaiting_owner`, `done`, `stopped`,
`stopped_runaway`, `failed`. There is no `queued` status in a task response.

| The service says | The console shows | It offers |
| --- | --- | --- |
| `proposed` | Waiting for your approval | Approve, Discard |
| `running` | Running | Stop |
| `awaiting_owner` | Waiting for you to sign in | Stop |
| `done` | Done | nothing |
| `stopped` | Stopped | nothing |
| `stopped_runaway` | Stopped | nothing |
| `failed` | Failed | nothing |
| anything else | the service's own word | nothing, until this file knows the word |

Anything beginning `stopped` reads as stopped, so a status of that family added later cannot slip
through as unfinished. A finished task is never polled again and never offers a link or a stop.

## Signing in

A task parked at a sign-in wall keeps its session and its live view link while it waits, and the owner
signs in themselves through that link: the console never types a password or a code, and this console
has no field for one.

The sign-in is not carried over. Every run is its own thread, so a task that carries on releases the
paused session and opens a fresh browser with no cookies, which pauses at the same wall again with a
new link. The screen says that to the owner in as many words, so nobody is left waiting for a resume
that gets past a login. A session owned by one long-lived thread per task, which is what would keep a
sign-in, is not built on the service side.

## Why it stopped: the sentence, never the code

The service sends `stop_reason` (a code) and `note` (the sentence for a person) together. Only `note`
is ever rendered: the codes are `off_domain`, `forbidden_page`, `login_wall`, `budget_steps`,
`budget_seconds`, `stopped_by_owner`, `engine_error` and `unsupported_step`, and none of them may
appear on a screen. If the sentence is empty, the console shows one neutral line of its own. The
service's notes already carry their own framing ("Stopped: the browser left the domain you approved."),
so nothing is prefixed to them.

## Plan lines and step lines

Both are the same shape, and the console reads the same fields from each:

```json
{"index": 2, "action": "Read what the page shows", "code": "extract", "url": "https://x.example/prices", "note": "Read the prices and promos shown on the page", "screenshot": "prices-02.png"}
```

- `action` is the service's plain words for the verb ("Read what the page shows").
- `note` is the line written for the owner, and a plan line prefers it over `action`.
- `code` is the machine verb (`goto`, `extract`), and the console never renders it.
- `url` is shown only when it is a full `http://` or `https://` address. The service may send a bare
  host, which is left out rather than turned into a link.
- `screenshot` is an artifact name for the artifacts route. When it is missing, or the answer is not
  an image, the step says there is no picture and no stand-in is drawn.

If `action` or `note` arrives as a machine token (an underscore-joined token in any case, or an
all-lower-case hyphenated one), the console says the service sent a step without words a person can
read rather than putting the token on screen. A bare one-word token (`extract`) and a camel-case one
(`gotoUrl`) still get through: catching those means guessing at intent, so the fix belongs in the
service's wording.

## Kinds

The console never hardcodes a list. It reads `GET /v1/computer/kinds` and offers exactly those, with
the service's labels, and shows a kind with no label as the service's own word.

## Failures

- A 404 or 405 on the list route reads as "the service does not have computer tasks yet". Only the
  list decides that.
- A 404 on one task's detail route is about that task: "That task is no longer on the service", with a
  way to try again.
- A read that fails stops the poll for that task and shows what failed. A poll nobody asked for never
  sets the loading state, so a failure cannot blank or blink what is already on screen.
- A body that is not an image is never handed to an image element.

## Not in this prototype

Desktop GUI control of the container and shell access are wanted later and are not built. The page
lists them under "Not available yet". Nothing on the surface claims the service is live: with no API
address the screens say the service is not available rather than showing invented tasks.
