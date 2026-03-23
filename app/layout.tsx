import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import "@/app/globals.css";
import { FlowsRoot } from "@/app/flows";
import { AgentationProvider } from "@/components/providers/agentation-provider";

const fontBody = Inter({
  subsets: ["latin"],
  variable: "--font-body"
});

const fontDisplay = Manrope({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Hackathon Voting",
  description: "Single-screen public scoreboard with manager uploads and authenticated hackathon judging."
};

const themeInitScript = `
(() => {
  try {
    const stored = window.localStorage.getItem("hackathon-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", isDark);
  } catch (error) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${fontBody.variable} ${fontDisplay.variable}`}>
        <ClerkProvider>
          <FlowsRoot userId={userId ?? null}>{children}</FlowsRoot>
          <AgentationProvider />
        </ClerkProvider>
      </body>
    </html>
  );
}
