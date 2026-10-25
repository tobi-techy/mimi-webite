import type { ReactNode } from "react";
import { SoundLayer } from "@/components/sound/SoundLayer";
import { RenameBanner } from "@/features/marketing/components/layout/RenameBanner";
import { SiteRoot } from "@/features/marketing/components/layout/SiteRoot";
import { Nav } from "@/features/marketing/components/nav/Nav";
import { HashScroll } from "@/features/marketing/motion/HashScroll";
import { MotionLayer } from "@/features/marketing/motion/MotionLayer";
import { ScrollProgress } from "@/features/marketing/motion/ScrollProgress";
import { SlapLayer } from "@/features/marketing/motion/SlapLayer";
import { motionConfig } from "@/config/motion";

type SiteFrameProps = {
  children: ReactNode;
  footer: ReactNode;
  whatsapp: ReactNode;
};

/** Nav, main, footer, sticker slap layer, scroll progress and the motion layer. */
export function SiteFrame({ children, footer, whatsapp }: SiteFrameProps) {
  return (
    <SiteRoot>
      <RenameBanner />
      <Nav />
      <main>{children}</main>
      {footer}
      {motionConfig.tapToSlap && <SlapLayer />}
      {whatsapp}
      {motionConfig.scrollProgress && <ScrollProgress />}
      <MotionLayer />
      <SoundLayer />
      <HashScroll />
    </SiteRoot>
  );
}
