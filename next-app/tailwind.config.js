/** @type {import('tailwindcss').Config} */
export default {
    content: ["./app/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                potomac: {
                    primary: "#2D3038",
                    secondary: "#2E3138",
                    gold: "#D4AF37",
                    cream: "#EAE5D7",
                },
            },
            fontFamily: {
                sans: ['"Source Sans 3"', "sans-serif"],
                serif: ['"Cinzel"', "serif"],
            },
            backgroundImage: {
                "grid-pattern":
                    "linear-gradient(to right, rgba(212, 175, 55, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(212, 175, 55, 0.05) 1px, transparent 1px)",
            },
        },
    },
    plugins: [],
};
