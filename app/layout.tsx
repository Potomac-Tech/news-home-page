import type { Metadata } from "next";
import {
    Cormorant_Garamond,
    DM_Sans,
    IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";
import { MigrationShell } from "./_components/MigrationShell";
import { siteConfig } from "./_data/site";
import { ConsentTelemetry } from "./_components/ConsentTelemetry";

// The shared shell reads the Supabase session cookie for member-aware navigation.
export const dynamic = "force-dynamic";

const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-dm-sans",
    weight: ["400", "500", "600", "700"],
    display: "optional",
});
const cormorant = Cormorant_Garamond({
    subsets: ["latin"],
    variable: "--font-cormorant",
    weight: ["400", "500", "600"],
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
            <body className={`${dmSans.variable} ${cormorant.variable} ${ibmPlexMono.variable}`}>
                <ConsentTelemetry />
                <MigrationShell>{children}</MigrationShell>
            </body>
        </html>
    );
}
