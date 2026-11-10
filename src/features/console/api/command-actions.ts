"use client";

import { mimiApi } from "@/features/console/api/client";
import { COMMAND_SOURCE } from "@/features/console/api/config";
import { authed } from "@/features/console/api/sync";
import type { Item } from "@/features/console/content/command";
import type { ItemAction } from "@/features/console/lib/command-rules";

/**
 * The writes behind an item card. In the preview nothing is written and the card says so in plain
 * words: a button that looked like it worked would be a lie. In the API build these call the routes
 * in docs/PHASE1-COMMAND.md section 8, and a refusal is shown in the API's own sentence.
 */
export type ActionResult = { ok: boolean; note: string };

const PREVIEW = "Preview only. Command is not connected yet, so nothing changed.";

function refusal(e: unknown): string {
  const detail = e instanceof Error && "detail" in e && typeof (e as { detail: unknown }).detail === "string" ? (e as { detail: string }).detail : "";
  return detail || "Couldn't do that just now. Try again in a moment.";
}

export async function runItemAction(item: Item, action: ItemAction): Promise<ActionResult> {
  if (COMMAND_SOURCE === "preview") return { ok: false, note: PREVIEW };
  try {
    return await authed(async (token) => {
      switch (action.key) {
        case "assign": {
          if (!item.ownerUserId) return { ok: false, note: "Pick an owner first." };
          await mimiApi.assignItem(token, item.id, item.ownerUserId);
          return { ok: true, note: `Assigned to ${item.ownerName || "its owner"}.` };
        }
        case "action":
          await mimiApi.transitionItem(token, item.id, "actioned");
          return { ok: true, note: "Marked as worked on." };
        case "approve":
          await mimiApi.transitionItem(token, item.id, "actioned", { reason: "done" });
          return { ok: true, note: "Approved." };
        case "close":
          await mimiApi.transitionItem(token, item.id, "closed", { reason: "done" });
          return { ok: true, note: "Closed." };
        default:
          await mimiApi.transitionItem(token, item.id, "dropped", { reason: "not_needed" });
          return { ok: true, note: "Set aside." };
      }
    });
  } catch (e) {
    return { ok: false, note: refusal(e) };
  }
}

/** Sends one message into a channel. The preview never pretends it went anywhere. */
export async function sendChannelMessage(channelId: string, text: string): Promise<ActionResult> {
  if (!text.trim()) return { ok: false, note: "" };
  if (COMMAND_SOURCE === "preview") return { ok: false, note: PREVIEW };
  try {
    await authed((token) => mimiApi.postChannelMessage(token, channelId, text.trim()));
    return { ok: true, note: "Sent." };
  } catch (e) {
    return { ok: false, note: refusal(e) };
  }
}
