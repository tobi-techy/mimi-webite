# The demo path: four pains on Coral Lane, in order

A repeatable walk through the console on the Coral Lane Trading sandbox. Every figure comes from the
demo API's book over real HTTP calls; nothing on screen is staged. Anyone can run this: it needs a
browser, Node 24, and about ten minutes.

Four pains, one per step, in the order an owner meets them in a morning:

1. **Money at risk** (step 3): who owes, how old it is, and why each shop sits where it does.
2. **Chasing it** (step 4): the reminder that goes out, written from the same figures.
3. **A shop over its limit** (step 5): the decision that is the owner's alone.
4. **Goods coming back** (step 6): where a return is, and the credit it ends in.

The console runs the production code path. Only the data is a sandbox copy of Coral Lane.

## What you need

- The console repo at the branch under test (`fix/console-helper-inboxes` at the time of writing).
- The demo API host. This walk used `https://mimi-agent-tobi-omotade-2cd167ac.atlasflow.dev`.
- A browser window about 1440 wide. The console is responsive; the phone layout shows the same
  figures with the sidebar as a list.

## 1. Build and serve the console

```bash
cd mimi-webite
npm ci
MIMI_DEMO_API_URL=https://mimi-agent-tobi-omotade-2cd167ac.atlasflow.dev npm run build:console-demo-cf
npx -y serve out-console -l 4173 --no-clipboard
```

**What this shows:** the build is the API build (`NEXT_PUBLIC_MIMI_MODE=demo`), which is the same
console and Mimi as production pointed at the sandbox book. The command prints the host it was
built against; check it is the one you meant.

Open `http://localhost:4173`.

## 2. Open the console and let it read the book

**What this shows:** skeletons first, never sample threads swapping out, then Mimi's chat with the
note "Sandbox: your own copy of Coral Lane Trading, a sample distributor." The sidebar reads
`Shops 40`, `Credit`, `Money at risk`, `Returns`, and the roster shows seven helpers with neutral
states ("Nothing yet"), never sample outcomes or costs.

**Say:** "This is the owner's morning screen. Forty shops, one book. Everything you are about to see
is read from that book, not played back."

If the note instead says Mimi can not be reached, the API is down: press Retry, and expect nothing
else on any page until it answers. That is deliberate: an unread book must never look like a book
with nothing in it.

## 3. Pain one: money at risk

Open `Money at risk` in the sidebar, or `/money`.

**What this shows:**

- Tiles: total at risk (₦12,560,350 on the day this was written), the part past its due date
  (₦7,231,000), how many shops are carrying it (24), and the age of the oldest unpaid invoice
  (49 days).
- "How old the money is": four bands by age of each shop's oldest unpaid invoice, each with its own
  money and shop count, and the weighted figure labelled as an assumption about age, never as money
  owed.
- "Shops carrying it": one row per shop with outstanding, past due, oldest, and why it sits there
  ("45 days past due, 14 unpaid invoices, over its ₦1,700,000 limit").

**Say:** "This is what replaces a WhatsApp thread and a notebook. The ageing and the overdue flag are
the API's own definition, in `mimi/owed.py`; the console only renders them. When the exposure
endpoint lands, the console renders its buckets and this arithmetic is deleted."

Click a shop name: the drawer opens on that shop's own numbers.

**The calls behind it:** `GET /v1/shops` (each shop carries `outstanding_kobo`, `overdue_kobo`,
`overdue_days`, `open_invoices`, `credit_limit_kobo`; the list carries `owed_total_kobo` and
`overdue_total_kobo`). `GET /v1/credit/exposure` is the endpoint that will replace the local
bucketing; the console prefers it the moment it answers.

## 4. Pain two: chasing the money

Go to Mimi's chat (`Threads`, the first row), and press the chip **Who owes the most?**

**What this shows:** one line in Mimi's chat, from the Collector, with the same figures as the money
screen: "Mama Sola Provisions owes the most: ₦2,387,250 overdue (₦3,497,300 owed in all, 45 days
late)". The work itself lives in her chat, not in the owner's.

**Say:** "The owner does not want a report, he wants the money. Mimi picked the worst shop and is
ready to act."

Press the chip **Remind Mama Sola Provisions**.

