import { USES_API } from "@/features/console/api/config";
import { owner } from "@/features/console/demo/seed";

/**
 * The owner's first name for a greeting, or null for a neutral one. The API's `/v1/me` carries no
 * name yet, so the API build stays neutral ("All clear.") instead of borrowing the sample owner's
 * name; the sample build keeps the sample name. When `/v1/me` grows a name, read it here.
 */
export const ownerFirstName: string | null = USES_API ? null : owner.first;

/**
 * The owner's name as it appears in a record he made (a limit he set, in the sheet's History list).
 * The API build never borrows the sample owner's name: he is signed in as himself, so "You" is the
 * honest word. The sample build keeps the sample name.
 */
export const ownerRecordName: string = USES_API ? "You" : owner.name;
