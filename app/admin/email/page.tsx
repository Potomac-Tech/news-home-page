import type { Metadata } from "next";
import { requireAdmin } from "../../../lib/auth/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Email Operations",
};

type QuotaConfig = {
    daily_soft_cap: number;
    monthly_soft_cap: number;
    daily_hard_cap: number;
    monthly_hard_cap: number;
    operational_daily_reserve: number;
    operational_monthly_reserve: number;
    max_sends_per_second: number;
    inbound_receiving_enabled: boolean;
    sending_domain_count: number;
};

type QuotaUsage = {
    period_kind: "daily" | "monthly";
    sent_count: number;
    reserved_count: number;
};

type DeliveryEvent = {
    id: string;
    form_type: string;
    recipient: string;
    recipient_count: number;
    delivery_status: string;
    retry_status: string;
    next_retry_at: string | null;
    provider_message_id: string | null;
    failure_reason: string | null;
    created_at: string;
};

type EmailOperationsPayload = {
    config: QuotaConfig | null;
    usage: QuotaUsage[];
    events: DeliveryEvent[];
};

function formatDate(value: string | null) {
    return value ? new Date(value).toLocaleString() : "Not scheduled";
}

export default async function AdminEmailOperationsPage() {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase.rpc("get_resend_email_operations");

    if (error || !data) {
        throw new Error("Email operations data is unavailable.");
    }

    const { config, usage, events } = data as EmailOperationsPayload;
    const daily = usage.find((row) => row.period_kind === "daily");
    const monthly = usage.find((row) => row.period_kind === "monthly");
    const queued = events.filter((event) => event.delivery_status === "queued" || event.delivery_status === "held");
    const failed = events.filter((event) => event.delivery_status === "failed");

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">Admin operations</p>
                <h1 className="mt-4 font-serif text-4xl text-white md:text-5xl">Resend Free email queue</h1>
                <p className="mt-4 max-w-3xl text-potomac-cream/75">
                    Transactional email stays within the configured Free-plan budget. Held messages remain visible here and public forms show a received state instead of provider details.
                </p>

                <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Metric label="Daily sent / reserved" value={`${daily?.sent_count ?? 0} / ${daily?.reserved_count ?? 0}`} detail={`Soft ${config?.daily_soft_cap ?? 90}, hard ${config?.daily_hard_cap ?? 100}`} />
                    <Metric label="Monthly sent / reserved" value={`${monthly?.sent_count ?? 0} / ${monthly?.reserved_count ?? 0}`} detail={`Soft ${config?.monthly_soft_cap ?? 2700}, hard ${config?.monthly_hard_cap ?? 3000}`} />
                    <Metric label="Operational reserve" value={`${config?.operational_daily_reserve ?? 10} / day`} detail={`${config?.operational_monthly_reserve ?? 300} / month`} />
                    <Metric label="Queue health" value={`${queued.length} held`} detail={`${failed.length} failed in recent activity`} />
                </div>

                <div className="mt-10 grid gap-4 text-sm text-potomac-cream/75 md:grid-cols-3">
                    <div className="border border-white/10 p-4">Plan: Free only</div>
                    <div className="border border-white/10 p-4">Inbound receiving: {config?.inbound_receiving_enabled ? "Enabled - configuration error" : "Disabled"}</div>
                    <div className="border border-white/10 p-4">Sending domains: {config?.sending_domain_count ?? 1}; internal rate cap: {config?.max_sends_per_second ?? 8}/second</div>
                </div>

                <div className="mt-10 overflow-x-auto border border-white/10">
                    <table className="min-w-[62rem] w-full text-left text-sm">
                        <thead className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-potomac-gold">
                            <tr><th className="p-4">Form</th><th className="p-4">Status</th><th className="p-4">Recipients</th><th className="p-4">Retry</th><th className="p-4">Provider ID</th><th className="p-4">Recorded</th></tr>
                        </thead>
                        <tbody>
                            {events.map((event) => (
                                <tr key={event.id} className="border-b border-white/10 text-potomac-cream/75">
                                    <td className="p-4"><div className="font-semibold text-white">{event.form_type}</div><div className="mt-1 text-xs text-potomac-cream/50">{event.failure_reason ?? "No provider error"}</div></td>
                                    <td className="p-4">{event.delivery_status} / {event.retry_status}</td>
                                    <td className="p-4">{event.recipient_count} to {event.recipient}</td>
                                    <td className="p-4">{formatDate(event.next_retry_at)}</td>
                                    <td className="p-4 font-mono text-xs">{event.provider_message_id ?? "Pending"}</td>
                                    <td className="p-4">{formatDate(event.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
    return <article className="border border-white/10 bg-black/20 p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">{label}</p><p className="mt-3 text-2xl font-semibold text-white">{value}</p><p className="mt-2 text-xs text-potomac-cream/55">{detail}</p></article>;
}
