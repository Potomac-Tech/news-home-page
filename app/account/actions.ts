"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";

export async function updatePersonalizationPreference(formData: FormData) {
    const supabase = await createClient();
    const { error } = await supabase.rpc("set_member_personalization_enabled", {
        p_enabled: formData.get("behaviorRanking") === "on",
    });
    if (error) throw new Error("Unable to update personalization preference.");
    revalidatePath("/account");
}
