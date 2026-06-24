import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";

type AdminContext = {
    supabase: Awaited<ReturnType<typeof createClient>>;
    userId: string;
};

export async function requireAdmin(): Promise<AdminContext> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || !userId) {
        redirect("/auth/login?next=/admin/applications");
    }

    const { data: role } = await supabase
        .from("member_role_assignments")
        .select("id")
        .eq("user_id", userId)
        .eq("role_id", "admin")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1)
        .maybeSingle();

    if (!role) {
        redirect("/member");
    }

    return {
        supabase,
        userId,
    };
}
