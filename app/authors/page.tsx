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
        <div className="min-h-screen bg-cabeus-paper text-cabeus-ink">
            <header className="border-b border-cabeus-line">
                <div className="mx-auto w-full max-w-[92rem] px-5 py-14 md:px-10 md:py-20">
                    <p className="brand-kicker">
                        Editorial transparency
                    </p>
                    <h1 className="mt-4 font-serif text-6xl font-medium leading-none text-cabeus-ink md:text-8xl">
                        Authors
                    </h1>
                    <p className="mt-5 max-w-3xl text-lg leading-8 text-cabeus-muted">
                        Meet the journalists and analysts responsible for Cabeus
                        Explorer reporting. Each profile includes professional
                        background and an archive of published work.
                    </p>
                </div>
            </header>
            <main className="mx-auto grid w-full max-w-[92rem] gap-8 px-5 py-12 md:grid-cols-2 md:px-10 md:py-16 lg:grid-cols-3">
                {(data ?? []).map((author) => (
                    <Link
                        key={author.id}
                        href={`/authors/${author.slug}`}
                        className="group border-t border-cabeus-line pt-5"
                    >
                        {author.avatar_url ? (
                            <img
                                src={author.avatar_url}
                                alt={author.display_name}
                                className="aspect-square w-full border border-cabeus-line bg-cabeus-smoke object-cover grayscale transition duration-300 group-hover:grayscale-0"
                            />
                        ) : null}
                        <p className="mt-5 font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                            {[author.title, author.organization].filter(Boolean).join(" / ") ||
                                "Cabeus Explorer"}
                        </p>
                        <h2 className="mt-2 font-serif text-4xl font-medium leading-none text-cabeus-ink transition group-hover:text-cabeus-bronze">
                            {author.display_name}
                        </h2>
                        <p className="mt-4 line-clamp-4 text-sm leading-6 text-cabeus-muted">
                            {author.bio || "Professional biography forthcoming."}
                        </p>
                        <span className="mt-5 inline-block border-b border-cabeus-gold pb-1 font-mono text-xs font-bold uppercase text-cabeus-ink">
                            Biography and articles &#8594;
                        </span>
                    </Link>
                ))}
                {!data?.length ? (
                    <p className="border-y border-cabeus-line py-10 text-cabeus-muted">
                        Author biographies are being prepared.
                    </p>
                ) : null}
            </main>
        </div>
    );
}
