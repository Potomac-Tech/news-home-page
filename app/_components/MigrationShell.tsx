import Link from "next/link";
import type { ReactNode } from "react";
import { potomacBrand } from "../_data/brand";
import { externalChannels } from "../_data/channels";
import { trustRoutes } from "../_data/trust";
import {
    getSearchSupabaseClient,
    loadCommandPaletteEntries,
} from "../_data/search";
import { SearchCommandPalette } from "./SearchCommandPalette";

const primaryNavItems = [
    { href: "/news", label: "Intelligence" },
    { href: "/companies", label: "Sectors" },
    { href: "/datasets", label: "Data Tools" },
    { href: "/pricing", label: "Membership" },
    { href: "/team", label: "About" },
];

const footerNavItems = [
    { href: "/terminal", label: "Terminal" },
    { href: "/launches", label: "Launches" },
    { href: "/procurement", label: "Procurement" },
    { href: "/regulatory", label: "Regulatory" },
    { href: "/calculators", label: "Calculators" },
    { href: "/member", label: "Member workspace" },
];

export async function MigrationShell({ children }: { children: ReactNode }) {
    const supabase = await getSearchSupabaseClient();
    const commandEntries = await loadCommandPaletteEntries({ supabase });

    return (
        <div className="min-h-screen bg-potomac-secondary text-potomac-cream">
            <header className="sticky top-0 z-40 border-b border-potomac-regolith/25 bg-potomac-primary/95 backdrop-blur-xl">
                <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-4 px-4 py-3 md:px-8 lg:flex-row lg:items-center lg:justify-between">
                    <Link href="/" className="flex min-w-0 items-center gap-3">
                        <span className="relative h-12 w-16 overflow-hidden border border-potomac-regolith/45 bg-potomac-secondary">
                            <img
                                src={potomacBrand.assets.logo}
                                alt="Cabeus Explorer lunar industrial mark"
                                className="h-full w-full object-cover object-center opacity-90"
                            />
                            <span className="absolute inset-0 border border-black/50" />
                        </span>
                        <span className="min-w-0">
                            <span className="block font-serif text-xl font-semibold uppercase leading-none text-white md:text-2xl">
                                {potomacBrand.identity.name}
                            </span>
                            <span className="mt-1 block font-mono text-[0.68rem] uppercase text-potomac-regolith">
                                {potomacBrand.identity.tagline}
                            </span>
                        </span>
                    </Link>
                    <div className="flex flex-col gap-3 lg:items-end">
                        <nav
                            aria-label="Primary navigation"
                            className="flex flex-wrap items-center gap-x-5 gap-y-3 pb-1 lg:justify-end"
                        >
                            {primaryNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="shrink-0 font-mono text-[0.68rem] font-semibold uppercase text-potomac-cream/75 transition hover:text-potomac-gold"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <SearchCommandPalette entries={commandEntries} />
                            <a
                                href="/auth/login"
                                className="shrink-0 border border-potomac-regolith/45 px-4 py-2 font-mono text-[0.68rem] font-bold uppercase text-potomac-cream transition hover:border-potomac-gold hover:text-potomac-gold"
                            >
                                Login
                            </a>
                            <Link
                                href="/apply"
                                className="shrink-0 bg-potomac-gold px-4 py-2 font-mono text-[0.68rem] font-bold uppercase text-potomac-primary transition hover:bg-potomac-cream"
                            >
                                Join
                            </Link>
                        </nav>
                    </div>
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
                                    className="font-mono text-[0.68rem] font-semibold uppercase text-potomac-cream/45 transition hover:text-potomac-gold"
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
                    <nav
                        aria-label="External channels"
                        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                    >
                        {externalChannels.map((channel) =>
                            channel.href ? (
                                <a
                                    key={channel.id}
                                    href={channel.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="border border-potomac-regolith/25 p-4 transition hover:border-potomac-gold hover:bg-white/5"
                                >
                                    <span className="font-mono text-[0.68rem] font-bold uppercase text-potomac-gold">
                                        {channel.label}
                                    </span>
                                    <span className="mt-2 block font-mono text-[0.65rem] uppercase text-potomac-cream/45">
                                        {channel.status}
                                    </span>
                                    <span className="mt-3 block text-sm leading-5 text-potomac-cream/70">
                                        {channel.description}
                                    </span>
                                </a>
                            ) : (
                                <span
                                    key={channel.id}
                                    aria-disabled="true"
                                    className="border border-white/10 p-4"
                                >
                                    <span className="font-mono text-[0.68rem] font-bold uppercase text-potomac-gold">
                                        {channel.label}
                                    </span>
                                    <span className="mt-2 block font-mono text-[0.65rem] uppercase text-potomac-cream/45">
                                        {channel.status}
                                    </span>
                                    <span className="mt-3 block text-sm leading-5 text-potomac-cream/60">
                                        {channel.description}
                                    </span>
                                </span>
                            )
                        )}
                    </nav>
                </div>
            </footer>
        </div>
    );
}
