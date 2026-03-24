import type { Metadata } from "next";
import Link from "next/link";

import { ConsentPreferencesButton } from "@/components/consent-preferences-button";
import { Card, CardContent } from "@/components/ui/card";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} handles analytics, consent, and event data.`,
  alternates: { canonical: "/privacy" }
};

export default function PrivacyPage() {
  return (
    <main className="container py-8 sm:py-10">
      <section
        className="glass-panel space-y-8 rounded-[2rem] p-6 sm:p-8"
        data-analytics-item-type="page_section"
        data-analytics-page-content-group="legal"
        data-analytics-page-content-type="privacy_policy"
        data-analytics-section="privacy_policy"
      >
        <div className="space-y-3">
          <p className="eyebrow">Privacy</p>
          <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">Privacy policy</h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            This app uses consented analytics to understand judging flow, turnout, and event
            engagement. Advertising-related consent stays denied, and analytics storage only turns
            on after you explicitly allow it.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <ConsentPreferencesButton label="Open privacy settings" size="sm" variant="outline" />
          <Link
            className="underline underline-offset-4 transition-colors hover:text-foreground"
            data-analytics-event="contact_click"
            data-analytics-item-name="Privacy contact"
            data-analytics-item-type="email_link"
            data-analytics-section="privacy_policy"
            href="mailto:rajeev.sgill@gmail.com"
          >
            Contact: rajeev.sgill@gmail.com
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/70 bg-card/60">
            <CardContent className="space-y-3 p-6">
              <h2 className="text-lg font-semibold">What gets collected</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>page views, referrers, and device and viewport context</li>
                <li>scoreboard interactions like auth opens, view toggles, and vote-modal views</li>
                <li>manager actions such as workbook upload, round open, entry pause, and finalization</li>
                <li>consent state changes so reporting reflects your preference</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/60">
            <CardContent className="space-y-3 p-6">
              <h2 className="text-lg font-semibold">What does not happen</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>advertising consent is not enabled through this app</li>
                <li>analytics storage is not granted until you opt in</li>
                <li>judge scores are not written to analytics as personal content payloads</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5 text-sm leading-7 text-muted-foreground">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">1. Data controller</h2>
            <p>
              Rajeev Gill operates this app at{" "}
              <Link className="underline underline-offset-4" href={site.siteUrl}>
                {site.siteUrl.replace(/^https?:\/\//, "")}
              </Link>
              . For privacy questions, requests, or corrections, use{" "}
              <Link className="underline underline-offset-4" href="mailto:rajeev.sgill@gmail.com">
                rajeev.sgill@gmail.com
              </Link>.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">2. Legal basis</h2>
            <p>
              Essential site operation and security use necessary storage. Analytics measurement is
              based on consent. If you decline analytics, the app keeps analytics storage denied.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">3. Analytics stack</h2>
            <p>
              This app uses Google Tag Manager, Google Analytics 4, a server-side GTM endpoint, and
              Vercel-hosted infrastructure to collect consented interaction data. Reporting and
              warehouse analysis may also flow through Google Cloud services including BigQuery and
              Looker Studio.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">4. Cookies and local storage</h2>
            <p>
              The app stores your consent preference locally so it can respect your choice on future
              visits. If you grant analytics, Google Analytics cookies may be set. If you deny
              analytics, analytics storage remains denied.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">5. Third-party processors</h2>
            <p>
              Depending on your consent choice, data may be processed by Google and Vercel as service
              providers for analytics delivery, reporting, and hosting.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">6. Your choices</h2>
            <p>
              You can reopen privacy settings at any time from the app footer and switch between
              necessary-only and analytics-enabled measurement. You can also clear relevant cookies
              and local storage in your browser.
            </p>
          </div>
        </div>

        <p className="text-xs leading-6 text-muted-foreground">
          This page is a practical event-app privacy policy, not legal advice. If you need a
          jurisdiction-specific compliance review, use qualified legal counsel.
        </p>
      </section>
    </main>
  );
}
