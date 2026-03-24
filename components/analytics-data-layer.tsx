"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  beginAnalyticsPageView,
  getAnalyticsAttributes,
  getLinkAnalyticsDetails,
  getPageAnalyticsContext,
  pushDataLayerEvent,
  sanitizeAnalyticsText,
  type AnalyticsPayload
} from "@/lib/analytics";

const PAGE_SCROLL_MILESTONES = [25, 50, 75, 90];

function getClickEventName(element: HTMLElement, anchor: HTMLAnchorElement | null) {
  if (element.dataset.analyticsEvent) return element.dataset.analyticsEvent;

  if (anchor) {
    try {
      const url = new URL(anchor.href, window.location.href);
      return url.origin === window.location.origin ? "navigation_click" : "outbound_click";
    } catch {
      return "navigation_click";
    }
  }

  if (element.dataset.analyticsSection || element.dataset.analyticsItemType) {
    return "button_click";
  }

  return undefined;
}

export function AnalyticsDataLayer() {
  const pathname = usePathname();

  useEffect(() => {
    const pageViewContext = beginAnalyticsPageView(pathname);
    const pageContext = getPageAnalyticsContext(pathname);
    const baseEventContext: AnalyticsPayload = {
      ...pageViewContext,
      ...pageContext
    };

    let maxPageScrollPercent = 0;
    let interactionCount = 0;
    let summarySent = false;
    let visibleStartAt = document.visibilityState === "visible" ? Date.now() : null;
    let totalVisibleMs = 0;
    const pageScrollSeen = new Set<number>();
    const sectionSeen = new Set<string>();

    pushDataLayerEvent("page_context", {}, { context: baseEventContext });
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_title: pageContext.page_title,
        page_path: pageContext.page_path,
        page_location: pageContext.page_location,
        page_type: pageContext.page_type,
        site_section: pageContext.site_section,
        viewport_category: pageViewContext.viewport_category,
        analytics_consent_state: pageViewContext.analytics_consent_state
      });
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const element = target.closest<HTMLElement>("[data-analytics-event], a, button, [role='button']");
      if (!element) return;

      const anchor = (element.closest("a") as HTMLAnchorElement | null) ?? null;
      const eventName = getClickEventName(element, anchor);
      if (!eventName) return;

      interactionCount += 1;

      pushDataLayerEvent(eventName, {
        interaction_sequence: interactionCount,
        element_tag: element.tagName.toLowerCase(),
        element_text: sanitizeAnalyticsText(element.textContent),
        element_label: element.getAttribute("aria-label") || undefined,
        ...getAnalyticsAttributes(element),
        ...getLinkAnalyticsDetails(anchor?.href)
      });
    };

    const handleScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pageProgress =
        scrollableHeight > 0 ? Math.round((window.scrollY / scrollableHeight) * 100) : 100;
      maxPageScrollPercent = Math.max(maxPageScrollPercent, pageProgress);

      for (const milestone of PAGE_SCROLL_MILESTONES) {
        if (pageProgress >= milestone && !pageScrollSeen.has(milestone)) {
          pageScrollSeen.add(milestone);
          pushDataLayerEvent("scroll_depth", { scroll_depth_percent: milestone });
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;

          const sectionName = entry.target.dataset.analyticsSection;
          if (!sectionName || sectionSeen.has(sectionName)) continue;

          sectionSeen.add(sectionName);
          pushDataLayerEvent("section_view", {
            section_name: sectionName,
            ...getAnalyticsAttributes(entry.target)
          });
        }
      },
      { threshold: 0.55 }
    );

    const flushVisibleTime = () => {
      if (visibleStartAt === null) return;
      totalVisibleMs += Date.now() - visibleStartAt;
      visibleStartAt = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushVisibleTime();
        return;
      }

      if (visibleStartAt === null) {
        visibleStartAt = Date.now();
      }
    };

    const sendPageSummary = () => {
      if (summarySent) return;

      flushVisibleTime();
      summarySent = true;

      pushDataLayerEvent(
        "page_engagement_summary",
        {
          engaged_seconds_total: Math.round(totalVisibleMs / 1000),
          interaction_count: interactionCount,
          section_views_count: sectionSeen.size,
          max_scroll_depth_percent: Math.min(100, Math.round(maxPageScrollPercent))
        },
        { context: baseEventContext }
      );
    };

    document.querySelectorAll<HTMLElement>("[data-analytics-section]").forEach((element) => {
      if (["A", "BUTTON", "INPUT"].includes(element.tagName)) return;
      observer.observe(element);
    });

    document.addEventListener("click", handleClick, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pagehide", sendPageSummary);
    handleScroll();

    return () => {
      sendPageSummary();
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pagehide", sendPageSummary);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
