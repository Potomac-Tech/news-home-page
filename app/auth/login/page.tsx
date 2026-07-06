import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
    title: "Sign In",
};

export default function LoginPage() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl items-center gap-10 px-4 py-20 md:grid-cols-[0.9fr_1.1fr] md:px-8">
                <div>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Member access
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Sign in
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-potomac-cream/80">
                        Use Supabase Auth to enter the protected member
                        workspace. Approved access tiers will be enforced after
                        the member schema is added.
                    </p>
                </div>
                <LoginForm />
            </div>
        </section>
    );
}
