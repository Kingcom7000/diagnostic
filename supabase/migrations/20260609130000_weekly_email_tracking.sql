alter table public.notifications
add column if not exists weekly_report_id uuid references public.weekly_reports(id) on delete set null,
add column if not exists provider_message_id text,
add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists notifications_weekly_report_id_idx
on public.notifications(weekly_report_id);

create index if not exists notifications_provider_message_id_idx
on public.notifications(provider_message_id);
