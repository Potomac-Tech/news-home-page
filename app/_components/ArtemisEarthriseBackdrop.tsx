export function ArtemisEarthriseBackdrop() {
    return (
        <figure className="flex min-h-[34rem] w-full flex-col bg-cabeus-ink text-cabeus-paper md:min-h-[39rem]">
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-5 pt-8 md:px-10 md:pt-12">
                <img
                    src="/artemis-ii-earthrise-feature.jpg"
                    alt="Earth rising above the cratered lunar horizon during the Artemis II flyby"
                    className="h-full max-h-[29rem] w-full object-contain object-center"
                    fetchPriority="high"
                />
            </div>
            <figcaption className="px-5 pb-10 pt-7 md:px-10 md:pb-12">
                <p className="font-mono text-xs font-bold uppercase text-cabeus-gold">
                    Artemis II Earthrise
                </p>
                <p className="mt-3 font-serif text-4xl leading-none">Home above the lunar horizon.</p>
                <p className="mt-4 font-mono text-[0.55rem] uppercase text-cabeus-paper/60">
                    NASA / Artemis II / ART002-E-009288
                </p>
            </figcaption>
        </figure>
    );
}
