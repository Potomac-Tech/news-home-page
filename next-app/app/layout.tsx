import type { Metadata } from "next";
import "./globals.css";
import { MigrationShell } from "./_components/MigrationShell";
import { siteConfig } from "./_data/site";

export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.url),
    title: {
        default: siteConfig.name,
        template: "%s | Potomac",
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
