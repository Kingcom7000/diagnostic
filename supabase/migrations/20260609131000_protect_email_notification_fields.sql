create or replace function public.protect_notification_content_from_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    if new.user_id is distinct from old.user_id
      or new.weekly_report_id is distinct from old.weekly_report_id
      or new.channel is distinct from old.channel
      or new.subject is distinct from old.subject
      or new.body is distinct from old.body
      or new.provider_message_id is distinct from old.provider_message_id
      or new.metadata is distinct from old.metadata
      or new.created_at is distinct from old.created_at then
      raise exception 'Only Arthur admins can update notification content.';
    end if;
  end if;

  return new;
end;
$$;
