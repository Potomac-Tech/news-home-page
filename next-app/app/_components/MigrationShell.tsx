import Link from "next/link";
import type { ReactNode } from "react";
import { potomacBrand } from "../_data/brand";

const navItems = [
    { href: "/member", label: "Member" },
    { href: "/nexus", label: "Nexus" },
    { href: "/hardware", label: "Hardware" },
    { href: "/team", label: "Team" },
    { href: "/news", label: "News" },
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
            <footer className="border-t border-white/5 bg-potomac-primary py-8 text-center">
                <p className="text-[10px] uppercase tracking-widest text-gray-500">
                    Potomac News & Intelligence migration scaffold
                </p>
            </footer>
        </div>
    );
}
