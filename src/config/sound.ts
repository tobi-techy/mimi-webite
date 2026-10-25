/**
 * Interaction sounds (Cuelume, synthesized live, no audio files). Rules:
 * - one sound per interaction, only where it tells you something happened
 * - quiet: it sits under the page, never over it
 * - nothing on hover, scroll, typing or page load
 * - "bubble" material only for playful moments (stickers, chat messages)
 * Switch any line off here. Visitors can mute with the speaker button in the nav.
 */
export const soundConfig = {
  /** master switch for the whole site */
  enabled: true,
  /** sound starts on for new visitors (browsers still wait for their first tap) */
  defaultOn: true,
  /** 0 to 1. Kept low on purpose. */
  volume: 0.32,
  navigate: true, // page changes
  buttons: true, // buttons that do something on this page
  theme: true, // dark/light switch
  menu: true, // mobile menu, FAQ, "See the assumptions"
  billing: true, // Monthly/Yearly switch
  copy: true, // copy buttons (brand kit)
  forms: true, // form sent or rejected
  stickers: true, // drag a sticker, tap to slap
  messages: true, // chat bubbles arriving (console previews)
  console: true, // console demo: helper replies, proof, tapbacks, polls, approvals (see SOUND-MAP.md)
} as const;
