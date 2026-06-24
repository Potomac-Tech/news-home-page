import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const MobileNavBar: React.FC = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const drawerRef = useRef<HTMLElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);
    const isHardware =
        location.pathname === "/hardware" || location.pathname === "/source";
    const isNews = location.pathname.startsWith("/news");
    const isEvents = location.pathname.startsWith("/events");

    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!isOpen) return;
        const scrollY = window.scrollY;
        const { body } = document;
        body.style.position = "fixed";
        body.style.top = `-${scrollY}px`;
        body.style.width = "100%";
        return () => {
            body.style.position = "";
            body.style.top = "";
            body.style.width = "";
            window.scrollTo(0, scrollY);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            previouslyFocusedRef.current =
                document.activeElement as HTMLElement | null;
            drawerRef.current
                ?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
                ?.focus();
        } else if (previouslyFocusedRef.current) {
            previouslyFocusedRef.current.focus();
            previouslyFocusedRef.current = null;
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen]);

    useEffect(() => {
        const el = drawerRef.current;
        if (!el) return;
        if (isOpen) el.removeAttribute("inert");
        else el.setAttribute("inert", "");
    }, [isOpen]);

    const handleTrapKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== "Tab" || !drawerRef.current) return;
        const focusables = Array.from(
            drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        }
    };

    const getDrawerLinkClass = (isActive: boolean) => {
        return `py-4 pl-4 border-l-2 text-base font-semibold tracking-widest uppercase transition ${
            isActive
                ? "text-potomac-gold border-potomac-gold"
                : "text-gray-300 border-transparent hover:text-potomac-gold"
        }`;
    };

    return (
        <>
            {/* Hamburger */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                aria-label="Open menu"
                aria-expanded={isOpen}
                className="md:hidden p-3 text-potomac-gold"
            >
                <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </button>

            {/* Backdrop */}
            <div
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
                className={`md:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
                    isOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                }`}
            />

            {/* Drawer */}
            <aside
                ref={drawerRef}
                onKeyDown={handleTrapKeyDown}
                aria-hidden={!isOpen}
                className={`md:hidden fixed top-0 right-0 h-full w-72 bg-potomac-primary border-l border-potomac-gold/30 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="flex justify-end p-3">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close menu"
                        className="p-3 text-potomac-gold"
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col gap-2 px-8 pt-4">
                    <Link
                        to="/nexus"
                        className={getDrawerLinkClass(
                            location.pathname === "/nexus"
                        )}
                    >
                        Nexus
                    </Link>
                    <Link
                        to="/hardware"
                        className={getDrawerLinkClass(isHardware)}
                    >
                        Hardware
                    </Link>
                    <Link
                        to="/team"
                        className={getDrawerLinkClass(
                            location.pathname === "/team"
                        )}
                    >
                        Team
                    </Link>
                    <Link to="/news" className={getDrawerLinkClass(isNews)}>
                        News
                    </Link>
                    <Link to="/events" className={getDrawerLinkClass(isEvents)}>
                        Events
                    </Link>
                </div>

                <div className="h-px bg-white/10 my-4 mx-8" />

                <a
                    href="https://nexus-explore.potomacdb.com/0auth"
                    className="block text-center mx-8 px-5 py-3 border border-potomac-gold text-potomac-gold text-xs font-bold tracking-[0.2em] uppercase rounded hover:bg-potomac-gold hover:text-potomac-primary transition duration-300"
                >
                    Sign in / Sign Up
                </a>
            </aside>
        </>
    );
};

export default MobileNavBar;
