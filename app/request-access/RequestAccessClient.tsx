"use client";

import { ApplicationForm } from "../apply/ApplicationForm";
import { LoginForm } from "../auth/login/LoginForm";

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
                <div className="[&>form]:mt-0 [&>form]:border-t-0 [&>form]:pt-0">
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
