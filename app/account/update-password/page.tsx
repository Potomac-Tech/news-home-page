import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "../../auth/login/LoginForm";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set New Password",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/request-access?tab=signin&mode=recovery");
  }

  return (
    <section className="bg-grid-pattern">
      <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-3xl items-center px-4 py-20 md:px-8">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
            Account recovery
          </p>
          <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
            Set a new password
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-potomac-cream/80">
            This password secures the shared account used by Cabeus Explorer and
            Nexus.
          </p>
          <div className="mt-8">
            <LoginForm initialMode="reset" />
          </div>
        </div>
      </div>
    </section>
  );
}
