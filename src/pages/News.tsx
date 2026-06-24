import React from "react";
import { Link } from "react-router-dom";
import { stories } from "../data/newsIntelligence";

const News: React.FC = () => {
    return (
        <section className="bg-grid-pattern pt-20">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="max-w-3xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Public feed
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        News
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        Public Potomac news, lunar intelligence snippets,
                        citations, and member-gated full stories.
                    </p>
                </div>
                <div className="mt-12 grid gap-6 md:grid-cols-2">
                    {stories.map((story) => (
                        <article key={story.title} className="glass-card rounded p-6">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                {story.sourceLabel} - {story.accessTier}+ full brief
                            </p>
                            <h2 className="mt-4 font-serif text-2xl leading-snug text-white">
                                {story.title}
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                {story.summary}
                            </p>
                            <p className="mt-4 border-l border-potomac-gold/35 pl-4 text-sm leading-6 text-potomac-cream/60">
                                {story.snippet}
                            </p>
                            <Link
                                to={story.href}
                                className="mt-6 inline-block text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold hover:text-potomac-cream"
                            >
                                Read brief
                            </Link>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default News;
