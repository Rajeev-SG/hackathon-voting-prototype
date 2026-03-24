import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Script from "next/script";

import "@/app/globals.css";
import { FlowsRoot } from "@/app/flows";
import { AnalyticsDataLayer } from "@/components/analytics-data-layer";
import { ConsentManager } from "@/components/consent-manager";
import { ConsentPreferencesButton } from "@/components/consent-preferences-button";
import { GoogleTagScript } from "@/components/google-tag-script";
import { AgentationProvider } from "@/components/providers/agentation-provider";
import { TagManagerScript } from "@/components/tag-manager-script";
import { site } from "@/lib/site";

const fontBody = Inter({
  subsets: ["latin"],
  variable: "--font-body"
});

const fontDisplay = Manrope({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: "Hackathon Voting",
  description: site.description
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

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GTM_SCRIPT_ORIGIN =
  process.env.NEXT_PUBLIC_GTM_SCRIPT_ORIGIN || "https://www.googletagmanager.com";
const SERVER_CONTAINER_URL =
  process.env.NEXT_PUBLIC_SERVER_CONTAINER_URL || `${site.siteUrl.replace(/\/$/, "")}/metrics`;
const LINKER_DOMAINS = Array.from(
  new Set(["rajeevg.com", "vote.rajeevg.com", new URL(site.siteUrl).hostname])
);
const analyticsEnabled = Boolean(GTM_ID || GA_MEASUREMENT_ID);

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {analyticsEnabled ? (
          <Script id="google-consent-default" strategy="beforeInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              window.gtag = function gtag(){window.dataLayer.push(arguments);}
              document.documentElement.dataset.analyticsConsent = 'denied';
              window.gtag('consent', 'default', {
                ad_storage: 'denied',
                analytics_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                functionality_storage: 'granted',
                security_storage: 'granted',
                wait_for_update: 500
              });
            `}
          </Script>
        ) : null}
      </head>
      <body className={`${fontBody.variable} ${fontDisplay.variable}`}>
        {GTM_ID ? <TagManagerScript gtmId={GTM_ID} scriptOrigin={GTM_SCRIPT_ORIGIN} /> : null}
        {!GTM_ID && GA_MEASUREMENT_ID ? (
          <GoogleTagScript
            linkerDomains={LINKER_DOMAINS}
            measurementId={GA_MEASUREMENT_ID}
            serverContainerUrl={SERVER_CONTAINER_URL}
          />
        ) : null}
        <ClerkProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">
              <FlowsRoot userId={userId ?? null}>{children}</FlowsRoot>
            </div>
            {analyticsEnabled ? (
              <footer className="border-t border-border/70">
                <div className="container flex flex-col gap-3 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p>Consented analytics only. Advertising-related consent stays denied.</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      className="transition-colors hover:text-foreground"
                      data-analytics-event="navigation_click"
                      data-analytics-item-name="Privacy policy"
                      data-analytics-item-type="privacy_policy_link"
                      data-analytics-section="footer"
                      href="/privacy"
                    >
                      Privacy policy
                    </Link>
                    <ConsentPreferencesButton
                      className="h-auto px-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
                      data-analytics-event="consent_preferences_reopen"
                      data-analytics-item-name="Privacy settings"
                      data-analytics-item-type="consent_preferences_button"
                      data-analytics-section="footer"
                      label="Privacy settings"
                      size="sm"
                      variant="ghost"
                    />
                  </div>
                </div>
              </footer>
            ) : null}
          </div>
          {analyticsEnabled ? <AnalyticsDataLayer /> : null}
          {analyticsEnabled ? <ConsentManager /> : null}
          <AgentationProvider />
        </ClerkProvider>
      </body>
    </html>
  );
}
