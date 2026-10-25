import { LoginFlow } from "@/features/marketing/forms/auth/LoginFlow";
import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { LoginView } from "@/features/marketing/sections/login/LoginView";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Log in",
  description: "Log in to Mimi.",
  path: "/login",
  noindex: true,
});

export default function LoginPage() {
  return (
    <RouteView route="login" id="login">
      <LoginView />
      <LoginFlow />
    </RouteView>
  );
}
