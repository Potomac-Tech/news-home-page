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
    { href: "/news", label: "News" },
    { href: "/events#potomac-space-investment-forum-2026", label: "Space Investment Forum" },
    { href: "/events#space-industrialist-week-2026", label: "Space Industrialist Week" },
    { href: "/events#cabeus-games", label: "Cabeus Games" },
    { href: "/terminal", label: "Terminal" },
];

const footerNavItems = [
    { href: "/terminal", label: "Terminal" },
    { href: "/tracker/launches", label: "Launches & Missions" },
    { href: "/calculators", label: "Calculators" },
    { href: "/member", label: "Member workspace" },
    { href: "/authors", label: "Author biographies" },
    { href: "/contact", label: "Contact & standards" },
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
        <div className="min-h-screen bg-potomac-secondary text-potomac-cream">
            <CheckoutAnalytics />
            <header className="sticky top-0 z-40 border-b border-potomac-regolith/25 bg-potomac-primary/95 backdrop-blur-xl">
                <div className="mx-auto w-full max-w-[92rem] px-4 md:px-8">
                    <div className="grid min-h-20 grid-cols-[1fr_auto] items-center gap-4 py-3 lg:grid-cols-[1fr_auto_1fr]">
                        <div className="hidden items-center gap-3 font-mono text-[0.62rem] font-semibold uppercase text-potomac-regolith lg:flex">
                            <span className="h-2 w-2 bg-potomac-gold" />
                            <span>Lunar industry intelligence</span>
                        </div>
                        <Link href="/" className="flex min-w-0 items-center gap-3 lg:justify-center">
                        <span className="relative h-11 w-14 shrink-0 overflow-hidden border border-potomac-regolith/45 bg-potomac-secondary">
                            <img
                                src={potomacBrand.assets.logo}
                                alt="Cabeus Explorer lunar industrial mark"
                                className="h-full w-full object-cover object-center opacity-90"
                            />
                            <span className="absolute inset-0 border border-black/50" />
                        </span>
                        <span className="min-w-0">
                            <span className="block font-serif text-xl font-semibold uppercase leading-none text-white md:text-3xl">
                                {potomacBrand.identity.name}
                            </span>
                            <span className="mt-1 block font-mono text-[0.68rem] uppercase text-potomac-regolith">
                                {potomacBrand.identity.tagline}
                            </span>
                        </span>
                        </Link>
                        <div className="flex items-center justify-end gap-2">
                            <Suspense fallback={<SearchCommandPalette entries={publicCommandEntries} />}>
                                <MemberAwareSearchPalette />
                            </Suspense>
                            <Link
                                href="/request-access?tab=signin"
                                className="hidden shrink-0 border border-potomac-regolith/45 px-3 py-2 font-mono text-[0.64rem] font-bold uppercase text-potomac-cream transition hover:border-potomac-gold hover:text-potomac-gold sm:inline-flex"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/request-access"
                                className="hidden shrink-0 bg-potomac-gold px-3 py-2 font-mono text-[0.64rem] font-bold uppercase text-potomac-primary transition hover:bg-potomac-cream md:inline-flex"
                            >
                                Join
                            </Link>
                        </div>
                    </div>
                    <nav
                        aria-label="Primary navigation"
                        className="hidden items-center justify-center gap-7 border-t border-potomac-regolith/15 py-3 lg:flex"
                    >
                            {primaryNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="shrink-0 font-mono text-[0.66rem] font-semibold uppercase text-potomac-cream/75 transition hover:text-potomac-gold"
                                >
                                    {item.label}
                                </Link>
                            ))}
                    </nav>
                    <details className="border-t border-potomac-regolith/15 lg:hidden">
                        <summary className="cursor-pointer py-3 font-mono text-[0.66rem] font-bold uppercase text-potomac-gold">
                            Sections
                        </summary>
                        <nav aria-label="Mobile navigation" className="grid grid-cols-2 gap-px border-t border-potomac-regolith/15 bg-potomac-regolith/15 pb-px">
                            {primaryNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="bg-potomac-primary px-3 py-3 font-mono text-[0.66rem] font-semibold uppercase text-potomac-cream/75"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </details>
                </div>
            </header>
            <main>{children}</main>
            <footer className="border-t border-potomac-regolith/20 bg-potomac-primary">
                <div className="mx-auto grid w-full max-w-[92rem] gap-8 px-4 py-8 md:px-8 lg:grid-cols-[0.72fr_1.28fr]">
                    <div>
                        <p className="font-serif text-2xl font-semibold uppercase text-white">
                            {potomacBrand.identity.name}
                        </p>
                        <p className="mt-1 font-mono text-[0.68rem] uppercase text-potomac-regolith">
                            {potomacBrand.identity.tagline}
                        </p>
                        <p className="mt-4 max-w-md text-sm leading-6 text-potomac-cream/62">
                            Grounded intelligence, operational context, and
                            commercial signals for lunar industrial leaders.
                        </p>
                        <nav
                            aria-label="Legal and trust"
                            className="mt-5 flex flex-wrap gap-x-4 gap-y-2"
                        >
                            {trustRoutes.map((route) => (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className="font-mono text-[0.68rem] font-semibold uppercase text-potomac-cream/65 transition hover:text-potomac-gold"
                                >
                                    {route.label}
                                </Link>
                            ))}
                        </nav>
                        <nav
                            aria-label="Terminal routes"
                            className="mt-5 flex flex-wrap gap-x-4 gap-y-2"
                        >
                            {footerNavItems.map((route) => (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className="font-mono text-[0.68rem] font-semibold uppercase text-potomac-regolith/70 transition hover:text-potomac-gold"
                                >
                                    {route.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <nav aria-label="External channels" className="grid gap-3 sm:grid-cols-2">
                        {externalChannels.map((channel) => (
                            <a
                                key={channel.id}
                                href={channel.href!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="border border-potomac-regolith/25 p-4 transition hover:border-potomac-gold hover:bg-white/5"
                            >
                                <span className="font-mono text-[0.68rem] font-bold uppercase text-potomac-gold">
                                    {channel.label}
                                </span>
                                <span className="mt-2 block font-mono text-[0.65rem] uppercase text-potomac-cream/65">
                                    {channel.status}
                                </span>
                                <span className="mt-3 block text-sm leading-5 text-potomac-cream/70">
                                    {channel.description}
                                </span>
                            </a>
                        ))}
                    </nav>
                </div>
            </footer>
        </div>
    );
}
