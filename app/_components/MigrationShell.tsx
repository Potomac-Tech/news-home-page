import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { potomacBrand } from "../_data/brand";
import { externalChannels } from "../_data/channels";
import { trustRoutes } from "../_data/trust";
import {
    fallbackCommandEntries,
    getSearchSupabaseClient,
    loadCommandPaletteEntries,
} from "../_data/search";
import { getProfileGateContext } from "../../lib/auth/profile-completion";
import { SearchCommandPalette } from "./SearchCommandPalette";
import { CheckoutAnalytics } from "./CheckoutAnalytics";

const primaryNavItems: Array<{
    href: string;
    label: string;
}> = [
    { href: "/", label: "Home Base" },
    { href: "/terminal", label: "Intelligence" },
    { href: "/pricing", label: "Council" },
];

const conveningNavItems = [
    { href: "/space-industrialist-week", label: "Space Industrialist Week" },
    { href: "/space-investment-forum", label: "Space Investment Forum" },
    { href: "/cabeus-games", label: "Cabeus Games" },
    { href: "/events", label: "All convenings" },
];

const footerNavItems = [
    { href: "/terminal", label: "Intelligence" },
    { href: "/archives", label: "News archives" },
    { href: "/tracker/launches", label: "Launches & Missions" },
    { href: "/calculators", label: "Calculators" },
    { href: "/datasets", label: "Data" },
];

const companyNavItems = [
    { href: "/team", label: "About" },
    { href: "/authors", label: "Author biographies" },
    { href: "/contact", label: "Contact & standards" },
    { href: "/legal/terms", label: "Terms" },
];

const newsletterHref = "/newsletter";

async function MemberAwareSearchPalette() {
    let profileGate = null;
    let commandEntries = fallbackCommandEntries.filter(
        (entry) => entry.tier === "public"
    );

    try {
        const supabase = await getSearchSupabaseClient();
        profileGate = supabase
            ? await getProfileGateContext({ supabase, nextPath: "/" })
            : null;
        commandEntries = await loadCommandPaletteEntries({
            supabase,
            publicOnly: profileGate?.state !== "ready",
        });
    } catch {
        // Navigation remains public and usable if an optional Supabase lookup fails.
    }

    return <SearchCommandPalette entries={commandEntries} />;
}

const publicCommandEntries = fallbackCommandEntries.filter(
    (entry) => entry.tier === "public"
);

