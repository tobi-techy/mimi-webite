import type { Conversation } from "@/features/console/demo/types";

/**
 * The demo tour's one conversation (a task in Mimi's chat), held here so the live demo can lay it
 * over the API's threads on every poll. No imports beyond types: the API sync reads it.
 */
export const TOUR_SLUG = "demo-tour";

let tour: Conversation | null = null;

export const tourConversation = (): Conversation | null => tour;
export const setTourConversation = (c: Conversation | null): void => {
  tour = c;
};
