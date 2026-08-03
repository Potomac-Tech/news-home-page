"use client";

import Link from "next/link";
import { useState } from "react";

type ConveningNavItem = {
    href: string;
    label: string;
};

export function ConveningsMenu({
    items,
}: {
    items: readonly ConveningNavItem[];
}) {
    const [open, setOpen] = useState(false);

    return (
        <div
            className="group relative"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setOpen(false);
                }
            }}
            onKeyDown={(event) => {
                if (event.key === "Escape") {
                    setOpen(false);
                    event.currentTarget.querySelector("button")?.focus();
                }
            }}
        >
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls="convenings-menu"
                onMouseDown={(event) => event.preventDefault()}
                onFocus={() => setOpen(true)}
                className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-cabeus-ink transition hover:text-cabeus-gold"
            >
                Convenings
            </button>
            <div
                id="convenings-menu"
                role="menu"
                aria-hidden={!open}
                className={`absolute left-1/2 top-full mt-5 w-64 -translate-x-1/2 border border-cabeus-line bg-cabeus-paper p-2 shadow-xl transition duration-150 ${
                    open
                        ? "visible translate-y-0 opacity-100"
                        : "invisible -translate-y-1 pointer-events-none opacity-0 group-hover:visible group-hover:translate-y-0 group-hover:pointer-events-auto group-hover:opacity-100"
                }`}
            >
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className="block border-b border-cabeus-line px-3 py-3 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-cabeus-ink last:border-b-0 hover:bg-cabeus-smoke"
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
