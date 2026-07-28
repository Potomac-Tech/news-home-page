"use server";

import { revalidatePath } from "next/cache";
import { requireEditorialStaff } from "../../../lib/auth/editorial";

export async function updateCarouselPosition(formData: FormData) {
    const { supabase } = await requireEditorialStaff("/studio/dashboard");
    const articleId = String(formData.get("article_id") ?? "").trim();
    const rawPosition = String(formData.get("carousel_position") ?? "").trim();

    if (!articleId) throw new Error("Missing article.");

    const position = rawPosition ? Number.parseInt(rawPosition, 10) : null;
    if (
        position !== null
        && (!Number.isInteger(position) || position < 1 || position > 5)
    ) {
        throw new Error("Carousel position must be N/A or 1 through 5.");
    }

    const { error } = await supabase.rpc(
        "set_editorial_article_carousel_position",
        {
            p_article_id: articleId,
            p_position: position,
        }
    );
    if (error) throw new Error(error.message);

    revalidatePath("/");
    revalidatePath("/studio");
    revalidatePath("/studio/dashboard");
}
