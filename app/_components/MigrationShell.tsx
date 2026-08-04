import Link from "next/link";
import Image from "next/image";
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
import { ConveningsMenu } from "./ConveningsMenu";

const primaryNavItems: Array<{
    href: string;
    label: string;
}> = [
    { href: "/", label: "Home Base" },
    { href: "/archives", label: "News" },
    { href: "/pricing", label: "Cabeus Council" },
];

const conveningNavItems = [
    { href: "/space-industrialist-week", label: "Space Industrialist Week" },
    { href: "/space-investment-forum", label: "Space Investment Forum" },
];

const companyNavItems = [
    { href: "/team", label: "About" },
    { href: "/authors", label: "Author biographies" },
    { href: "/contact", label: "Contact & standards" },
    { href: "/legal/terms", label: "Terms" },
];

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
                            <Image
                                src="/cabeus-explorer-pointed-wordmark.png"
                                alt=""
                                width={1990}
                                height={740}
                                priority
                                className="h-auto w-[7.5rem] sm:w-[9.5rem]"
                            />
                        </Link>
                        <nav
                            aria-label="Primary navigation"
                            className="hidden items-center gap-7 lg:flex"
                        >
                            {primaryNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="inline-flex h-10 items-center font-sans text-[0.72rem] font-semibold uppercase leading-none tracking-[0.1em] text-cabeus-ink transition hover:text-cabeus-gold"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <ConveningsMenu items={conveningNavItems} />
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
                                Sign Up
                            </Link>
                        </div>
                    </div>
                    <details className="border-t border-cabeus-line lg:hidden">
                        <summary className="cursor-pointer py-3 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-cabeus-ink">
                            Menu
                        </summary>
                        <nav aria-label="Mobile navigation" className="grid border-t border-cabeus-line pb-3">
                            {primaryNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="border-b border-cabeus-line px-1 py-3 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-cabeus-ink"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <p className="border-b border-cabeus-line px-1 py-3 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-cabeus-bronze">
                                Events
                            </p>
                            {conveningNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="border-b border-cabeus-line px-1 py-3 pl-4 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-cabeus-ink"
                                >
                                    {item.label}
                                </Link>
                            ))}
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
                                Sign Up
                            </Link>
                        </nav>
                    </details>
                </div>
            </header>
            <main>{children}</main>
            <footer className="border-t border-cabeus-line bg-cabeus-paper">
                <div className="mx-auto grid w-full max-w-[92rem] gap-10 px-4 py-12 md:px-8 lg:grid-cols-[1.5fr_0.75fr_0.75fr]">
                    <div>
                        <Image
                            src="/cabeus-explorer-pointed-wordmark.png"
                            alt="Cabeus Explorer"
                            width={1990}
                            height={740}
                            className="h-auto w-[11rem]"
                        />
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
                    <nav aria-label="External channels">
                        <p className="brand-kicker text-cabeus-ink">Follow</p>
                        <div className="mt-5 grid gap-3">
                            {externalChannels.map((channel) => (
                                <a
                                    key={channel.id}
                                    href={channel.href!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-cabeus-muted transition hover:text-cabeus-ink"
                                >
                                    {channel.label}
                                </a>
                            ))}
                        </div>
                    </nav>
                </div>
                <div className="mx-auto flex w-full max-w-[92rem] flex-wrap justify-between gap-3 border-t border-cabeus-line px-4 py-5 text-xs text-cabeus-muted md:px-8">
                    <span>&copy; 2026 Cabeus Explorer</span>
                    <span>{potomacBrand.identity.essence}</span>
                </div>
            </footer>
        </div>
    );
}
