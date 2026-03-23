"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { ArrowRight, LoaderCircle, Mail, RefreshCcw } from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type JudgeAuthPanelProps = {
  title?: string;
  description?: string;
  afterAuthenticate?: () => void;
  className?: string;
};

type Notice = {
  tone: "info" | "error" | "success";
  text: string;
};

function getErrorMessage(error: unknown) {
  if (isClerkAPIResponseError(error) && error.errors[0]?.longMessage) {
    return error.errors[0].longMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "We couldn't complete that sign-in step.";
}

type EmailCodeFactor = {
  strategy: "email_code";
  emailAddressId: string;
  safeIdentifier?: string;
};

function getEmailCodeFactor(factors: unknown): EmailCodeFactor | null {
  if (!Array.isArray(factors)) return null;

  const match = factors.find(
    (factor) =>
      factor &&
      typeof factor === "object" &&
      "strategy" in factor &&
      factor.strategy === "email_code" &&
      "emailAddressId" in factor &&
      typeof factor.emailAddressId === "string"
  );

  return (match as EmailCodeFactor | undefined) ?? null;
}

function createGeneratedPassword() {
  return `Judge-${crypto.randomUUID()}-Aa1`;
}

export function JudgeAuthPanel({
  title = "Sign in to judge",
  description = "Use Google if it's available on this Clerk instance, or request a one-time email code to keep judging simple on the day.",
  afterAuthenticate,
  className
}: JudgeAuthPanelProps) {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { signUp } = useSignUp();
  const [step, setStep] = React.useState<"identify" | "verify">("identify");
  const [flow, setFlow] = React.useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [notice, setNotice] = React.useState<Notice | null>(null);
  const [pending, setPending] = React.useState<"idle" | "email" | "verify" | "google">("idle");
  const [emailAddressId, setEmailAddressId] = React.useState<string | null>(null);
  const [safeIdentifier, setSafeIdentifier] = React.useState<string | null>(null);

  async function requestEmailCode() {
    if (!isLoaded || !signIn || !signUp) return;

    const identifier = email.trim().toLowerCase();
    if (!identifier) {
      setNotice({
        tone: "error",
        text: "Enter your email address first."
      });
      return;
    }

    setPending("email");
    setNotice(null);

    try {
      const signInAttempt = await signIn.create({
        identifier
      });
      const emailCodeFactor = getEmailCodeFactor(signInAttempt.supportedFirstFactors);

      if (!emailCodeFactor) {
        throw new Error("Email-code sign-in is not enabled on this Clerk instance yet.");
      }

      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: emailCodeFactor.emailAddressId
      });

      setFlow("sign-in");
      setEmailAddressId(emailCodeFactor.emailAddressId);
      setSafeIdentifier(emailCodeFactor.safeIdentifier ?? identifier);
      setStep("verify");
      setCode("");
      setNotice({
        tone: "info",
        text: `We sent a 6-digit code to ${emailCodeFactor.safeIdentifier ?? identifier}.`
      });
    } catch (error) {
      if (
        isClerkAPIResponseError(error) &&
        error.errors.some((issue) => issue.code === "form_identifier_not_found")
      ) {
        try {
          await signUp.create({
            emailAddress: identifier,
            password: createGeneratedPassword()
          });
          await signUp.prepareEmailAddressVerification({
            strategy: "email_code"
          });

          setFlow("sign-up");
          setSafeIdentifier(identifier);
          setStep("verify");
          setCode("");
          setNotice({
            tone: "info",
            text: `No judge account existed for ${identifier}, so we started one and sent a 6-digit verification code.`
          });
          return;
        } catch (signUpError) {
          setNotice({
            tone: "error",
            text: getErrorMessage(signUpError)
          });
          return;
        } finally {
          setPending("idle");
        }
      }

      setNotice({
        tone: "error",
        text: getErrorMessage(error)
      });
    } finally {
      setPending("idle");
    }
  }

  async function verifyCode() {
    if (!isLoaded || !signIn || !signUp || !setActive) return;

    const normalizedCode = code.trim();
    if (!normalizedCode) {
      setNotice({
        tone: "error",
        text: "Enter the 6-digit code from your email."
      });
      return;
    }

    setPending("verify");
    setNotice(null);

    try {
      if (flow === "sign-up") {
        const attempt = await signUp.attemptEmailAddressVerification({
          code: normalizedCode
        });

        if (attempt.status !== "complete" || !attempt.createdSessionId) {
          throw new Error("Your judge account still needs another step.");
        }

        await setActive({
          session: attempt.createdSessionId
        });

        setNotice({
          tone: "success",
          text: "Your judge account is ready. Voting controls are now unlocked."
        });
      } else {
        const attempt = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: normalizedCode
        });

        if (attempt.status !== "complete" || !attempt.createdSessionId) {
          throw new Error("Your sign-in needs another step. Please try again.");
        }

        await setActive({
          session: attempt.createdSessionId
        });

        setNotice({
          tone: "success",
          text: "You're signed in. Your voting controls are ready."
        });
      }

      router.refresh();
      afterAuthenticate?.();
    } catch (error) {
      setNotice({
        tone: "error",
        text: getErrorMessage(error)
      });
    } finally {
      setPending("idle");
    }
  }

  async function signInWithGoogle() {
    if (!isLoaded || !signIn) return;

    setPending("google");
    setNotice(null);

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/auth/sso-callback",
        redirectUrlComplete: "/"
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: getErrorMessage(error)
      });
      setPending("idle");
    }
  }

  async function resendCode() {
    if (!isLoaded || !signIn || !signUp) return;

    setPending("email");
    setNotice(null);

    try {
      if (flow === "sign-up") {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code"
        });
      } else {
        if (!emailAddressId) {
          throw new Error("We don't have an email-code session to resend yet.");
        }

        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId
        });
      }

      setNotice({
        tone: "info",
        text: `A fresh code is on the way to ${safeIdentifier ?? email.trim().toLowerCase()}.`
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: getErrorMessage(error)
      });
    } finally {
      setPending("idle");
    }
  }

  function startOver() {
    setFlow("sign-in");
    setStep("identify");
    setCode("");
    setEmailAddressId(null);
    setSafeIdentifier(null);
    setNotice(null);
  }

  return (
    <div className={className}>
      <div>
        <div className="eyebrow">Judge access</div>
        <h3 className="mt-2 font-display text-2xl font-black">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
      </div>

      <div className="mt-6 space-y-4">
        <Button
          className="w-full justify-center"
          disabled={!isLoaded || pending !== "idle"}
          onClick={() => void signInWithGoogle()}
          size="lg"
          type="button"
          variant="outline"
        >
          {pending === "google" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          Or use email code
          <span className="h-px flex-1 bg-border" />
        </div>

        {step === "identify" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void requestEmailCode();
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground" htmlFor="judge-email-input">
                Email address
              </label>
              <Input
                autoComplete="email"
                autoFocus
                id="judge-email-input"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="judge@example.com"
                type="email"
                value={email}
              />
            </div>

            <Button
              className="w-full justify-center"
              data-testid="send-email-code"
              disabled={!isLoaded || pending !== "idle"}
              size="lg"
              type="submit"
            >
              {pending === "email" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Email me a code
            </Button>
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void verifyCode();
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground" htmlFor="judge-code-input">
                Verification code
              </label>
              <Input
                autoComplete="one-time-code"
                autoFocus
                id="judge-code-input"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                value={code}
              />
              <p className="text-xs leading-6 text-muted-foreground">
                Checking in as <span className="font-semibold text-foreground">{safeIdentifier ?? email}</span>
              </p>
              <p className="text-xs leading-6 text-muted-foreground">
                {flow === "sign-up"
                  ? "First time here? Verifying this code creates your judge account and signs you in."
                  : "Existing judge account detected. This code signs you back in without a password."}
              </p>
            </div>

            <Button
              className="w-full justify-center"
              data-testid="verify-email-code"
              disabled={!isLoaded || pending !== "idle"}
              size="lg"
              type="submit"
            >
              {pending === "verify" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Verify and continue
            </Button>

            <div className="flex flex-wrap gap-3">
              <Button
                disabled={!isLoaded || pending !== "idle"}
                onClick={() => void resendCode()}
                type="button"
                variant="ghost"
              >
                <RefreshCcw className="h-4 w-4" />
                Resend code
              </Button>
              <Button disabled={!isLoaded || pending !== "idle"} onClick={startOver} type="button" variant="ghost">
                Use a different email
              </Button>
            </div>
          </form>
        )}

        {notice ? (
          <div
            aria-live="polite"
            className={`rounded-[1.4rem] border px-4 py-3 text-sm leading-7 ${
              notice.tone === "error"
                ? "border-[rgb(204_63_79_/_0.25)] bg-[rgb(204_63_79_/_0.08)] text-foreground"
                : notice.tone === "success"
                  ? "border-radix-teal-a-6 bg-radix-teal-a-3 text-accent-foreground"
                  : "border-border bg-radix-gray-a-3 text-muted-foreground"
            }`}
          >
            {notice.text}
          </div>
        ) : null}

        <div id="clerk-captcha" />
      </div>
    </div>
  );
}
