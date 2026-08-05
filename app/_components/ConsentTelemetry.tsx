"use client";

import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useCallback, useEffect, useRef } from "react";
import { consentChangedEvent, readCookiePreferences } from "../../lib/platform/consent";

type TelemetryPayload = {
    event_kind: "navigation" | "web_vital" | "client_error";
    route_path: string;
    metric_name?: string;
    metric_value?: number;
    metric_rating?: string;
    metadata?: Record<string, string | number | boolean>;
};

function redact(value: string) {
    return value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]").slice(0, 240);
}

export function ConsentTelemetry() {
    const pathname = usePathname();
    const analyticsAllowed = useRef(false);

    const send = useCallback((payload: TelemetryPayload) => {
        if (!analyticsAllowed.current) return;
        void fetch("/api/telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Analytics-Consent": "granted" },
            keepalive: true,
            body: JSON.stringify(payload),
        }).catch(() => undefined);
    }, []);

    useReportWebVitals((metric) => {
        send({
            event_kind: "web_vital",
            route_path: window.location.pathname,
            metric_name: metric.name,
            metric_value: metric.value,
            metric_rating: metric.rating,
            metadata: { navigation_type: metric.navigationType },
        });
    });

    useEffect(() => {
        analyticsAllowed.current = readCookiePreferences().analytics;
        const updateConsent = () => {
            analyticsAllowed.current = readCookiePreferences().analytics;
            if (analyticsAllowed.current) {
                send({ event_kind: "navigation", route_path: window.location.pathname });
            }
        };
        window.addEventListener(consentChangedEvent, updateConsent);
        return () => window.removeEventListener(consentChangedEvent, updateConsent);
    }, [send]);

    useEffect(() => {
        send({ event_kind: "navigation", route_path: pathname });
    }, [pathname, send]);

    useEffect(() => {
        const onError = (event: ErrorEvent) => send({
            event_kind: "client_error",
            route_path: window.location.pathname,
            metric_name: "window_error",
            metadata: { message: redact(event.message || "Unknown client error") },
        });
        const onRejection = (event: PromiseRejectionEvent) => send({
            event_kind: "client_error",
            route_path: window.location.pathname,
            metric_name: "unhandled_rejection",
            metadata: { message: redact(event.reason instanceof Error ? event.reason.message : String(event.reason)) },
        });
        window.addEventListener("error", onError);
        window.addEventListener("unhandledrejection", onRejection);
        return () => {
            window.removeEventListener("error", onError);
            window.removeEventListener("unhandledrejection", onRejection);
        };
    }, [send]);

    return null;
}
