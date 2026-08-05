export const cookiePreferenceStorageKey = "potomac-cookie-preferences";
export const consentChangedEvent = "potomac:consent-changed";

export type CookiePreferences = {
    preferences: boolean;
    analytics: boolean;
};

export function readCookiePreferences(): CookiePreferences {
    if (typeof window === "undefined") return { preferences: false, analytics: false };
    try {
        const stored = window.localStorage.getItem(cookiePreferenceStorageKey);
        if (!stored) return { preferences: false, analytics: false };
        const parsed = JSON.parse(stored) as Partial<CookiePreferences>;
        return { preferences: Boolean(parsed.preferences), analytics: Boolean(parsed.analytics) };
    } catch {
        return { preferences: false, analytics: false };
    }
}
