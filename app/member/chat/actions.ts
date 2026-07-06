"use server";

import { revalidatePath } from "next/cache";
import { requireMemberChatAccess } from "../../../lib/auth/member-chat";

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

    if (value.length > 4000) {
        throw new Error("Message is too long.");
    }

    return value;
}

async function assertNoBlockBetween(
    supabase: Awaited<ReturnType<typeof requireMemberChatAccess>>["supabase"],
    firstUserId: string,
    secondUserId: string
) {
    const [firstBlock, secondBlock] = await Promise.all([
        supabase
            .from("member_chat_blocks")
            .select("blocker_user_id")
            .eq("blocker_user_id", firstUserId)
            .eq("blocked_user_id", secondUserId)
            .maybeSingle(),
        supabase
            .from("member_chat_blocks")
            .select("blocker_user_id")
            .eq("blocker_user_id", secondUserId)
            .eq("blocked_user_id", firstUserId)
            .maybeSingle(),
    ]);

    if (firstBlock.error || secondBlock.error) {
        throw new Error(
            firstBlock.error?.message ?? secondBlock.error?.message ?? "Block check failed."
        );
    }

    if (firstBlock.data || secondBlock.data) {
        throw new Error("This conversation cannot be started because a block exists.");
    }
}

export async function createConversation(formData: FormData) {
    const { supabase, userId } = await requireMemberChatAccess();
    const recipientUserId = getRequiredString(formData, "recipient_user_id");
    const subject = getOptionalString(formData, "subject");
    const body = getBody(formData);

    if (recipientUserId === userId) {
        throw new Error("Choose a different member.");
    }

    const { data: recipient, error: recipientError } = await supabase
        .from("member_profiles")
        .select("user_id,full_name")
        .eq("user_id", recipientUserId)
        .eq("status", "approved")
        .maybeSingle();

    if (recipientError) {
        throw new Error(recipientError.message);
    }

    if (!recipient) {
        throw new Error("That member is not available for chat discovery.");
    }

    await assertNoBlockBetween(supabase, userId, recipientUserId);

    const now = new Date().toISOString();
    const conversationId = crypto.randomUUID();
    const messageId = crypto.randomUUID();
    const { error: conversationError } = await supabase
        .from("member_chat_conversations")
        .insert({
            id: conversationId,
            created_by: userId,
            subject,
            last_message_at: now,
        });

    if (conversationError) {
        throw new Error(conversationError.message);
    }

    const { error: participantError } = await supabase
        .from("member_chat_participants")
        .insert([
            {
                conversation_id: conversationId,
                user_id: userId,
                created_by: userId,
                last_read_at: now,
            },
            {
                conversation_id: conversationId,
                user_id: recipientUserId,
                created_by: userId,
            },
        ]);

    if (participantError) {
        throw new Error(participantError.message);
    }

    const { error: messageError } = await supabase
        .from("member_chat_messages")
        .insert({
            id: messageId,
            conversation_id: conversationId,
            sender_user_id: userId,
            body,
            created_at: now,
        });

    if (messageError) {
        throw new Error(messageError.message);
    }

    await supabase.from("member_chat_read_receipts").upsert(
        {
            conversation_id: conversationId,
            user_id: userId,
            last_read_message_id: messageId,
            last_read_at: now,
        },
        { onConflict: "conversation_id,user_id" }
    );

    await supabase.from("member_chat_audit_events").insert({
        actor_user_id: userId,
        conversation_id: conversationId,
        message_id: messageId,
        target_user_id: recipientUserId,
        event_type: "conversation_started",
        event_summary: "Member started a direct chat conversation.",
    });

    revalidatePath("/member/chat");
}

export async function sendMessage(formData: FormData) {
    const { supabase, userId } = await requireMemberChatAccess();
    const conversationId = getRequiredString(formData, "conversation_id");
    const body = getBody(formData);
    const now = new Date().toISOString();
    const messageId = crypto.randomUUID();
    const { error } = await supabase.from("member_chat_messages").insert({
        id: messageId,
        conversation_id: conversationId,
        sender_user_id: userId,
        body,
        created_at: now,
    });

    if (error) {
        throw new Error(error.message);
    }

    await supabase.from("member_chat_read_receipts").upsert(
        {
            conversation_id: conversationId,
            user_id: userId,
            last_read_message_id: messageId,
            last_read_at: now,
        },
        { onConflict: "conversation_id,user_id" }
    );

    revalidatePath("/member/chat");
}

export async function markConversationRead(formData: FormData) {
    const { supabase, userId } = await requireMemberChatAccess();
    const conversationId = getRequiredString(formData, "conversation_id");
    const messageId = getOptionalString(formData, "last_read_message_id");
    const now = new Date().toISOString();

    const { error: receiptError } = await supabase
        .from("member_chat_read_receipts")
        .upsert(
            {
                conversation_id: conversationId,
                user_id: userId,
                last_read_message_id: messageId,
                last_read_at: now,
            },
            { onConflict: "conversation_id,user_id" }
        );

    if (receiptError) {
        throw new Error(receiptError.message);
    }

    const { error: participantError } = await supabase
        .from("member_chat_participants")
        .update({ last_read_at: now })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);

    if (participantError) {
        throw new Error(participantError.message);
    }

    revalidatePath("/member/chat");
}

export async function reportConversation(formData: FormData) {
    const { supabase, userId } = await requireMemberChatAccess();
    const conversationId = getRequiredString(formData, "conversation_id");
    const reason = getRequiredString(formData, "reason");
    const reporterNote = getOptionalString(formData, "reporter_note");
    const messageId = getOptionalString(formData, "message_id");
    const reportedUserId = getOptionalString(formData, "reported_user_id");

    const { error } = await supabase.from("member_chat_reports").insert({
        conversation_id: conversationId,
        message_id: messageId,
        reporter_user_id: userId,
        reported_user_id: reportedUserId,
        reason,
        reporter_note: reporterNote,
    });

    if (error) {
        throw new Error(error.message);
    }

    await supabase.from("member_chat_audit_events").insert({
        actor_user_id: userId,
        conversation_id: conversationId,
        message_id: messageId,
        target_user_id: reportedUserId,
        event_type: "conversation_reported",
        event_summary: "Member reported a direct chat conversation.",
    });

    revalidatePath("/member/chat");
}

export async function blockMember(formData: FormData) {
    const { supabase, userId } = await requireMemberChatAccess();
    const blockedUserId = getRequiredString(formData, "blocked_user_id");
    const conversationId = getOptionalString(formData, "conversation_id");
    const reason = getOptionalString(formData, "reason");

    if (blockedUserId === userId) {
        throw new Error("You cannot block yourself.");
    }

    const { error } = await supabase.from("member_chat_blocks").insert({
        blocker_user_id: userId,
        blocked_user_id: blockedUserId,
        reason,
    });

    if (error) {
        throw new Error(error.message);
    }

    if (conversationId) {
        await supabase.from("member_chat_audit_events").insert({
            actor_user_id: userId,
            conversation_id: conversationId,
            target_user_id: blockedUserId,
            event_type: "member_blocked",
            event_summary: "Member blocked another chat participant.",
        });
    }

    revalidatePath("/member/chat");
}
