/**
 * Motion switches. Every scroll animation is its own hook or component (see src/features/marketing/motion and hooks);
 * turning one off here leaves its content in the final, fully visible state.
 */
export const motionConfig = {
  /** First-visit loading screen ("Loading the book"). */
  loader: true,
  /** Blocks fade up and headlines rise line by line as they scroll into view. */
  reveal: true,
  /** Orange scroll-progress hairline at the top of the page. */
  scrollProgress: true,
  /** Hairline under the nav once the page scrolls. */
  navHairline: true,
  /** Hero video, blog photo, page-hero photos and hero stickers drift on scroll (wide screens). */
  photoParallax: true,
  /** Plan prices and calculator results count up when first seen. */
  countUp: true,
  /** Three witnesses, debt book and brand totals play when scrolled into view. */
  triggeredStories: true,
  /** Stickers pop in, bob, can be dragged, drift on scroll and stay inside the viewport. */
  stickers: true,
  /** Tap empty space to slap a sticker. */
  tapToSlap: true,
  /** FAQ answers open and close with a smooth height animation. */
  faqAccordion: true,
} as const;