export function MigrationShell({ children }: { children: ReactNode }) {

    return (
        <div className="brand-shell min-h-screen">
            <CheckoutAnalytics />
            <header className="sticky top-0 z-40 border-b border-cabeus-line bg-cabeus-paper/95 backdrop-blur-xl">
                <div className="mx-auto w-full max-w-[92rem] px-4 md:px-8">
                    <div className="flex min-h-[5.75rem] items-center justify-between gap-6">
                        <Link href="/" aria-label="Cabeus Explorer home">
                            <span className="brand-wordmark text-[0.68rem] sm:text-[0.78rem]">
                                <span>Cabeus</span>
                                <span>Explorer</span>
                            </span>
                        </Link>
                        <nav
                            aria-label="Primary navigation"
                            className="hidden items-center gap-7 lg:flex"
                        >
                            {primaryNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="font-sans text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-cabeus-ink transition hover:text-cabeus-gold"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <details className="group relative">
                                <summary className="cursor-pointer list-none font-sans text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-cabeus-ink transition hover:text-cabeus-gold">
                                    Convenings
                                </summary>
                                <div className="absolute left-1/2 top-full mt-5 w-64 -translate-x-1/2 border border-cabeus-line bg-cabeus-paper p-2 shadow-xl">
                                    {conveningNavItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="block border-b border-cabeus-line px-3 py-3 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-cabeus-ink last:border-b-0 hover:bg-cabeus-smoke"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </details>
                            <Link
                                href={newsletterHref}
                                className="font-sans text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-cabeus-ink transition hover:text-cabeus-gold"
                            >
                                Newsletter
                            </Link>
                        </nav>
                        <div className="flex items-center justify-end gap-2">
                            <Suspense fallback={<SearchCommandPalette entries={publicCommandEntries} />}>
                                <MemberAwareSearchPalette />
                            </Suspense>
                            <Link
                                href="/request-access?tab=signin"
                                className="brand-button brand-button-outline hidden sm:inline-flex"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/request-access"
                                className="brand-button hidden md:inline-flex"
                            >
                                Join Council
                            </Link>
                        </div>
                    </div>
                    <details className="border-t border-cabeus-line lg:hidden">
                        <summary className="cursor-pointer py-3 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-cabeus-ink">
                            Menu
                        </summary>
                        <nav aria-label="Mobile navigation" className="grid border-t border-cabeus-line pb-3">
                            {[...primaryNavItems, ...conveningNavItems].map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="border-b border-cabeus-line px-1 py-3 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-cabeus-ink"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <Link
                                href={newsletterHref}
                                className="px-1 py-3 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-cabeus-ink"
                            >
                                Newsletter
                            </Link>
                            <Link
                                href="/request-access?tab=signin"
                                className="border-t border-cabeus-line px-1 py-3 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-cabeus-ink"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/request-access"
                                className="px-1 py-3 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-cabeus-ink"
                            >
                                Join Council
                            </Link>
                        </nav>
                    </details>
                </div>
            </header>
            <main>{children}</main>
            <footer className="border-t border-cabeus-line bg-cabeus-paper">
                <div className="mx-auto grid w-full max-w-[92rem] gap-10 px-4 py-12 md:px-8 lg:grid-cols-[1.15fr_0.75fr_0.75fr_1fr]">
                    <div>
                        <span className="brand-wordmark">
                            <span>Cabeus</span>
                            <span>Explorer</span>
                        </span>
                        <p className="mt-6 max-w-xs font-serif text-2xl leading-tight text-cabeus-ink">
                            Intelligence for the space industrialist.
                        </p>
                        <nav
                            aria-label="Legal and trust"
                            className="mt-7 flex flex-wrap gap-x-4 gap-y-2"
                        >
                            {trustRoutes.map((route) => (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className="font-sans text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-cabeus-muted transition hover:text-cabeus-ink"
                                >
                                    {route.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <nav aria-label="Platform routes">
                        <p className="brand-kicker text-cabeus-ink">Platform</p>
                        <div className="mt-5 grid gap-3">
                            {footerNavItems.map((route) => (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className="text-sm text-cabeus-muted transition hover:text-cabeus-ink"
                                >
                                    {route.label}
                                </Link>
                            ))}
                        </div>
                    </nav>
                    <nav aria-label="Company routes">
                        <p className="brand-kicker text-cabeus-ink">Company</p>
                        <div className="mt-5 grid gap-3">
                            {companyNavItems.map((route) => (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className="text-sm text-cabeus-muted transition hover:text-cabeus-ink"
                                >
                                    {route.label}
                                </Link>
                            ))}
                        </div>
                    </nav>
                    <div>
                        <p className="brand-kicker text-cabeus-ink">Moonberg</p>
                        <p className="mt-5 max-w-xs font-serif text-2xl leading-tight text-cabeus-ink">
                            Free for approved Explorer members.
                        </p>
                        <Link href={newsletterHref} className="brand-button brand-button-outline mt-6 inline-flex">
                            Get Moonberg
                        </Link>
                        <nav aria-label="External channels" className="mt-6 flex flex-wrap gap-4">
                        {externalChannels.map((channel) => (
                            <a
                                key={channel.id}
                                href={channel.href!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-sans text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-cabeus-muted hover:text-cabeus-ink"
                            >
                                {channel.label}
                            </a>
                        ))}
                        </nav>
                    </div>
                </div>
                <div className="mx-auto flex w-full max-w-[92rem] flex-wrap justify-between gap-3 border-t border-cabeus-line px-4 py-5 text-xs text-cabeus-muted md:px-8">
                    <span>&copy; 2026 Cabeus Explorer</span>
                    <span>{potomacBrand.identity.essence}</span>
                </div>
            </footer>
        </div>
    );
}
