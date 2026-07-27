"use client";

import { useState } from "react";
import { ApplicationForm } from "../apply/ApplicationForm";
import { LoginForm } from "../auth/login/LoginForm";
import { tierConfig } from "../_data/tiers";

type AccessTab = "signup" | "signin";

function initialTab(value: string | null): AccessTab {
    return value === "signin" ? "signin" : "signup";
}

export function RequestAccessClient({
    initialTab: requestedTab,
    mode,
}: {
    initialTab?: string;
    mode?: string;
}) {
    const [tab, setTab] = useState<AccessTab>(() => initialTab(requestedTab ?? null));

    return (
        <div className="glass-card rounded p-6">
            <div
                role="tablist"
                aria-label="Member access"
                className="grid grid-cols-2 gap-2"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "signup"}
                    onClick={() => setTab("signup")}
                    className={`min-h-11 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                        tab === "signup"
                            ? "bg-potomac-gold text-potomac-primary"
                            : "border border-potomac-gold/40 text-potomac-gold hover:border-potomac-gold"
                    }`}
                >
                    Sign up
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "signin"}
                    onClick={() => setTab("signin")}
                    className={`min-h-11 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                        tab === "signin"
                            ? "bg-potomac-gold text-potomac-primary"
                            : "border border-potomac-gold/40 text-potomac-gold hover:border-potomac-gold"
                    }`}
                >
                    Sign in
                </button>
            </div>
            {tab === "signup" ? (
                <div role="tabpanel" className="mt-6">
                    <div className="border-b border-white/10 pb-5">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                            Free membership selected
                        </p>
                        <h2 className="mt-2 font-serif text-3xl text-white">
                            {tierConfig.explorer.publicName}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                            Create a free Explorer account with any email domain.
                            You will verify your email before the application is reviewed.
                        </p>
                    </div>
                    <ApplicationForm onSwitchToSignIn={() => setTab("signin")} />
                </div>
            ) : (
                <div role="tabpanel" className="mt-6">
                    <LoginForm
                        initialMode={
                            mode === "reset" || mode === "recovery"
                                ? mode
                                : "magic-link"
                        }
                    />
                </div>
            )}
        </div>
    );
}
