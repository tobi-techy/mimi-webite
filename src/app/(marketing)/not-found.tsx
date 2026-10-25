import type { Metadata } from "next";
import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { NotFoundSection } from "@/features/marketing/sections/not-found/NotFoundSection";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/** 404 for `notFound()` inside the marketing site (the layout already brings the chrome). */
export default function MarketingNotFound() {
  return (
    <RouteView route="404">
      <NotFoundSection />
    </RouteView>
  );
}
