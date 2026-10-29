/**
 * Console motion switches (the demo console only; marketing motion lives in motion.ts).
 * Every animation also stops for visitors who ask for reduced motion.
 */
export const consoleMotion = {
  /** New messages slide up and fade in. */
  messageIn: true,
  /**
   * Soft bouncy feel (Tobi, 29 Oct 2026): your sent bubble rises from the composer with a small
   * spring overshoot, replies and steps settle in softer. Off = the plain slide-up above.
   * Timings live in styles/messages.css (--mc-spring-*), reduced motion gets a short plain fade.
   */
  spring: true,
  /** The send button squishes a little when you send. */
  sendSquish: true,
  /** Messages settle in gently the first time they scroll into view (native scrolling untouched). */
  scrollSettle: true,
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
