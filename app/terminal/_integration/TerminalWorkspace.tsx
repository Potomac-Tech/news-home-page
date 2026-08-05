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
                <div className="mx-auto flex min-h-[35rem] w-full max-w-[92rem] items-center px-5 py-16 md:px-10 md:py-24">
                    <div className="max-w-5xl">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="brand-kicker text-cabeus-bronze">
                                Cabeus Terminal
                            </span>
                            <span
                                className="border border-cabeus-line px-3 py-1 font-mono text-[0.6rem] font-bold uppercase text-cabeus-muted"
                                role="status"
                            >
                                Coming soon
                            </span>
                        </div>
                        <h1 className="mt-6 max-w-[11ch] text-balance font-serif text-[clamp(4rem,7vw,7rem)] font-medium leading-[0.9]">
                            The Moon is an emerging market.
                        </h1>
                        <p className="mt-7 max-w-2xl text-lg leading-8 text-cabeus-muted">
                            Cabeus Terminal is coming soon. It will give space
                            industrialists the intelligence needed to understand,
                            finance, and build the emerging lunar economy.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
