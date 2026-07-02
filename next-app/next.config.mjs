/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
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
                value: "DENY",
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
                    "font-src 'self' data:",
                    "connect-src 'self' https://*.supabase.co https://api.stripe.com",
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
                    "style-src 'self' 'unsafe-inline'",
                    "form-action 'self'",
                    "upgrade-insecure-requests",
                ].join("; "),
            },
        ];

        return [
            {
                source: "/(.*)",
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;
