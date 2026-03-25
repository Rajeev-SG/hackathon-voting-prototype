"use client";

import { useAuth, useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

function getErrorMessage(error: unknown) {
  if (isClerkAPIResponseError(error) && error.errors[0]?.longMessage) {
    return error.errors[0].longMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "We couldn't activate that proof session.";
}

function isAlreadySignedInError(error: unknown) {
  if (!isClerkAPIResponseError(error)) {
    return false;
  }

  return error.errors.some((entry) => {
    const code = entry.code?.toLowerCase() ?? "";
    const message = entry.longMessage?.toLowerCase() ?? "";
    return code.includes("session") || message.includes("already signed in");
  });
}

function TicketHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded: isAuthLoaded, userId } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [message, setMessage] = React.useState("Activating session...");
  const hasRun = React.useRef(false);

  React.useEffect(() => {
    const redirect = searchParams.get("redirect") ?? "/";

    if (!isAuthLoaded || !userId) {
      return;
    }

    router.replace(redirect);
    router.refresh();
  }, [isAuthLoaded, router, searchParams, userId]);

  React.useEffect(() => {
    const token = searchParams.get("token") ?? searchParams.get("__clerk_ticket");
    const redirect = searchParams.get("redirect") ?? "/";

    if (!isLoaded || !signIn || !setActive || hasRun.current) return;
    hasRun.current = true;

    if (!token) {
      setMessage("No sign-in ticket was provided.");
      return;
    }

    void (async () => {
      try {
        const attempt = await signIn.create({
          strategy: "ticket",
          ticket: token
        });

        if (attempt.status !== "complete" || !attempt.createdSessionId) {
          throw new Error("The proof sign-in ticket needs another step.");
        }

        await setActive({
          session: attempt.createdSessionId
        });
        router.replace(redirect);
        router.refresh();
      } catch (error) {
        if (isAlreadySignedInError(error)) {
          router.replace(redirect);
          router.refresh();
          return;
        }

        setMessage(getErrorMessage(error));
      }
    })();
  }, [isLoaded, router, searchParams, setActive, signIn]);

  return (
    <main className="shell-surface flex min-h-screen items-center justify-center px-6 py-12">
      <div className="glass-panel w-full max-w-lg rounded-[2rem] p-8 text-center">
        <div className="eyebrow">Proof session</div>
        <h1 className="mt-3 font-display text-3xl font-black">Signing you in</h1>
        <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-radix-gray-a-3 px-5 py-3 text-sm font-medium text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          {message}
        </div>
      </div>
    </main>
  );
}

export default function TicketPage() {
  return <TicketHandler />;
}
