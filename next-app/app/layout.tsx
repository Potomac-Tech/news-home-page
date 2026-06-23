import type { Metadata } from "next";
import "./globals.css";
import { MigrationShell } from "./_components/MigrationShell";

export const metadata: Metadata = {
    title: {
        default: "Potomac News & Intelligence",
        template: "%s | Potomac",
    },
    description:
        "Potomac's migration foundation for a news-first lunar intelligence platform.",
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
