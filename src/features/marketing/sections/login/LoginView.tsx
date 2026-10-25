import {
  AuthShell,
  AuthStep,
  CodeStep,
  ConsoleButton,
  DoneActions,
  EmailForm,
  GoogleButton,
  StepTitle,
  SubmitButton,
} from "@/features/marketing/auth/AuthParts";

/** Log in: Google or work email, a 6-digit code, done. Wired up by LoginFlow. */
export function LoginView() {
  return (
    <AuthShell
      switchPrompt="New to Mimi?"
      switchLink={{ href: "/signup", label: "Sign up" }}
      line="Welcome back. Your book is where you left it."
    >
      <AuthStep id="li1">
        <StepTitle as="h1">Log in to Mimi</StepTitle>
        <GoogleButton id="liGoogle" />
        <p className="x-su__or x-mono">Or use your work email</p>
        <EmailForm prefix="li" submitLabel="Send code" />
      </AuthStep>

      <AuthStep id="li2" hidden>
        <CodeStep
          prefix="li"
          submit={
            <SubmitButton id="liVerify" busy>
              Log in
            </SubmitButton>
          }
        />
      </AuthStep>

      <AuthStep id="liDone" hidden done>
        <StepTitle sub="Your book is ready." subId="liDoneSub">
          Signed in
        </StepTitle>
        <DoneActions>
          <ConsoleButton>Continue to the console</ConsoleButton>
        </DoneActions>
      </AuthStep>
    </AuthShell>
  );
}
