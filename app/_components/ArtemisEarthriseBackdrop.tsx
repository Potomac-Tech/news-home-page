export function ArtemisEarthriseBackdrop() {
    return (
        <figure className="relative w-full overflow-hidden bg-black">
            <div className="aspect-[3/2] w-full bg-black">
                <img
                    src="/artemis-ii-earthrise-moon-earth-nasa.jpg"
                    alt="Earth rising above the cratered lunar horizon during the Artemis II flyby"
                    className="h-full w-full object-contain"
                    fetchPriority="high"
                />
            </div>
            <figcaption className="absolute bottom-2 right-2 bg-black/85 px-2 py-1 font-mono text-[0.5rem] uppercase text-white/70">
                NASA / Artemis II / ART002-E-021278
            </figcaption>
        </figure>
    );
}