**What this shows:** the Collector drafts the message ("Send Mama Sola Provisions a soft reminder
about the overdue balance") and sends it. When a step needs the owner, it arrives as an approval
card in the same chat: approve it, and it can be taken back while the API says it can.

**The calls behind it:** `POST /v1/turns?wait=false` (the chip is an owner message), then
`GET /v1/turns/{turn_id}` until `state` is `done`, then `GET /v1/approvals?status=all` for any card
the turn raised. Deciding is `POST /v1/approvals/{id}/approve` or `/reject`, and taking it back is
`POST /v1/approvals/{id}/undo`.

## 5. Pain three: a shop over its limit

Open `Credit` in the sidebar, or `/credit`.

**What this shows:** the four credit tiles (₦12.56m outstanding, ₦7.23m overdue, ₦20.56m of limits,
40 shops) and the book's lines: shop, limit, used, due, recommendation, actions. Mama Sola
Provisions is at ₦3,497,300 against a ₦1,700,000 limit, 205 per cent of it, ₦1,797,300 over.

**Say:** "Every limit here is Coral Lane's decision, not Mimi's. She recommends; the owner sets it."

Press **Set limit** on Mama Sola Provisions.

**What this shows:** the sheet with the current limit, the amount field, and the history line reading
"You set the limit to ...". Saving is a real write, and the change can be undone from the same
console.

**The calls behind it:** `GET /v1/credit` for the lines, `POST /v1/credit/{shop_id}/limit` to set one,
`POST /v1/credit/changes/{change_id}/undo` to take it back.

## 6. Pain four: goods coming back

Open `Returns` in the sidebar, or `/returns`.

**What this shows:** on this server the returns route is not live yet, so the screen says so in plain
words and explains the five steps a return will move through: Drafted, Agreed, Collected, Checked,
Credited. It shows no empty table, because an empty table would read as "no returns" and would not be
true.

**Say:** "This is wired to the returns contract already, so the day the API ships it, this page fills
in. It is deliberately empty rather than faked."

When the route lands, the same screen lists open returns with their lines, what came back and its
condition, and the return ends in a credit the owner approves: a normal approval card, with the same
undo as any other decision, and "held on the account" when the shop owes nothing to set it against.

**The calls behind it:** `GET /v1/returns` and `GET /v1/returns/{return_id}`, then the transitions
`POST /v1/returns/{return_id}/{approve|collect|inspect|settle|cancel}`.

## 7. Check the figures yourself

Every figure above can be read straight from the API. This snippet prints the book's totals and the
worst shop; it never prints the session token.

```bash
API=https://mimi-agent-tobi-omotade-2cd167ac.atlasflow.dev
TOK=$(curl -s -X POST "$API/v1/demo/sessions" | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
curl -s -H "Authorization: Bearer $TOK" "$API/v1/shops" \
  | python3 -c 'import sys,json;d=json.load(sys.stdin);print("shops",d["total"],d["owed_total_naira"],"past due",d["overdue_total_naira"]);s=sorted(d["shops"],key=lambda x:-x["overdue_kobo"])[:3];[print(x["name"],x["outstanding_naira"],x["overdue_naira"],x["overdue_days"],"days") for x in s]'
curl -s -H "Authorization: Bearer $TOK" "$API/v1/returns" | head -c 200
curl -s -H "Authorization: Bearer $TOK" "$API/v1/credit/exposure" | head -c 200
```

The last two are expected to answer `404` while those routes are unreleased. That is what the
console's honest note reflects.

## 8. Screenshots

In `/Users/tobi/Development/mimi-demo-shots/` on the demo machine:

| File | What it shows |
|---|---|
| `money-dark-desktop.png`, `money-light-desktop.png` | Money at risk, 1440x900, both themes |
| `money-dark-mobile.png`, `money-light-mobile.png` | Money at risk, 390x844, both themes |
| `returns-dark-desktop.png`, `returns-light-desktop.png` | Returns and its honest note, both themes |
| `returns-dark-mobile.png`, `returns-light-mobile.png` | The same at 390x844 |
| `mimi-chat-dark-desktop.png`, `mimi-chat-light-desktop.png` | Mimi's chat with a real answer and the sandbox note |

The light theme is the console's own toggle; the screenshots were taken with the page attribute set
and checked against the computed body colour.

## What is real, and what is waiting on the API

| On screen | Real today | Waiting on the API |
|---|---|---|
| Money at risk | figures, ageing buckets and reasons from the book | `GET /v1/credit/exposure` replaces the local bucketing |
| Chasing | the answer, the reminder and every approval | nothing |
| Credit | the lines, the limits and the writes | nothing |
| Returns | the lifecycle in plain words | `GET /v1/returns` and its transitions |

Two rules this path is built on: no sample row, figure or image ever stands in for something the API
did not send, and no money figure is ever computed by the model.
