/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        serverActions: {
            bodySizeLimit: "50mb",
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
                key: "Content-Security-Policy-Report-Only",
                value: [
                    "default-src 'self'",
                    "base-uri 'self'",
                    "frame-ancestors 'none'",
                    "object-src 'none'",
                    "img-src 'self' data: https:",
                    "media-src 'self' https://*.supabase.co",
                    "frame-src 'self'",
                    "font-src 'self' data: https://fonts.gstatic.com",
                    "connect-src 'self' https://*.supabase.co https://api.stripe.com",
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
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
