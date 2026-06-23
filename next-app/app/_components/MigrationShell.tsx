import Link from "next/link";
import type { ReactNode } from "react";
import { potomacBrand } from "../_data/brand";
import { externalChannels } from "../_data/channels";

const navItems = [
    { href: "/member", label: "Member" },
    { href: "/organization", label: "Organization" },
    { href: "/apply", label: "Apply" },
    { href: "/command", label: "Command" },
    { href: "/admin/applications", label: "Admin" },
    { href: "/nexus", label: "Nexus" },
    { href: "/hardware", label: "Hardware" },
    { href: "/team", label: "Team" },
    { href: "/news", label: "News" },
    { href: "/events", label: "Events" },
];

export function MigrationShell({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-potomac-secondary text-potomac-cream">
            <header className="border-b border-potomac-gold/30 bg-potomac-primary">
                <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 md:px-8">
                    <Link href="/" className="flex items-center gap-4">
                        <img
                            src={potomacBrand.assets.logo}
                            alt="Potomac"
                            className="h-12 w-auto"
                        />
                        <span className="font-serif text-lg tracking-[0.22em] text-white md:text-xl">
                            POTOMAC{" "}
                            <span className="text-potomac-gold">NEWS</span>
                        </span>
                    </Link>
                    <nav className="hidden items-center gap-5 md:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="text-sm font-semibold uppercase tracking-widest text-gray-400 transition hover:text-potomac-gold"
                            >
                                {item.label}
                            </Link>
                        ))}
                        <a
                            href="/auth/login"
                            className="rounded border border-potomac-gold px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-potomac-gold transition hover:bg-potomac-gold hover:text-potomac-primary"
                        >
                            Sign in
                        </a>
                    </nav>
                </div>
            </header>
            <main>{children}</main>
            <footer className="border-t border-white/5 bg-potomac-primary">
                <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 md:px-8 lg:grid-cols-[0.9fr_1.1fr]">
                    <div>
                        <p className="font-serif text-lg tracking-[0.2em] text-white">
                            POTOMAC{" "}
                            <span className="text-potomac-gold">NEWS</span>
                        </p>
                        <p className="mt-3 max-w-md text-sm leading-6 text-potomac-cream/60">
                            Public lunar reporting and member intelligence
                            channels for the cislunar economy.
                        </p>
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
                                    className="rounded border border-potomac-gold/35 p-4 transition hover:border-potomac-gold hover:bg-white/5"
                                >
                                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                        {channel.label}
                                    </span>
                                    <span className="mt-2 block text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
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
                                    className="rounded border border-white/10 p-4"
                                >
                                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                        {channel.label}
                                    </span>
                                    <span className="mt-2 block text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
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
