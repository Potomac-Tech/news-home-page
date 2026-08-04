export function RealisticMoonBackdrop() {
    return (
        <>
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <img
                    src="/cabeus-realistic-moon.png"
                    alt="Photoreal rendering of the Moon's near side based on Apollo 11 lunar geography"
                    className="absolute right-0 top-1/2 h-auto w-[36rem] max-w-none translate-x-[58%] -translate-y-1/2 opacity-25 sm:w-[min(78rem,100vw)] sm:translate-x-[48%] sm:opacity-100"
                    fetchPriority="high"
                />
            </div>
            <span className="absolute bottom-3 right-5 z-10 bg-cabeus-paper/85 px-2 py-1 font-mono text-[0.5rem] uppercase text-cabeus-muted md:right-10">
                NASA / Apollo 11 geography reference / Cabeus rendering
            </span>
        </>
    );
}
