/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    experimental: {
        serverActions: {
            // Leave room for multipart metadata around the 50 MB per-file limit.
            bodySizeLimit: "100mb",
        },
    },
    async headers() {
        const securityHeaders = [
            {
                key: "Strict-Transport-Security",
                value: "max-age=63072000; includeSubDomains; preload",
            },
            {
                key: "X-Content-Type-Options",
                value: "nosniff",
            },
            {
                key: "X-Permitted-Cross-Domain-Policies",
                value: "none",
            },
            {
                key: "X-Frame-Options",
                value: "SAMEORIGIN",
            },
            {
                key: "Referrer-Policy",
                value: "strict-origin-when-cross-origin",
            },
            {
                key: "Permissions-Policy",
                value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
            },
            {
                key: "Cross-Origin-Opener-Policy",
                value: "same-origin",
            },
            {
                key: "X-DNS-Prefetch-Control",
                value: "on",
            },
            {
                key: "Content-Security-Policy",
                value: [
                    "default-src 'self'",
                    "base-uri 'self'",
                    "frame-ancestors 'self'",
                    "object-src 'none'",
                    "img-src 'self' data: https:",
                    "media-src 'self' https://*.supabase.co",
                    "frame-src 'self' https://www.youtube-nocookie.com",
                    "font-src 'self' data: https://fonts.gstatic.com",
                    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://cloudflareinsights.com",
                    "script-src 'self' 'unsafe-inline' https://js.stripe.com https://static.cloudflareinsights.com",
                    "script-src-attr 'none'",
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                    "form-action 'self'",
                ].join("; "),
            },
        ];

        return [
            {
                source: "/(.*)",
                headers: securityHeaders,
            },
            {
                source: "/api/member/nexus/handoff",
                headers: [
                    {
                        key: "Referrer-Policy",
                        value: "no-referrer",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
