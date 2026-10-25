/**
 * Console motion switches (the demo console only; marketing motion lives in motion.ts).
 * Every animation also stops for visitors who ask for reduced motion.
 */
export const consoleMotion = {
  /** New messages slide up and fade in. */
  messageIn: true,
  /** Helper replies reveal word by word, like they are being written. */
  streamText: true,
  /** Typing dots bounce while a helper writes. */
  typingDots: true,
  /** A card that needs you pulses its orange mark once when it arrives. */
  approvalAttention: true,
  /** Photo stacks fan open on tap. */
  photoFan: true,
  /** Plan sheet slides up from the bottom. */
  sheet: true,
  /** Multiplier on every scripted pause (1 = natural, 0.6 = brisk). */
  pace: 1,
} as const;
