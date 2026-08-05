import { redirect } from "next/navigation";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;
    const values = new URLSearchParams({ tab: "signin" });

    for (const key of ["next", "source", "campaign", "content", "tier", "mode"]) {
        const value = params[key];
        if (typeof value === "string") values.set(key, value);
    }

    redirect(`/request-access?${values.toString()}`);
}
