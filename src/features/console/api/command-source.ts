import { mimiApi } from "@/features/console/api/client";
import type { ApiChannelMessage, ApiCommandBundle } from "@/features/console/api/command-contract";
import { COMMAND_SOURCE } from "@/features/console/api/config";
import { authed } from "@/features/console/api/sync";
import { commandPreview } from "@/features/console/content/command-mock";
import { assembleCommand, type CommandData } from "@/features/console/lib/command-map";

/**
 * Where Command reads from, behind one function. `preview` reads the typed mock; `api` reads the real
 * routes. Both go through `assembleCommand`, so a payload that will not map fails the same way either
 * way, and swapping sources is a config change (NEXT_PUBLIC_MIMI_COMMAND), not a screen change.
 */
export type CommandRead = {
  data: CommandData;
  /** True while the screens are showing the preview, so they can say so in plain words. */
  preview: boolean;
};

/**
 * Two gaps in the documented contract, noted here rather than papered over, because the api path
 * cannot be finished until they are closed (both need a backend route that does not exist yet):
 *
 * 1. There is no roster route, so in `api` mode the caller's reps (a supervisor's `repIds`, needed to
 *    approve money items for their own reps) are unknown. The preview carries them; the real read
 *    will need something like `GET /v1/users?role=rep`.
 * 2. No route sends display names for refs, so `author_ref`/`owner_user_id` cannot be turned into
 *    words in `api` mode and would fall back to neutral words ("Someone"). The preview carries a
 *    `names` map; the real read will need one on the messages and items routes (or a users route).
 */
async function readFromApi(signal?: AbortSignal): Promise<CommandRead> {
  return authed(async (token) => {
    const [me, channels, items, digest] = await Promise.all([
      mimiApi.commandMe(token, { signal }),
      mimiApi.channels(token, { signal }),
      mimiApi.items(token, {}, { signal }),
      mimiApi.digestToday(token, { signal }),
    ]);
    const lists = await Promise.all(channels.channels.map((c) => mimiApi.channelMessages(token, c.channel_id, { signal })));
    const messages: ApiChannelMessage[] = lists.flatMap((l) => l.messages ?? []);
    const bundle: ApiCommandBundle = {
      me,
      users: [],
      names: {},
      channels: channels.channels,
      messages,
      items: items.items,
      digest,
      as_of: items.as_of,
    };
    return { data: assembleCommand(bundle), preview: false };
  });
}

/** One Command read, from whichever source this build is set to. */
export async function readCommand(signal?: AbortSignal): Promise<CommandRead> {
  if (COMMAND_SOURCE === "api") return readFromApi(signal);
  return { data: assembleCommand(commandPreview), preview: true };
}
