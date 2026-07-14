/** @type {import('tailwindcss').Config} */
export default {
    content: ["./app/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                potomac: {
                    primary: "#0D1114",
                    secondary: "#1E2227",
                    gold: "#F3A712",
                    cream: "#EEF1F3",
                    regolith: "#B9A98B",
                    oxide: "#A34A32",
                    machine: "#6D747D",
                },
            },
            fontFamily: {
                sans: ["var(--font-source-sans)", "sans-serif"],
                serif: ["var(--font-oswald)", "Arial Narrow", "sans-serif"],
                mono: ["var(--font-ibm-plex-mono)", "monospace"],
            },
            backgroundImage: {
                "grid-pattern":
                    "linear-gradient(to right, rgba(243, 167, 18, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(243, 167, 18, 0.05) 1px, transparent 1px)",
            },
        },
    },
    plugins: [],
};
