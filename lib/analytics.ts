type AnalyticsValue = string | number | boolean | null | undefined;

export type AnalyticsPayload = Record<string, AnalyticsValue>;

type AnalyticsEventOptions = {
  context?: AnalyticsPayload;
};

let browserSessionId: string | undefined;
let currentPagePathname: string | undefined;
let currentPageViewId: string | undefined;
let pageViewSequence = 0;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

function getAnalyticsConsentState() {
  return document.documentElement.dataset.analyticsConsent || "denied";
}

function compactPayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ) as AnalyticsPayload;
}

export function sanitizeAnalyticsText(value: string | null | undefined, maxLength = 160) {
  if (!value) return undefined;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function createAnalyticsId(prefix: string) {
  const randomValue =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2, 12);

  return `${prefix}_${randomValue.slice(0, 12)}`;
}

function toSnakeCase(value: string) {
  return value.replace(/([A-Z])/g, "_$1").replace(/^_/, "").toLowerCase();
}

function normalizeAnalyticsValue(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function getScopedAnalyticsAttributes(element: HTMLElement, scope: "analytics", ignoredKeys: string[] = []) {
  const payload: Record<string, AnalyticsValue> = {};

  for (const [key, value] of Object.entries(element.dataset)) {
    if (!key.startsWith(scope)) continue;
    if (ignoredKeys.includes(key) || value === undefined) continue;

    const normalized = key.slice(scope.length);
    if (!normalized) continue;

    payload[toSnakeCase(normalized)] = normalizeAnalyticsValue(value);
  }

  return payload;
}

function ensureBrowserSession() {
  browserSessionId = browserSessionId || createAnalyticsId("session");
  return browserSessionId;
}

function ensurePageView(pathname = window.location.pathname) {
  ensureBrowserSession();

  if (!currentPageViewId || currentPagePathname !== pathname) {
    currentPagePathname = pathname;
    currentPageViewId = createAnalyticsId("pv");
    pageViewSequence += 1;
  }

  return currentPageViewId;
}

function getViewportCategory(width: number) {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getColorSchemePreference() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getActiveTheme() {
  const theme = document.documentElement.dataset.theme;
  if (theme) return theme;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getRouteLabel(pathname: string) {
  if (pathname === "/") return "scoreboard";
  if (pathname === "/privacy") return "privacy_policy";
  if (pathname.startsWith("/auth")) return "auth";
  return "page";
}

function getReferrerContext(): AnalyticsPayload {
  if (!document.referrer) return {};

  try {
    const url = new URL(document.referrer);
    const isInternal = url.origin === window.location.origin;

    return compactPayload({
      referrer: url.href,
      referrer_host: url.host,
      referrer_path: isInternal ? `${url.pathname}${url.search}${url.hash}` : undefined,
      referrer_type: isInternal ? "internal" : "external"
    });
  } catch {
    return { referrer: document.referrer };
  }
}

function getRuntimeAnalyticsContext(pathname = window.location.pathname): AnalyticsPayload {
  ensurePageView(pathname);

  const { width: screenWidth, height: screenHeight } = window.screen;

  return compactPayload({
    browser_session_id: browserSessionId,
    page_view_id: currentPageViewId,
    page_view_sequence: pageViewSequence,
    analytics_consent_state: getAnalyticsConsentState(),
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    viewport_category: getViewportCategory(window.innerWidth),
    screen_width: screenWidth || undefined,
    screen_height: screenHeight || undefined,
    screen_orientation: screenWidth > screenHeight ? "landscape" : "portrait",
    device_pixel_ratio: window.devicePixelRatio || undefined,
    language: navigator.language || undefined,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
    color_scheme: getColorSchemePreference(),
    theme: getActiveTheme()
  });
}

export function beginAnalyticsPageView(pathname = window.location.pathname): AnalyticsPayload {
  if (typeof window === "undefined") return {};
  return getRuntimeAnalyticsContext(pathname);
}

export function getPageAnalyticsContext(pathname = window.location.pathname): AnalyticsPayload {
  const routeDepth = pathname.split("/").filter(Boolean).length;

  return compactPayload({
    page_title: document.title,
    page_path: pathname,
    page_location: window.location.href,
    page_type: getRouteLabel(pathname),
    site_section: pathname === "/privacy" ? "legal" : "judging",
    route_depth: routeDepth,
    ...getReferrerContext()
  });
}

export function getAnalyticsAttributes(element: HTMLElement): AnalyticsPayload {
  return getScopedAnalyticsAttributes(element, "analytics", ["analyticsEvent"]);
}

export function getLinkAnalyticsDetails(href?: string | null): AnalyticsPayload {
  if (!href) return {};

  try {
    const url = new URL(href, window.location.href);
    const isMailto = url.protocol === "mailto:";
    const isInternal = url.origin === window.location.origin;

    return compactPayload({
      link_url: url.href,
      link_host: url.host,
      link_path: isMailto ? undefined : `${url.pathname}${url.search}${url.hash}`,
      link_type: isMailto ? "mailto" : isInternal ? "internal" : "external",
      outbound: !isInternal && !isMailto
    });
  } catch {
    return {};
  }
}

export function pushDataLayerEvent(
  event: string,
  payload: AnalyticsPayload = {},
  options: AnalyticsEventOptions = {}
) {
  if (typeof window === "undefined") return;

  const defaultContext = {
    ...getRuntimeAnalyticsContext(),
    ...getPageAnalyticsContext()
  };

  const eventPayload = compactPayload({
    event,
    event_source: "hackathon_voting_app",
    event_timestamp: new Date().toISOString(),
    ...defaultContext,
    ...(options.context ?? {}),
    ...payload
  });

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(eventPayload);

  if (typeof window.gtag === "function") {
    const gtagPayload = { ...eventPayload };
    delete gtagPayload.event;
    window.gtag("event", event, gtagPayload);
  }
}
