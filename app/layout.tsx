import type { Metadata } from "next";
import "./globals.css";
import { MigrationShell } from "./_components/MigrationShell";
import { siteConfig } from "./_data/site";

// The shared shell reads the Supabase session cookie for member-aware navigation.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.url),
    title: {
        default: siteConfig.name,
        template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    openGraph: {
        title: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
        siteName: siteConfig.name,
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <MigrationShell>{children}</MigrationShell>
            </body>
        </html>
    );
}
