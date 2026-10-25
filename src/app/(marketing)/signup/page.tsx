import { Suspense } from "react";
import { SignupFlow } from "@/features/marketing/forms/auth/SignupFlow";
import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { SignupView } from "@/features/marketing/sections/signup/SignupView";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Sign up",
  description:
    "Create your Mimi account. For distributors and brands. Shops join free through their distributor's link.",
  path: "/signup",
});

export default function SignupPage() {
  return (
    <RouteView route="signup" id="signup">
      <SignupView />
      <Suspense fallback={null}>
        <SignupFlow />
      </Suspense>
    </RouteView>
  );
}
