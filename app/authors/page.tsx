import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Authors",
    description:
        "Professional biographies, credentials, and published work from Cabeus Explorer journalists and analysts.",
    alternates: {
        canonical: "/authors",
    },
};

export default async function AuthorsPage() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("editorial_authors")
        .select("id,display_name,slug,title,organization,bio,avatar_url")
        .eq("is_active", true)
        .order("display_name");

    if (error) throw new Error(error.message);

    return (
        <section className="bg-grid-pattern min-h-screen">
            <header className="border-b border-white/10">
                <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
                    <p className="font-mono text-xs font-bold uppercase text-potomac-gold">
                        Editorial transparency
                    </p>
                    <h1 className="mt-4 font-serif text-5xl text-white md:text-6xl">
                        Authors
                    </h1>
                    <p className="mt-5 max-w-3xl text-lg leading-8 text-potomac-cream/75">
                        Meet the journalists and analysts responsible for Cabeus
                        Explorer reporting. Each profile includes professional
                        background and an archive of published work.
                    </p>
                </div>
            </header>
            <div className="mx-auto grid max-w-7xl gap-px bg-white/10 px-4 py-12 md:grid-cols-2 md:px-8 lg:grid-cols-3">
                {(data ?? []).map((author) => (
                    <Link
                        key={author.id}
                        href={`/authors/${author.slug}`}
                        className="bg-potomac-primary p-6 transition hover:bg-potomac-secondary"
                    >
                        {author.avatar_url ? (
                            <img
                                src={author.avatar_url}
                                alt={author.display_name}
                                className="h-28 w-28 border border-potomac-gold/35 object-cover"
                            />
                        ) : null}
                        <h2 className="mt-5 font-serif text-3xl text-white">
                            {author.display_name}
                        </h2>
                        <p className="mt-2 font-mono text-xs uppercase text-potomac-gold">
                            {[author.title, author.organization].filter(Boolean).join(" | ") ||
                                "Cabeus Explorer"}
                        </p>
                        <p className="mt-4 line-clamp-4 text-sm leading-6 text-potomac-cream/70">
                            {author.bio || "Professional biography forthcoming."}
                        </p>
                        <span className="mt-5 inline-block font-mono text-xs font-bold uppercase text-potomac-gold">
                            Biography and articles
                        </span>
                    </Link>
                ))}
                {!data?.length ? (
                    <p className="bg-potomac-primary p-6 text-potomac-regolith">
                        Author biographies are being prepared.
                    </p>
                ) : null}
            </div>
        </section>
    );
}
