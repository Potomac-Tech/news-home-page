import Link from "next/link";
import type { TerminalViewerContext } from "../../../lib/auth/terminal";
import {
    TERMINAL_FRONTEND_VERSION,
    TERMINAL_MODULES,
    type TerminalModule,
} from "../../../lib/terminal/frontend";

const commonCapabilities = [
    {
        title: "Watchlists & alerts",
        description: "Follow programs, missions, organizations, and workforce signals.",
    },
    {
        title: "Comparable entities",
        description: "Compare evidence on common dimensions and retain custom models.",
    },
    {
        title: "Market intelligence",
        description: "Connect public funding, contract, organization, and mission evidence.",
    },
    {
        title: "Rapid search",
        description: "Find public and member-permitted evidence across the terminal.",
    },
] as const;

function accessMessage(viewer: TerminalViewerContext) {
    if (viewer.capabilityMode === "full_mvp") {
        return {
            eyebrow: "Full MVP workspace",
            title: "Scout and Meridian capabilities are active",
            body: "Private workspaces, saved models, annotations, watchlists, and member evidence are available under the same MVP capability set.",
            cta: "Open account",
        };
    }

    if (viewer.capabilityMode === "public_and_explorer") {
        return {
            eyebrow: "Explorer preview",
            title: "Public intelligence is active",
            body: "Scout and Meridian workspace features remain summarized as teasers until the membership is upgraded.",
            cta: "Upgrade membership",
        };
    }

    return {
        eyebrow: "Public preview",
        title: "Explore public, unclassified intelligence",
        body: "Sign in with a complete Explorer membership profile to see applicable member data and features.",
        cta:
            viewer.state === "profile_incomplete"
                ? "Complete profile"
                : viewer.state === "email_unverified"
                  ? "Verify email"
                  : viewer.state === "membership_required"
                    ? "Choose membership"
                    : "Sign in",
    };
}

export function TerminalWorkspace({
    module,
    viewer,
}: {
    module: TerminalModule;
    viewer: TerminalViewerContext;
}) {
    const access = accessMessage(viewer);
    const isFullMvp = viewer.capabilityMode === "full_mvp";

    return (
        <div
            id="main-content"
            className="min-h-screen bg-[#060b13] text-potomac-cream"
            data-terminal-integration-version={TERMINAL_FRONTEND_VERSION}
        >
            <section className="border-b border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_38%)]">
                <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.2em]">
                                <span className="text-potomac-gold">Cabeus Terminal</span>
                                <span
                                    className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-emerald-200"
                                    role="status"
                                >
                                    Public / unclassified
                                </span>
                            </div>
                            <h1 className="mt-5 font-serif text-4xl leading-tight text-white md:text-6xl">
                                Bloomberg-style intelligence for the Moon
                            </h1>
                            <p className="mt-5 max-w-2xl text-lg leading-8 text-potomac-cream/75">
                                Evidence-first cislunar and Earth-orbit intelligence for
                                mission engineering, investment diligence, and space
                                operations.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="#terminal-capabilities"
                                className="rounded border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/60"
                            >
                                Open Cabeus Terminal
                            </Link>
                            <a
                                href="/api/member/nexus/handoff"
                                className="rounded bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
                            >
                                Open Nexus
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:px-8 lg:grid-cols-[18rem_1fr]">
                <aside className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <nav aria-label="Terminal modules">
                        <p className="px-3 pb-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-cream/50">
                            Intelligence modules
                        </p>
                        <ul className="space-y-2">
                            {TERMINAL_MODULES.map((item) => {
                                const active = item.id === module.id;
                                return (
                                    <li key={item.id}>
                                        <Link
                                            href={`/terminal/${item.id}`}
                                            aria-current={active ? "page" : undefined}
                                            className={`block rounded-lg border px-3 py-3 transition ${
                                                active
                                                    ? "border-cyan-300/50 bg-cyan-300/10 text-white"
                                                    : "border-transparent text-potomac-cream/65 hover:border-white/15 hover:text-white"
                                            }`}
                                        >
                                            <span className="block text-sm font-bold">
                                                {item.label}
                                            </span>
                                            <span className="mt-1 block text-xs leading-5 opacity-75">
                                                {item.description}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </aside>

                <div className="space-y-6">
                    <section className="rounded-xl border border-white/10 bg-white/[0.035] p-6 md:p-8">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                            {module.label}
                        </p>
                        <h2 className="mt-3 font-serif text-3xl text-white md:text-4xl">
                            {module.id === "contracts"
                                ? "Andromeda program comparison"
                                : module.description}
                        </h2>
                        <p className="mt-4 max-w-3xl leading-7 text-potomac-cream/70">
                            {module.id === "contracts"
                                ? "The first terminal validation report compares all candidate companies competing for Space Force Andromeda awards, with sourced evidence, freshness, and uncertainty shown instead of a recommended decision."
                                : "Review source-linked evidence, compare entities, and save work without asking the terminal to make the final customer decision."}
                        </p>

                        {module.id === "contracts" ? (
                            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                {[
                                    ["Candidate pool", "14 companies"],
                                    ["Lifecycle coverage", "Forecast to recompete"],
                                    ["Evidence policy", "Source + uncertainty"],
                                ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="rounded-lg border border-white/10 bg-black/20 p-4"
                                    >
                                        <p className="text-xs uppercase tracking-[0.14em] text-potomac-cream/70">
                                            {label}
                                        </p>
                                        <p className="mt-2 text-lg font-bold text-white">
                                            {value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </section>

                    <section aria-labelledby="terminal-capabilities">
                        <h2
                            id="terminal-capabilities"
                            className="text-sm font-bold uppercase tracking-[0.18em] text-potomac-cream/60"
                        >
                            Terminal capabilities
                        </h2>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            {commonCapabilities.map((capability) => (
                                <article
                                    key={capability.title}
                                    className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
                                >
                                    <h3 className="font-serif text-xl text-white">
                                        {capability.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-potomac-cream/65">
                                        {capability.description}
                                    </p>
                                    <p className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-cyan-200">
                                        {isFullMvp ? "Available" : "Preview"}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-xl border border-potomac-gold/30 bg-potomac-gold/[0.06] p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            {access.eyebrow}
                        </p>
                        <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                            <div className="max-w-3xl">
                                <h2 className="font-serif text-2xl text-white">
                                    {access.title}
                                </h2>
                                <p className="mt-2 leading-7 text-potomac-cream/70">
                                    {access.body}
                                </p>
                            </div>
                            <Link
                                href={viewer.actionHref}
                                className="shrink-0 rounded bg-potomac-gold px-4 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-amber-200"
                            >
                                {access.cta}
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
