import Link from "next/link";
import type { TerminalViewerContext } from "../../../lib/auth/terminal";
import {
    TERMINAL_FRONTEND_VERSION,
    TERMINAL_MODULES,
    type TerminalModule,
} from "./frontend";

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
            className="min-h-screen bg-cabeus-paper text-cabeus-ink"
            data-terminal-integration-version={TERMINAL_FRONTEND_VERSION}
        >
            <section className="border-b border-cabeus-line">
                <div className="mx-auto grid min-h-[35rem] w-full max-w-[92rem] lg:grid-cols-[1fr_0.92fr]">
                    <div className="flex flex-col justify-center px-5 py-16 md:px-10 md:py-24">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="brand-kicker text-cabeus-bronze">Cabeus Terminal</span>
                            <span
                                className="border border-cabeus-line px-3 py-1 font-mono text-[0.6rem] font-bold uppercase text-cabeus-muted"
                                role="status"
                            >
                                Public / unclassified
                            </span>
                        </div>
                        <h1 className="mt-6 max-w-[11ch] text-balance font-serif text-[clamp(4rem,7vw,7rem)] font-medium leading-[0.9]">
                            Intelligence for decisions that move the industry.
                        </h1>
                        <p className="mt-7 max-w-2xl text-lg leading-8 text-cabeus-muted">
                            Evidence-first cislunar and Earth-orbit intelligence for
                            mission engineering, investment diligence, and space
                            operations.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link href="/terminal/contracts" className="brand-button inline-flex">
                                Open Cabeus Terminal
                            </Link>
                            <a
                                href="/api/member/nexus/handoff"
                                className="brand-button brand-button-outline inline-flex"
                            >
                                Open Nexus
                            </a>
                        </div>
                    </div>
                    <img
                        src="/cabeus-lunar-industrial-hero.png"
                        alt="Industrial lunar infrastructure beneath a crescent Moon"
                        className="order-first h-64 w-full object-cover lg:order-none lg:h-full"
                    />
                </div>
            </section>

            <div className="mx-auto grid w-full max-w-[92rem] px-5 md:px-10 lg:grid-cols-[19rem_minmax(0,1fr)]">
                <aside className="border-b border-cabeus-line py-8 lg:border-b-0 lg:border-r lg:pr-8">
                    <nav aria-label="Terminal modules">
                        <p className="brand-kicker">Intelligence modules</p>
                        <ul className="mt-5 divide-y divide-cabeus-line border-y border-cabeus-line">
                            {TERMINAL_MODULES.map((item) => {
                                const active = item.id === module.id;
                                return (
                                    <li key={item.id}>
                                        <Link
                                            href={`/terminal/${item.id}`}
                                            aria-current={active ? "page" : undefined}
                                            className={`block border-l-2 px-3 py-4 transition ${
                                                active
                                                    ? "border-cabeus-bronze bg-cabeus-smoke text-cabeus-ink"
                                                    : "border-transparent text-cabeus-muted hover:border-cabeus-line hover:text-cabeus-ink"
                                            }`}
                                        >
                                            <span className="block text-sm font-bold">
                                                {item.label}
                                            </span>
                                            <span className="mt-1 block text-xs leading-5">
                                                {item.description}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </aside>

                <div className="min-w-0 py-10 lg:pl-10 lg:py-14">
                    <section className="border-b border-cabeus-line pb-10">
                        <p className="brand-kicker text-cabeus-bronze">{module.label}</p>
                        <h2 className="mt-4 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">
                            {module.id === "contracts"
                                ? "Andromeda program comparison"
                                : module.description}
                        </h2>
                        <p className="mt-5 max-w-3xl leading-7 text-cabeus-muted">
                            {module.id === "contracts"
                                ? "The first terminal validation report compares all candidate companies competing for Space Force Andromeda awards, with sourced evidence, freshness, and uncertainty shown instead of a recommended decision."
                                : "Review source-linked evidence, compare entities, and save work without asking the terminal to make the final customer decision."}
                        </p>

                        {module.id === "contracts" ? (
                            <dl className="mt-8 grid border-y border-cabeus-line sm:grid-cols-3">
                                {[
                                    ["Candidate pool", "14 companies"],
                                    ["Lifecycle coverage", "Forecast to recompete"],
                                    ["Evidence policy", "Source + uncertainty"],
                                ].map(([label, value], index) => (
                                    <div
                                        key={label}
                                        className={`py-5 sm:px-5 ${index ? "border-t border-cabeus-line sm:border-l sm:border-t-0" : ""}`}
                                    >
                                        <dt className="font-mono text-[0.62rem] font-bold uppercase text-cabeus-muted">
                                            {label}
                                        </dt>
                                        <dd className="mt-2 text-lg font-bold">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        ) : null}
                    </section>

                    <section aria-labelledby="terminal-capabilities" className="py-10">
                        <h2 id="terminal-capabilities" className="brand-kicker">
                            Terminal capabilities
                        </h2>
                        <div className="mt-5 grid border-y border-cabeus-line md:grid-cols-2">
                            {commonCapabilities.map((capability, index) => (
                                <article
                                    key={capability.title}
                                    className={`py-6 md:px-6 ${
                                        index % 2 ? "border-t border-cabeus-line md:border-l md:border-t-0" : index > 1 ? "border-t border-cabeus-line" : ""
                                    }`}
                                >
                                    <h3 className="font-serif text-3xl">{capability.title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-cabeus-muted">
                                        {capability.description}
                                    </p>
                                    <p className="mt-4 font-mono text-[0.62rem] font-bold uppercase text-cabeus-bronze">
                                        {isFullMvp ? "Available" : "Preview"}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="border-y border-cabeus-line bg-cabeus-smoke px-5 py-7 md:px-7">
                        <p className="brand-kicker text-cabeus-bronze">{access.eyebrow}</p>
                        <div className="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                            <div className="max-w-3xl">
                                <h2 className="font-serif text-3xl">{access.title}</h2>
                                <p className="mt-3 leading-7 text-cabeus-muted">{access.body}</p>
                            </div>
                            <Link href={viewer.actionHref} className="brand-button inline-flex shrink-0">
                                {access.cta}
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
