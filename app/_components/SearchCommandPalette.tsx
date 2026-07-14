"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { publicTierName } from "../_data/tiers";

type SearchTier = "public" | "explorer" | "scout" | "command" | "staff";

type CommandPaletteEntry = {
    id: string;
    label: string;
    description: string;
    href: string;
    section: string;
    tier: SearchTier;
    shortcut?: string | null;
    isPinned: boolean;
    keywords: string[];
};

type SearchCommandPaletteProps = {
    entries?: CommandPaletteEntry[];
};

function matchesEntry(entry: CommandPaletteEntry, query: string) {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
        return true;
    }

    return [
        entry.label,
        entry.description,
        entry.section,
        entry.tier,
        ...entry.keywords,
    ].some((value) => value.toLowerCase().includes(normalized));
}

function tierLabel(tier: SearchTier) {
    if (tier === "public") return "Public";
    if (tier === "explorer") return "Explorer+";
    if (tier === "scout") return "Scout+";
    if (tier === "command") return publicTierName(tier);
    return "Staff";
}

export function SearchCommandPalette({ entries = [] }: SearchCommandPaletteProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const filteredEntries = useMemo(
        () =>
            entries
                .filter((entry) => matchesEntry(entry, query))
                .sort((a, b) => {
                    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                    return a.label.localeCompare(b.label);
                })
                .slice(0, 8),
        [entries, query]
    );

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            const isCommandKey = event.metaKey || event.ctrlKey;

            if (isCommandKey && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setOpen(true);
            }

            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    useEffect(() => {
        if (open) {
            window.setTimeout(() => inputRef.current?.focus(), 0);
        } else {
            setQuery("");
        }
    }, [open]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="shrink-0 rounded border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-potomac-cream/70 transition hover:border-potomac-gold hover:text-potomac-gold"
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                Search
                <span className="ml-2 hidden rounded border border-white/10 px-1.5 py-0.5 text-[0.62rem] text-potomac-cream/65 sm:inline">
                    Ctrl K
                </span>
            </button>

            {open ? (
                <div
                    className="fixed inset-0 z-50 bg-black/70 px-4 py-6 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Command palette"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setOpen(false);
                        }
                    }}
                >
                    <div className="mx-auto w-full max-w-2xl rounded border border-potomac-gold/40 bg-potomac-primary shadow-2xl">
                        <div className="border-b border-white/10 p-4">
                            <label
                                htmlFor="command-palette-search"
                                className="sr-only"
                            >
                                Search commands
                            </label>
                            <input
                                ref={inputRef}
                                id="command-palette-search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search terminal, companies, procurement..."
                                className="min-h-12 w-full rounded border border-white/15 bg-potomac-secondary px-4 text-base text-white outline-none placeholder:text-potomac-cream/40 focus:border-potomac-gold"
                            />
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {filteredEntries.length ? (
                                filteredEntries.map((entry) => (
                                    <Link
                                        key={entry.id}
                                        href={entry.href}
                                        onClick={() => setOpen(false)}
                                        className="block rounded px-4 py-3 transition hover:bg-white/5 focus:bg-white/5 focus:outline-none"
                                    >
                                        <span className="flex items-start justify-between gap-3">
                                            <span>
                                                <span className="block text-sm font-bold text-white">
                                                    {entry.label}
                                                </span>
                                                <span className="mt-1 block text-xs leading-5 text-potomac-cream/60">
                                                    {entry.description}
                                                </span>
                                            </span>
                                            <span className="shrink-0 rounded border border-potomac-gold/30 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-potomac-gold">
                                                {tierLabel(entry.tier)}
                                            </span>
                                        </span>
                                        <span className="mt-2 flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.12em] text-potomac-cream/40">
                                            <span>{entry.section}</span>
                                            {entry.shortcut ? (
                                                <span>{entry.shortcut}</span>
                                            ) : null}
                                            {entry.isPinned ? (
                                                <span>Admin pinned</span>
                                            ) : null}
                                        </span>
                                    </Link>
                                ))
                            ) : (
                                <div className="p-6">
                                    <p className="font-serif text-2xl text-white">
                                        No command matches.
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-potomac-cream/60">
                                        Try a module name, company, mission,
                                        source type, or access tier.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-[0.65rem] uppercase tracking-[0.14em] text-potomac-cream/45">
                            <span>Enter opens result</span>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-potomac-gold hover:text-white"
                            >
                                Esc closes
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
