import type { Metadata } from "next";
import { RequestAccessClient } from "./RequestAccessClient";

export const metadata: Metadata = {
    title: "Request Access",
    description:
        "Sign in or request free Explorer access to Cabeus Explorer lunar intelligence.",
    alternates: {
        canonical: "/request-access",
    },
};

export default async function RequestAccessPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string; mode?: string }>;
}) {
    const params = await searchParams;
    const isSignIn = params.tab === "signin";

    return (
        <section className="border-b border-cabeus-line bg-cabeus-paper">
            <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-[92rem] items-start gap-10 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[0.72fr_1.28fr]">
                <div>
                    <p className="brand-kicker">
                        {isSignIn ? "Member access" : "The Cabeus Council"}
                    </p>
                    <h1 className="mt-5 max-w-[11ch] text-balance font-serif text-5xl leading-[0.95] text-cabeus-ink md:text-7xl">
                        {isSignIn
                            ? "Sign in to Cabeus Explorer."
                            : "Become a Cabeus Explorer."}
                    </h1>
                    <p className="mt-6 max-w-xl text-base leading-7 text-cabeus-muted md:text-lg md:leading-8">
                        {isSignIn
                            ? "Use a secure email link or your password to return to the member workspace."
                            : "Sign up for free Cabeus Explorer content. No paywall. No pop-ups. No agenda. Just verify your email."}
                    </p>
                </div>
                <RequestAccessClient initialTab={params.tab} mode={params.mode} />
            </div>
        </section>
    );
}
