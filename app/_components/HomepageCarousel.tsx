"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HomepageCarouselSlide } from "../_data/homepageCarousel";
import { trackAnalyticsEvent } from "../../lib/platform/baseline";

const rotationMs = 8_000;

export function HomepageCarousel({ slides }: { slides: HomepageCarouselSlide[] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [interacting, setInteracting] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(true);
    const regionRef = useRef<HTMLElement>(null);
    const count = slides.length;

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReducedMotion(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);

    const move = useCallback((direction: number) => {
        setActiveIndex((current) => (current + direction + count) % count);
    }, [count]);

    useEffect(() => {
        if (count <= 1 || paused || interacting || reducedMotion) return;
        const timer = window.setInterval(() => move(1), rotationMs);
        return () => window.clearInterval(timer);
    }, [count, interacting, move, paused, reducedMotion]);

    if (!count) return null;
    const active = slides[activeIndex] ?? slides[0];

    return (
        <section
            ref={regionRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Top lunar intelligence stories"
            tabIndex={0}
            onMouseEnter={() => setInteracting(true)}
            onMouseLeave={() => setInteracting(false)}
            onFocusCapture={() => setInteracting(true)}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
            }}
            onKeyDown={(event) => {
                if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
                if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
                if (event.key === " ") { event.preventDefault(); setPaused((value) => !value); }
            }}
            className="bg-potomac-primary outline-none"
        >
            {slides.map((slide, index) => (
                <article
                    key={slide.id}
                    aria-roledescription="slide"
                    aria-label={`${index + 1} of ${count}`}
                    aria-hidden={index !== activeIndex}
                    inert={index !== activeIndex ? true : undefined}
                    className={index === activeIndex ? "block" : "hidden"}
                >
                    <div className="px-5 pb-7 pt-8 lg:px-8 lg:pt-10">
                        <p className="font-mono text-[0.68rem] font-bold uppercase text-potomac-gold">
                            Cabeus Explorer / {slide.slideType.replaceAll("_", " ")}
                        </p>
                        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.28fr)] lg:items-start lg:gap-9">
                            <div>
                                <h1 className="max-w-[18ch] font-serif text-4xl uppercase leading-[1.04] text-white">
                                    {slide.title}
                                </h1>
                                <div className="industrial-divider mt-6 h-px w-40" />
                            </div>
                            <img
                                src={slide.visualAssetUrl}
                                alt={slide.visualAssetAlt}
                                loading={index === 0 ? "eager" : "lazy"}
                                fetchPriority={index === 0 ? "high" : "auto"}
                                sizes="(min-width: 1024px) 55vw, 100vw"
                                className={`aspect-video max-h-[22rem] w-full bg-potomac-primary ${
                                    slide.visualAssetUrl.includes("space-investment-forum")
                                    || slide.visualAssetUrl.includes("/editorial-media/")
                                        ? "object-contain object-top"
                                        : "object-cover"
                                }`}
                            />
                        </div>
                        <p className="mt-6 max-w-4xl text-base leading-7 text-potomac-cream/80">
                            {slide.summary}
                        </p>
                        <Link
                            href={slide.ctaRoute}
                            onClick={() => trackAnalyticsEvent({ name: "cta_click", route: "/", metadata: { placement: "homepage_carousel", slideId: slide.id } })}
                            className="mt-7 inline-flex min-h-11 items-center bg-potomac-gold px-5 py-3 font-mono text-[0.68rem] font-bold uppercase text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            {slide.ctaLabel}
                        </Link>
                    </div>
                </article>
            ))}

            <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center lg:px-8">
                <div className="flex items-center gap-2" role="tablist" aria-label="Choose story">
                    {slides.map((slide, index) => (
                        <button
                            key={slide.id}
                            type="button"
                            role="tab"
                            aria-selected={index === activeIndex}
                            aria-label={`Show story ${index + 1}: ${slide.title}`}
                            onClick={() => setActiveIndex(index)}
                            className={`h-11 w-11 border transition ${index === activeIndex ? "border-potomac-gold bg-potomac-gold/20" : "border-white/25 bg-black/25 hover:border-potomac-gold"}`}
                        >
                            <span className="font-mono text-xs text-white">{index + 1}</span>
                        </button>
                    ))}
                </div>
                {count > 1 ? (
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => move(-1)} aria-label="Previous story" className="h-11 min-w-11 border border-white/30 bg-black/30 px-3 text-xl text-white hover:border-potomac-gold">&#8592;</button>
                        <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Resume rotation" : "Pause rotation"} className="h-11 border border-white/30 bg-black/30 px-4 font-mono text-[0.65rem] font-bold uppercase text-white hover:border-potomac-gold">{paused ? "Resume" : "Pause"}</button>
                        <button type="button" onClick={() => move(1)} aria-label="Next story" className="h-11 min-w-11 border border-white/30 bg-black/30 px-3 text-xl text-white hover:border-potomac-gold">&#8594;</button>
                    </div>
                ) : null}
            </div>
            <p className="sr-only" aria-live="polite">Showing {active.title}</p>
        </section>
    );
}
