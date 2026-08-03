export function ArtemisEarthriseBackdrop() {
    return (
        <>
            <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black">
                <img
                    src="/artemis-ii-earthrise-nasa.jpg"
                    alt="Crescent Earth photographed by the Artemis II crew from lunar space"
                    className="absolute inset-y-0 right-0 h-full w-full object-cover object-[58%_64%] sm:w-[72%] sm:object-[50%_64%]"
                    fetchPriority="high"
                />
            </div>
            <span className="absolute bottom-3 right-5 z-10 bg-black/80 px-2 py-1 font-mono text-[0.5rem] uppercase text-white/70 md:right-10">
                NASA / Artemis II / ART002-E-009280B
            </span>
        </>
    );
}
