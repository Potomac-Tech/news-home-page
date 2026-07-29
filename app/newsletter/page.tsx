import type { Metadata } from "next";
import { ApplicationForm } from "../apply/ApplicationForm";

export const metadata: Metadata = {
    title: "Moonberg with Kevin Cirilli",
    description:
        "Moonberg with Kevin Cirilli is included free with approved Cabeus Explorer membership and delivered to the member signup email.",
    alternates: { canonical: "/newsletter" },
};

export default function NewsletterPage() {
    return (
        <div className="bg-cabeus-paper text-cabeus-ink">
            <section className="border-b border-cabeus-line">
                <div className="mx-auto grid min-h-[38rem] w-full max-w-[92rem] lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="flex flex-col justify-center px-5 py-16 md:px-10 md:py-24">
                        <p className="brand-kicker">The Explorer newsletter</p>
                        <h1 className="mt-6 max-w-[11ch] text-balance font-serif text-[clamp(4rem,7vw,7.5rem)] font-medium leading-[0.9]">
                            Moonberg with Kevin Cirilli.
                        </h1>
                        <p className="mt-7 max-w-2xl text-lg leading-8 text-cabeus-muted">
                            Approved Explorer members receive Moonberg free at the
                            same email address used to join Cabeus Explorer. There is
                            no separate paid newsletter subscription.
                        </p>
                        <a href="#join-explorer" className="brand-button mt-8 inline-flex self-start">
                            Join Explorer free
                        </a>
                    </div>
                    <div className="flex min-h-[22rem] flex-col justify-end bg-cabeus-ink px-5 py-12 text-cabeus-paper md:px-10 md:py-16">
                        <p className="font-mono text-xs font-bold uppercase text-cabeus-gold">
                            Included with membership
                        </p>
                        <p className="mt-5 max-w-lg font-serif text-4xl leading-tight md:text-5xl">
                            Market-moving space news, strategic context, and the people
                            shaping the lunar economy.
                        </p>
                        <p className="mt-6 max-w-lg text-sm leading-6 text-cabeus-paper/75">
                            Written by Kevin Cirilli and delivered to approved Explorer
                            members through their verified membership email.
                        </p>
                    </div>
                </div>
            </section>

            <section id="join-explorer" className="border-b border-cabeus-line">
                <div className="mx-auto grid w-full max-w-[92rem] gap-10 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-[0.72fr_1.28fr]">
                    <div>
                        <p className="brand-kicker">Free Explorer access</p>
                        <h2 className="mt-4 max-w-[10ch] font-serif text-5xl leading-[0.96] md:text-7xl">
                            One application. Membership and Moonberg.
                        </h2>
                        <p className="mt-6 max-w-xl leading-7 text-cabeus-muted">
                            Apply with the email where you want to receive the
                            newsletter. After verification and approval, that address
                            becomes your Explorer identity and Moonberg destination.
                        </p>
                    </div>
                    <div className="border border-cabeus-line p-5 md:p-8">
                        <p className="brand-kicker">Join Explorer</p>
                        <ApplicationForm />
                    </div>
                </div>
            </section>
        </div>
    );
}
