import type { ReactNode } from "react";
import { PageTransition } from "@/components/navigation/PageTransition";

type RouteViewProps = {
  /** Route key, kept as `data-route` because the design system styles views by it. */
  route: string;
  className?: string;
  id?: string;
  children: ReactNode;
};

/** The page wrapper: marks the view for the motion layer and animates it on navigation. */
export function RouteView({ route, className, id, children }: RouteViewProps) {
  return (
    <PageTransition>
      <div data-route={route} className={className} id={id}>
        {children}
      </div>
    </PageTransition>
  );
}
