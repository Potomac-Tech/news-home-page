import Link from "next/link";
import { TERMINAL_FRONTEND_VERSION } from "../../../archive/cabeus-terminal/frontend-v1/frontend";

export function TerminalWorkspace() {
    return (
        <div
            id="main-content"
            className="min-h-screen bg-cabeus-paper text-cabeus-ink"
            data-terminal-integration-version={TERMINAL_FRONTEND_VERSION}
            data-terminal-integration-state="archived"
        >
            <section className="border-b border-cabeus-line">
                <div className="mx-auto grid min-h-[35rem] w-full max-w-[92rem] lg:grid-cols-[1fr_0.92fr]">
                    <div className="flex flex-col justify-center px-5 py-16 md:px-10 md:py-24">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="brand-kicker text-cabeus-bronze">
                                Cabeus Terminal
                            </span>
                            <span
                                className="border border-cabeus-line px-3 py-1 font-mono text-[0.6rem] font-bold uppercase text-cabeus-muted"
                                role="status"
                            >
                                Integration in progress
                            </span>
                        </div>
                        <h1 className="mt-6 max-w-[11ch] text-balance font-serif text-[clamp(4rem,7vw,7rem)] font-medium leading-[0.9]">
                            Intelligence for decisions that move the industry.
                        </h1>
                        <p className="mt-7 max-w-2xl text-lg leading-8 text-cabeus-muted">
                            The Cabeus Terminal workspace is being prepared for a
                            future integrated release. Approved members can continue
                            to Potomac Nexus for current intelligence tools.
                        </p>
                        <div className="mt-8">
                            <Link href="/nexus" className="brand-button inline-flex">
                                Open Nexus
                            </Link>
                        </div>
                    </div>
                    <img
                        src="/cabeus-lunar-industrial-hero.png"
                        alt="Industrial lunar infrastructure beneath a crescent Moon"
                        className="order-first h-64 w-full object-cover lg:order-none lg:h-full"
                    />
                </div>
            </section>
        </div>
    );
}
