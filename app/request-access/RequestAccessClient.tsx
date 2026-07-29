"use client";

import { ApplicationForm } from "../apply/ApplicationForm";
import { LoginForm } from "../auth/login/LoginForm";
import { tierConfig } from "../_data/tiers";

export function RequestAccessClient({
    initialTab: requestedTab,
    mode,
}: {
    initialTab?: string;
    mode?: string;
}) {
    const isSignIn = requestedTab === "signin";

    return (
        <div className="border border-cabeus-line bg-cabeus-paper p-5 md:p-8">
            {!isSignIn ? (
                <div>
                    <p className="brand-kicker">Sign up / Free membership selected</p>
                    <h2 className="mt-3 font-serif text-4xl text-cabeus-ink">
                        {tierConfig.explorer.publicName}
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-cabeus-muted">
                        Create a free Explorer account using any email domain and
                        choose the address where you want to receive member
                        intelligence. Verify that address before the application is
                        reviewed.
                    </p>
                    <ApplicationForm />
                </div>
            ) : (
                <div>
                    <p className="brand-kicker">Sign in</p>
                    <h2 className="mt-3 font-serif text-4xl text-cabeus-ink">
                        Welcome back
                    </h2>
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
