"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SsoCallbackPage() {
  return (
    <main className="shell-surface flex min-h-screen items-center justify-center px-6 py-12">
      <div className="glass-panel w-full max-w-lg rounded-[2rem] p-8 text-center">
        <div className="eyebrow">Redirecting</div>
        <h1 className="mt-3 font-display text-3xl font-black">Finishing sign-in</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Clerk is bringing you back to the scoreboard.
        </p>
        <div className="sr-only">
          <AuthenticateWithRedirectCallback />
        </div>
      </div>
    </main>
  );
}
