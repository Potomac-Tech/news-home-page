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
            className="bg-cabeus-paper outline-none"
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
                    <div className="pb-8 pt-6 md:pb-10 md:pt-8">
                        <p className="brand-kicker">
                            Latest intelligence / {slide.slideType.replaceAll("_", " ")}
                        </p>
                        <div className="mt-5 grid min-w-0 gap-7 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start lg:gap-12">
                            <div className="flex min-h-full min-w-0 flex-col">
                                <h2 className="max-w-full text-balance font-serif text-[clamp(2.4rem,3.7vw,4rem)] font-medium leading-[0.94] text-cabeus-ink">
                                    {slide.title}
                                </h2>
                                <div className="brand-rule mt-7 w-28" />
                                <p className="mt-6 max-w-xl text-base leading-7 text-cabeus-muted md:text-lg md:leading-8">
                                    {slide.summary}
                                </p>
                                <Link
                                    href={slide.ctaRoute}
                                    onClick={() => trackAnalyticsEvent({ name: "cta_click", route: "/", metadata: { placement: "homepage_carousel", slideId: slide.id } })}
                                    className="brand-button mt-7 inline-flex self-start"
                                >
                                    {slide.ctaLabel}
                                </Link>
                            </div>
                            <img
                                src={slide.visualAssetUrl}
                                alt={slide.visualAssetAlt}
                                loading={index === 0 ? "eager" : "lazy"}
                                fetchPriority={index === 0 ? "high" : "auto"}
                                sizes="(min-width: 1024px) 55vw, 100vw"
                                className={`aspect-[16/10] min-w-0 max-h-[31rem] w-full bg-cabeus-smoke ${
                                    slide.visualAssetUrl.includes("space-investment-forum")
                                    || slide.visualAssetUrl.includes("/editorial-media/")
                                        ? "object-contain object-top"
                                        : "object-cover"
                                }`}
                            />
                        </div>
                    </div>
                </article>
            ))}

            <div className="flex flex-col items-start justify-between gap-3 border-t border-cabeus-line py-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2" role="tablist" aria-label="Choose story">
                    {slides.map((slide, index) => (
                        <button
                            key={slide.id}
                            type="button"
                            role="tab"
                            aria-selected={index === activeIndex}
                            aria-label={`Show story ${index + 1}: ${slide.title}`}
                            onClick={() => setActiveIndex(index)}
                            className={`h-10 w-10 border transition ${index === activeIndex ? "border-cabeus-ink bg-cabeus-ink" : "border-cabeus-line bg-transparent hover:border-cabeus-gold"}`}
                        >
                            <span className={`font-mono text-xs ${index === activeIndex ? "text-cabeus-paper" : "text-cabeus-ink"}`}>{index + 1}</span>
                        </button>
                    ))}
                </div>
                {count > 1 ? (
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => move(-1)} aria-label="Previous story" className="h-10 min-w-10 border border-cabeus-line bg-transparent px-3 text-xl text-cabeus-ink hover:border-cabeus-gold">&#8592;</button>
                        <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Resume rotation" : "Pause rotation"} className="h-10 border border-cabeus-line bg-transparent px-4 font-mono text-[0.65rem] font-bold uppercase text-cabeus-ink hover:border-cabeus-gold">{paused ? "Resume" : "Pause"}</button>
                        <button type="button" onClick={() => move(1)} aria-label="Next story" className="h-10 min-w-10 border border-cabeus-line bg-transparent px-3 text-xl text-cabeus-ink hover:border-cabeus-gold">&#8594;</button>
                    </div>
                ) : null}
            </div>
            <p className="sr-only" aria-live="polite">Showing {active.title}</p>
        </section>
    );
}
