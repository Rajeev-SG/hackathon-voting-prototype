"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { beginAnalyticsPageView, getPageAnalyticsContext, pushDataLayerEvent } from "@/lib/analytics";
import {
  applyGoogleConsentState,
  createConsentState,
  hasAnalyticsConsent,
  persistConsentState,
  readStoredConsentState,
  type ConsentChoice,
  type ConsentSource,
  type ConsentState
} from "@/lib/consent";

function createPageContextPayload() {
  const searchString = window.location.search;
  const queryParamCount = searchString ? new URLSearchParams(searchString).size : 0;

  return {
    query_param_count: queryParamCount,
    consent_rehydrated: true
  };
}

export function ConsentManager() {
  const analyticsEnabled = useMemo(
    () => Boolean(process.env.NEXT_PUBLIC_GTM_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
    []
  );
  const [consentState, setConsentState] = useState<ConsentState | null>(null);
  const [isBannerOpen, setIsBannerOpen] = useState(false);

  useEffect(() => {
    if (!analyticsEnabled) return;

    const storedConsentState = readStoredConsentState();

    if (storedConsentState) {
      applyGoogleConsentState(storedConsentState);
      setConsentState(storedConsentState);
      return;
    }

    const defaultState = createConsentState({
      analyticsStorage: "denied",
      source: "default"
    });

    applyGoogleConsentState(defaultState);
    setConsentState(defaultState);
    setIsBannerOpen(true);
  }, [analyticsEnabled]);

  const updateConsent = (analyticsStorage: ConsentChoice, source: ConsentSource) => {
    const nextConsentState = createConsentState({ analyticsStorage, source });

    persistConsentState(nextConsentState);
    applyGoogleConsentState(nextConsentState);
    setConsentState(nextConsentState);
    setIsBannerOpen(false);

    pushDataLayerEvent("consent_state_updated", {
      consent_source: source,
      consent_preference: analyticsStorage,
      consent_updated_at: nextConsentState.updated_at,
      analytics_storage: nextConsentState.analytics_storage,
      ad_storage: nextConsentState.ad_storage,
      ad_user_data: nextConsentState.ad_user_data,
      ad_personalization: nextConsentState.ad_personalization
    });

    if (nextConsentState.analytics_storage === "granted") {
      pushDataLayerEvent("page_context", createPageContextPayload(), {
        context: {
          ...beginAnalyticsPageView(window.location.pathname),
          ...getPageAnalyticsContext(window.location.pathname)
        }
      });
    }
  };

  const openPreferences = useCallback(() => {
    setIsBannerOpen(true);
    pushDataLayerEvent("consent_preferences_open", {
      consent_preference: consentState?.analytics_storage ?? "denied"
    });
  }, [consentState?.analytics_storage]);

  useEffect(() => {
    if (!analyticsEnabled) return;

    const handleOpenPreferences = () => {
      openPreferences();
    };

    window.addEventListener("analytics-consent:open", handleOpenPreferences);

    return () => {
      window.removeEventListener("analytics-consent:open", handleOpenPreferences);
    };
  }, [analyticsEnabled, openPreferences]);

  if (!analyticsEnabled) return null;

  return (
    <>
      {isBannerOpen ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 px-3 sm:bottom-4 sm:px-4">
          <Card className="pointer-events-auto mx-auto max-w-xl border-border/80 bg-background/95 shadow-lg backdrop-blur">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="space-y-1.5">
                <CardTitle className="text-sm sm:text-base">Analytics preferences</CardTitle>
                <CardDescription className="max-w-lg text-xs leading-5 sm:text-sm sm:leading-5">
                  Allow consented analytics for turnout, judging flow, and scoreboard interaction
                  reporting. Advertising-related consent stays denied.
                </CardDescription>
                <Link
                  className="inline-flex text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground sm:text-sm"
                  data-analytics-event="navigation_click"
                  data-analytics-item-name="Privacy policy"
                  data-analytics-item-type="privacy_policy_link"
                  data-analytics-section="consent_banner"
                  href="/privacy"
                >
                  Read the privacy policy
                </Link>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  className="h-10 px-4 text-sm"
                  onClick={() => updateConsent("denied", "banner_decline")}
                  type="button"
                  variant="outline"
                >
                  Necessary only
                </Button>
                <Button
                  className="h-10 px-4 text-sm"
                  onClick={() => updateConsent("granted", "banner_accept")}
                  type="button"
                >
                  Allow analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
