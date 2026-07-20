import type { Metadata } from "next";
import { IBM_Plex_Mono, Oswald, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { MigrationShell } from "./_components/MigrationShell";
import { siteConfig } from "./_data/site";
import { ConsentTelemetry } from "./_components/ConsentTelemetry";

// The shared shell reads the Supabase session cookie for member-aware navigation.
export const dynamic = "force-dynamic";

const sourceSans = Source_Sans_3({
    subsets: ["latin"],
    variable: "--font-source-sans",
    display: "optional",
});
const oswald = Oswald({
    subsets: ["latin"],
    variable: "--font-oswald",
    display: "optional",
});
const ibmPlexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-ibm-plex-mono",
    display: "optional",
});

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
            <body className={`${sourceSans.variable} ${oswald.variable} ${ibmPlexMono.variable}`}>
                <ConsentTelemetry />
                <MigrationShell>{children}</MigrationShell>
            </body>
        </html>
    );
}
