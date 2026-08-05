import { absoluteSiteUrl, siteConfig } from "../_data/site";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

export async function GET() {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    let articles: Array<{
        slug: string;
        title: string;
        published_at: string;
    }> = [];

    if (hasPotomacSupabasePublicConfig()) {
        try {
            const supabase = await createClient();
            const { data, error } = await supabase
                .from("editorial_articles")
                .select("slug,title,published_at")
                .eq("status", "published")
                .not("primary_author_id", "is", null)
                .gte("published_at", cutoff.toISOString())
                .lte("published_at", now.toISOString())
                .order("published_at", { ascending: false })
                .limit(1000);

            if (!error) {
                articles = (data ?? []).filter(
                    (article): article is typeof article & { published_at: string } =>
                        typeof article.published_at === "string"
                );
            }
        } catch {
            articles = [];
        }
    }

    const urls = articles
        .map(
            (article) => `  <url>
    <loc>${escapeXml(absoluteSiteUrl(`/news/${article.slug}`))}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteConfig.name)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(new Date(article.published_at).toISOString())}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
    </news:news>
  </url>`
        )
        .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

    return new Response(xml, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=300",
        },
    });
}
