import Link from "next/link";
import {
    terminalModules,
    terminalStatusLabel,
    type TerminalModule,
} from "../_data/terminal";

type TerminalDashboardShellProps = {
    title?: string;
    description?: string;
    showMemberActions?: boolean;
};

const sectionOrder: TerminalModule["section"][] = [
    "News",
    "Missions",
    "Markets",
    "Workspace",
];

function moduleClassName(status: TerminalModule["status"]) {
    if (status === "live") {
        return "border-potomac-gold/55";
    }

    if (status === "scout") {
        return "border-potomac-gold/35";
    }

    return "border-white/10";
}

export function TerminalDashboardShell({
    title = "Lunar industry terminal",
    description = "Fast paths across Potomac's lunar news, mission tracking, procurement, regulatory, company, economy, dataset, marketplace, event, calculator, alert, and account areas.",
    showMemberActions = false,
}: TerminalDashboardShellProps) {
    return (
        <section className="border-y border-white/10 bg-potomac-primary/70">
            <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">
                            Terminal shell
                        </p>
                        <h2 className="mt-3 font-serif text-3xl leading-tight text-white md:text-5xl">
                            {title}
                        </h2>
                        <p className="mt-4 text-sm leading-6 text-potomac-cream/70 md:text-base md:leading-7">
                            {description}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/pricing"
                            className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Compare tiers
                        </Link>
                        <Link
                            href={showMemberActions ? "/account" : "/apply"}
                            className="rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            {showMemberActions ? "Account paths" : "Apply"}
                        </Link>
                    </div>
                </div>

                <div className="mt-9 grid gap-7">
                    {sectionOrder.map((section) => {
                        const modules = terminalModules.filter(
                            (module) => module.section === section
                        );

                        return (
                            <div key={section}>
                                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                    {section}
                                </h3>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    {modules.map((module) => (
                                        <Link
                                            key={module.id}
                                            href={module.href}
                                            className={`rounded border p-4 transition hover:border-potomac-gold hover:bg-white/5 ${moduleClassName(
                                                module.status
                                            )}`}
                                        >
                                            <span className="flex items-start justify-between gap-3">
                                                <span className="text-sm font-bold text-white">
                                                    {module.label}
                                                </span>
                                                <span className="shrink-0 rounded border border-white/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-cream/55">
                                                    {terminalStatusLabel(
                                                        module.status
                                                    )}
                                                </span>
                                            </span>
                                            <span className="mt-3 block text-xs leading-5 text-potomac-cream/60">
                                                {module.summary}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
