"use client";

import { useEffect, useState } from "react";
import { cookieCategories } from "../../_data/trust";

type CookiePreferences = {
    preferences: boolean;
    analytics: boolean;
};

const storageKey = "potomac-cookie-preferences";

function readPreferences(): CookiePreferences {
    if (typeof window === "undefined") {
        return {
            preferences: false,
            analytics: false,
        };
    }

    try {
        const stored = window.localStorage.getItem(storageKey);

        if (!stored) {
            return {
                preferences: false,
                analytics: false,
            };
        }

        const parsed = JSON.parse(stored) as Partial<CookiePreferences>;

        return {
            preferences: Boolean(parsed.preferences),
            analytics: Boolean(parsed.analytics),
        };
    } catch {
        return {
            preferences: false,
            analytics: false,
        };
    }
}

export function CookiePreferenceControl() {
    const [preferences, setPreferences] = useState<CookiePreferences>({
        preferences: false,
        analytics: false,
    });
    const [savedAt, setSavedAt] = useState<string | null>(null);

    useEffect(() => {
        setPreferences(readPreferences());
    }, []);

    function savePreferences(nextPreferences: CookiePreferences) {
        setPreferences(nextPreferences);
        window.localStorage.setItem(storageKey, JSON.stringify(nextPreferences));
        setSavedAt(new Date().toLocaleString());
    }

    return (
        <section className="glass-card rounded p-5">
            <div className="border-b border-white/10 pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Cookie preferences
                </p>
                <h2 className="mt-2 font-serif text-2xl text-white">
                    Consent controls
                </h2>
            </div>
            <div className="mt-5 grid gap-4">
                {cookieCategories.map((category) => (
                    <label
                        key={category.id}
                        className="flex gap-3 rounded border border-white/10 p-4"
                    >
                        <input
                            type="checkbox"
                            checked={
                                category.required ||
                                preferences[
                                    category.id as keyof CookiePreferences
                                ] === true
                            }
                            disabled={category.required}
                            onChange={(event) =>
                                savePreferences({
                                    ...preferences,
                                    [category.id]: event.target.checked,
                                })
                            }
                            className="mt-1 h-4 w-4 rounded border-white/20 bg-potomac-primary text-potomac-gold"
                        />
                        <span>
                            <span className="block text-sm font-bold text-white">
                                {category.label}
                            </span>
                            <span className="mt-1 block text-sm leading-6 text-potomac-cream/65">
                                {category.detail}
                            </span>
                            {category.required ? (
                                <span className="mt-2 block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                    Always on
                                </span>
                            ) : null}
                        </span>
                    </label>
                ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() =>
                        savePreferences({
                            preferences: true,
                            analytics: true,
                        })
                    }
                    className="rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                >
                    Accept optional
                </button>
                <button
                    type="button"
                    onClick={() =>
                        savePreferences({
                            preferences: false,
                            analytics: false,
                        })
                    }
                    className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                >
                    Essential only
                </button>
            </div>
            {savedAt ? (
                <p className="mt-4 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                    Saved {savedAt}
                </p>
            ) : null}
        </section>
    );
}
