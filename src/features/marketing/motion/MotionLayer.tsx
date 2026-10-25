"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useCountUps } from "@/features/marketing/hooks/use-count-ups";
import { useFaqAccordion } from "@/features/marketing/hooks/use-faq-accordion";
import { usePhotoParallax } from "@/features/marketing/hooks/use-photo-parallax";
import { useReveal } from "@/features/marketing/hooks/use-reveal";
import { useStickers } from "@/features/marketing/hooks/use-stickers";
import { useTriggeredStories } from "@/features/marketing/hooks/use-triggered-stories";
import { motionConfig } from "@/config/motion";

/**
 * The site's motion layer, mounted once in the site frame. Each line is one independent scroll
 * animation (switch it off in src/config/motion.ts). Transform + opacity only, and every hook
 * respects prefers-reduced-motion.
 */
export function MotionLayer() {
  const pathname = usePathname();

  useEffect(() => {
    window.__mimiMotion = true;
  }, []);

  useReveal(pathname, motionConfig.reveal);
  usePhotoParallax(pathname, motionConfig.photoParallax);
  useCountUps(pathname, motionConfig.countUp);
  useTriggeredStories(pathname, motionConfig.triggeredStories);
  useStickers(pathname, motionConfig.stickers);
  useFaqAccordion(pathname, motionConfig.faqAccordion);

  return null;
}
