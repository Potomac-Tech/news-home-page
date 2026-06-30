drop policy if exists "member_profiles_select_chat_discovery"
on public.member_profiles;

create policy "member_profiles_select_chat_discovery"
on public.member_profiles
for select
to authenticated
using (
    status = 'approved'
    and app_private.can_use_member_chat(auth.uid())
    and app_private.can_use_member_chat(user_id)
);

create or replace function public.set_member_chat_last_message_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    update public.member_chat_conversations
    set last_message_at = new.created_at
    where id = new.conversation_id;

    return new;
end;
$$;

drop trigger if exists update_member_chat_last_message_at
on public.member_chat_messages;

create trigger update_member_chat_last_message_at
after insert on public.member_chat_messages
for each row execute function public.set_member_chat_last_message_at();
