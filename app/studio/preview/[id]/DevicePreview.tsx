"use client";

import { useState } from "react";

const devices = {
    computer: { label: "Computer", width: 1180, height: 760 },
    tablet: { label: "Tablet", width: 768, height: 900 },
    phone: { label: "Phone", width: 390, height: 780 },
} as const;

export function DevicePreview({ articleId }: { articleId: string }) {
    const [device, setDevice] = useState<keyof typeof devices>("computer");
    const selected = devices[device];

    return (
        <section>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Preview device">
                {Object.entries(devices).map(([key, item]) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={device === key}
                        onClick={() => setDevice(key as keyof typeof devices)}
                        className={`border px-5 py-3 font-mono text-xs font-bold uppercase ${
                            device === key
                                ? "border-potomac-gold bg-potomac-gold text-potomac-primary"
                                : "border-potomac-regolith/35 text-potomac-cream"
                        }`}
                    >
                        {item.label} · {item.width}px
                    </button>
                ))}
            </div>
            <div className="mt-5 overflow-auto border border-potomac-regolith/30 bg-black/40 p-4">
                <iframe
                    key={device}
                    title={`${selected.label} article preview`}
                    src={`/studio/preview/${articleId}/render`}
                    style={{ width: selected.width, height: selected.height }}
                    className="mx-auto block max-w-none border border-potomac-regolith/40 bg-potomac-primary"
                />
            </div>
        </section>
    );
}
