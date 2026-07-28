"use server";

import { revalidatePath } from "next/cache";
import { requireEditorialStaff } from "../../../lib/auth/editorial";

type CarouselPosition = 1 | 2 | 3 | 4 | 5 | null;

export async function updateCarouselPosition(
    articleId: string,
    position: CarouselPosition
) {
    const { supabase } = await requireEditorialStaff("/studio/dashboard");

    if (!articleId) throw new Error("Missing article.");
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

    const { data: savedArticle, error: savedArticleError } = await supabase
        .from("editorial_articles")
        .select("carousel_position")
        .eq("id", articleId)
        .single();
    if (savedArticleError) throw new Error(savedArticleError.message);
    if (savedArticle.carousel_position !== position) {
        throw new Error("Carousel position was not saved. Please try again.");
    }

    revalidatePath("/");
    revalidatePath("/studio");
    revalidatePath("/studio/dashboard");
    return { position: savedArticle.carousel_position as CarouselPosition };
}
