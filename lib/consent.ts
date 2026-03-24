export type ConsentChoice = "granted" | "denied";
export type ConsentSource = "default" | "banner_accept" | "banner_decline" | "preferences";

export type ConsentState = {
  analytics_storage: ConsentChoice;
  ad_storage: ConsentChoice;
  ad_user_data: ConsentChoice;
  ad_personalization: ConsentChoice;
  functionality_storage: "granted";
  security_storage: "granted";
  updated_at: string;
  source: ConsentSource;
};

export const CONSENT_STORAGE_KEY = "hackathon-voting:analytics-consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function isConsentChoice(value: unknown): value is ConsentChoice {
  return value === "granted" || value === "denied";
}

function setConsentDataset(state: ConsentState) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.analyticsConsent = state.analytics_storage;
}

function normalizeStoredConsentState(value: unknown): ConsentState | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<ConsentState>;
  if (!isConsentChoice(candidate.analytics_storage)) return null;

  return createConsentState({
    analyticsStorage: candidate.analytics_storage,
    source:
      candidate.source && candidate.source !== "default" ? candidate.source : "preferences",
    updatedAt: typeof candidate.updated_at === "string" ? candidate.updated_at : undefined
  });
}

export function createConsentState(options: {
  analyticsStorage: ConsentChoice;
  source: ConsentSource;
  updatedAt?: string;
}): ConsentState {
  return {
    analytics_storage: options.analyticsStorage,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    updated_at: options.updatedAt ?? new Date().toISOString(),
    source: options.source
  };
}

export function readStoredConsentState() {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!rawValue) return null;

    return normalizeStoredConsentState(JSON.parse(rawValue));
  } catch {
    return null;
  }
}

export function persistConsentState(state: ConsentState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
}

export function applyGoogleConsentState(state: ConsentState) {
  if (typeof window === "undefined") return;

  setConsentDataset(state);
  window.gtag?.("consent", "update", {
    analytics_storage: state.analytics_storage,
    ad_storage: state.ad_storage,
    ad_user_data: state.ad_user_data,
    ad_personalization: state.ad_personalization,
    functionality_storage: state.functionality_storage,
    security_storage: state.security_storage
  });
}

export function hasAnalyticsConsent(state: ConsentState | null | undefined) {
  return state?.analytics_storage === "granted";
}
