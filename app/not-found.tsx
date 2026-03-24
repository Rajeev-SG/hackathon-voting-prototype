import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container flex min-h-screen items-center justify-center py-16">
      <div className="glass-panel w-full max-w-xl rounded-[2rem] p-8 text-center">
        <div className="eyebrow">Page not found</div>
        <h1 className="mt-3 font-display text-3xl font-black">Back to the scoreboard</h1>
        <p className="mt-4 text-base leading-8 text-muted-foreground">
          This app is designed around a single public scoreboard. Head back to the main board to keep judging.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-radix-teal-a-4 px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:bg-radix-teal-a-5"
        >
          Open the scoreboard
        </Link>
      </div>
    </main>
  );
}
