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
    manifest: "/manifest.json",
    title: {
        default: siteConfig.name,
        template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
            { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
        ],
        apple: [
            {
                url: "/apple-touch-icon.png",
                type: "image/png",
                sizes: "180x180",
            },
        ],
    },
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
