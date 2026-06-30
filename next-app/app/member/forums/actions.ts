"use server";

import { revalidatePath } from "next/cache";
import { requireMemberForumAccess } from "../../../lib/auth/member-forum";

function getRequiredString(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        throw new Error(`Missing ${key}.`);
    }

    return value;
}

function getOptionalString(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    return value || null;
}

function getBody(formData: FormData, key = "body") {
    const value = getRequiredString(formData, key);

    if (value.length > 8000) {
        throw new Error("Forum post is too long.");
    }

    return value;
}

async function getTopicForumId(
    supabase: Awaited<ReturnType<typeof requireMemberForumAccess>>["supabase"],
    topicId: string
) {
    const { data, error } = await supabase
        .from("member_forum_topics")
        .select("forum_id")
        .eq("id", topicId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    if (!data?.forum_id) {
        throw new Error("Forum topic not found.");
    }

    return data.forum_id as string;
}

export async function createForumTopic(formData: FormData) {
    const { supabase, userId } = await requireMemberForumAccess();
    const forumId = getRequiredString(formData, "forum_id");
    const title = getRequiredString(formData, "title");
    const summary = getOptionalString(formData, "summary");
    const body = getBody(formData);
    const topicId = crypto.randomUUID();
    const postId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error: topicError } = await supabase
        .from("member_forum_topics")
        .insert({
            id: topicId,
            forum_id: forumId,
            author_user_id: userId,
            title,
            summary,
            status: "open",
            last_post_at: now,
        });

    if (topicError) {
        throw new Error(topicError.message);
    }

    const { error: postError } = await supabase
        .from("member_forum_posts")
        .insert({
            id: postId,
            topic_id: topicId,
            author_user_id: userId,
            body,
            created_at: now,
        });

    if (postError) {
        throw new Error(postError.message);
    }

    await supabase.from("member_forum_audit_events").insert({
        actor_user_id: userId,
        forum_id: forumId,
        topic_id: topicId,
        post_id: postId,
        event_type: "topic_created",
        event_summary: "Member created a forum topic.",
    });

    revalidatePath("/member/forums");
}

export async function replyToForumTopic(formData: FormData) {
    const { supabase, userId } = await requireMemberForumAccess();
    const topicId = getRequiredString(formData, "topic_id");
    const parentPostId = getOptionalString(formData, "parent_post_id");
    const body = getBody(formData);
    const postId = crypto.randomUUID();
    const { error } = await supabase.from("member_forum_posts").insert({
        id: postId,
        topic_id: topicId,
        parent_post_id: parentPostId,
        author_user_id: userId,
        body,
    });

    if (error) {
        throw new Error(error.message);
    }

    await supabase.from("member_forum_audit_events").insert({
        actor_user_id: userId,
        forum_id: await getTopicForumId(supabase, topicId),
        topic_id: topicId,
        post_id: postId,
        event_type: "post_created",
        event_summary: "Member replied to a forum topic.",
    });

    revalidatePath("/member/forums");
}

export async function bookmarkForumTopic(formData: FormData) {
    const { supabase, userId } = await requireMemberForumAccess();
    const topicId = getRequiredString(formData, "topic_id");
    const { error } = await supabase.from("member_forum_bookmarks").upsert(
        {
            topic_id: topicId,
            user_id: userId,
        },
        {
            ignoreDuplicates: true,
            onConflict: "topic_id,user_id",
        }
    );

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/member/forums");
}

export async function reactToForumPost(formData: FormData) {
    const { supabase, userId } = await requireMemberForumAccess();
    const postId = getRequiredString(formData, "post_id");
    const reactionType = getRequiredString(formData, "reaction_type");

    if (!["useful", "follow_up", "source_request"].includes(reactionType)) {
        throw new Error("Invalid reaction.");
    }

    const { error } = await supabase.from("member_forum_reactions").upsert(
        {
            post_id: postId,
            user_id: userId,
            reaction_type: reactionType,
        },
        {
            ignoreDuplicates: true,
            onConflict: "post_id,user_id,reaction_type",
        }
    );

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/member/forums");
}

export async function reportForumContent(formData: FormData) {
    const { supabase, userId } = await requireMemberForumAccess();
    const forumId = getOptionalString(formData, "forum_id");
    const topicId = getOptionalString(formData, "topic_id");
    const postId = getOptionalString(formData, "post_id");
    const reportedUserId = getOptionalString(formData, "reported_user_id");
    const reason = getRequiredString(formData, "reason");
    const reporterNote = getOptionalString(formData, "reporter_note");

    if (!forumId && !topicId && !postId) {
        throw new Error("Choose forum content to report.");
    }

    const { error } = await supabase.from("member_forum_reports").insert({
        forum_id: forumId,
        topic_id: topicId,
        post_id: postId,
        reporter_user_id: userId,
        reported_user_id: reportedUserId,
        reason,
        reporter_note: reporterNote,
    });

    if (error) {
        throw new Error(error.message);
    }

    await supabase.from("member_forum_audit_events").insert({
        actor_user_id: userId,
        forum_id: forumId,
        topic_id: topicId,
        post_id: postId,
        target_user_id: reportedUserId,
        event_type: "forum_content_reported",
        event_summary: "Member reported forum content for moderation.",
    });

    revalidatePath("/member/forums");
}
