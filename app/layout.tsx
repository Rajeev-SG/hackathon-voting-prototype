import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";

import "@/app/globals.css";
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
  title: "Hackathon Voting Prototype",
  description: "Navigable frontend prototype for hackathon project submission and judging."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className="dark" lang="en">
      <body className={`${fontBody.variable} ${fontDisplay.variable}`}>
        {children}
        <AgentationProvider />
      </body>
    </html>
  );
}
