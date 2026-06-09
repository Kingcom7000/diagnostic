-- Arthur V1 database schema.
-- Current schema after all migrations.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  name text not null,
  sector text not null,
  city text not null,
  main_offer text not null,
  website_url text,
  facebook_url text,
  instagram_url text,
  google_business_url text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  website_url text,
  created_at timestamptz not null default now()
);

create table public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  week_starts_on date not null,
  growth_score integer not null check (growth_score between 0 and 100),
  score_explanation text not null,
  arthur_summary text not null,
  opportunities jsonb not null default '[]'::jsonb,
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (business_id, week_starts_on)
);

create table public.actions (
  id uuid primary key default gen_random_uuid(),
  weekly_report_id uuid not null references public.weekly_reports(id) on delete cascade,
  title text not null,
  priority text not null check (priority in ('low', 'medium', 'high')),
  impact text not null,
  reason text not null,
  steps jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.content_pieces (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  weekly_report_id uuid references public.weekly_reports(id) on delete set null,
  type text not null check (type in ('facebook_post', 'instagram_post', 'email', 'newsletter')),
  title text not null,
  body text not null,
  saved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.score_history (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  explanation text not null,
  recorded_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  weekly_report_id uuid references public.weekly_reports(id) on delete set null,
  channel text not null check (channel in ('app', 'email')),
  subject text not null,
  body text not null,
  provider_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  opened_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'starter' check (plan in ('starter', 'pro')),
  status text not null default 'trialing',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_user_id_idx on public.businesses(user_id);
create index competitors_business_id_idx on public.competitors(business_id);
create index weekly_reports_business_week_idx on public.weekly_reports(business_id, week_starts_on desc);
create index actions_weekly_report_id_idx on public.actions(weekly_report_id);
create index content_pieces_business_id_idx on public.content_pieces(business_id, created_at desc);
create index score_history_business_id_idx on public.score_history(business_id, recorded_at desc);
create index notifications_user_id_idx on public.notifications(user_id, created_at desc);
create index notifications_weekly_report_id_idx on public.notifications(weekly_report_id);
create index notifications_provider_message_id_idx on public.notifications(provider_message_id);
create index subscriptions_user_id_idx on public.subscriptions(user_id);

create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger set_businesses_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select auth.role() = 'service_role'
    or exists (
      select 1
      from public.users
      where id = auth.uid()
        and role = 'admin'
    );
$$;

create or replace function public.protect_user_system_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    if new.id is distinct from old.id
      or new.email is distinct from old.email
      or new.role is distinct from old.role
      or new.trial_ends_at is distinct from old.trial_ends_at
      or new.created_at is distinct from old.created_at then
      raise exception 'Only Arthur admins can update protected user fields.';
    end if;
  end if;

  return new;
end;
$$;

create trigger protect_user_system_fields
before update on public.users
for each row execute function public.protect_user_system_fields();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.users.full_name);

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'starter', 'trialing')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.enforce_competitor_limit()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)
    from public.competitors
    where business_id = new.business_id
  ) >= 3 then
    raise exception 'Arthur V1 accepts a maximum of 3 competitors per business.';
  end if;

  return new;
end;
$$;

create trigger competitors_limit
before insert on public.competitors
for each row execute function public.enforce_competitor_limit();

create or replace function public.protect_action_content_from_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    if new.weekly_report_id is distinct from old.weekly_report_id
      or new.title is distinct from old.title
      or new.priority is distinct from old.priority
      or new.impact is distinct from old.impact
      or new.reason is distinct from old.reason
      or new.steps is distinct from old.steps
      or new.created_at is distinct from old.created_at then
      raise exception 'Only Arthur admins can update action content.';
    end if;
  end if;

  return new;
end;
$$;

create trigger protect_action_content_from_users
before update on public.actions
for each row execute function public.protect_action_content_from_users();

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

create trigger protect_notification_content_from_users
before update on public.notifications
for each row execute function public.protect_notification_content_from_users();

alter table public.users enable row level security;
alter table public.businesses enable row level security;
alter table public.competitors enable row level security;
alter table public.weekly_reports enable row level security;
alter table public.actions enable row level security;
alter table public.content_pieces enable row level security;
alter table public.score_history enable row level security;
alter table public.notifications enable row level security;
alter table public.subscriptions enable row level security;

create policy "Users can read own profile or admins read all"
on public.users for select
using (id = auth.uid() or public.current_user_is_admin());

create policy "Users can update own profile or admins update all"
on public.users for update
using (id = auth.uid() or public.current_user_is_admin())
with check (id = auth.uid() or public.current_user_is_admin());

create policy "Users can read own business or admins read all"
on public.businesses for select
using (user_id = auth.uid() or public.current_user_is_admin());

create policy "Users can create own business"
on public.businesses for insert
with check (user_id = auth.uid());

create policy "Users can update own business or admins update all"
on public.businesses for update
using (user_id = auth.uid() or public.current_user_is_admin())
with check (user_id = auth.uid() or public.current_user_is_admin());

create policy "Users can manage own competitors"
on public.competitors for all
using (
  exists (
    select 1 from public.businesses
    where businesses.id = competitors.business_id
      and (businesses.user_id = auth.uid() or public.current_user_is_admin())
  )
)
with check (
  exists (
    select 1 from public.businesses
    where businesses.id = competitors.business_id
      and (businesses.user_id = auth.uid() or public.current_user_is_admin())
  )
);

create policy "Users can read own weekly reports"
on public.weekly_reports for select
using (
  exists (
    select 1 from public.businesses
    where businesses.id = weekly_reports.business_id
      and (businesses.user_id = auth.uid() or public.current_user_is_admin())
  )
);

create policy "Admins can manage weekly reports"
on public.weekly_reports for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "Users can read and complete own actions"
on public.actions for select
using (
  exists (
    select 1
    from public.weekly_reports
    join public.businesses on businesses.id = weekly_reports.business_id
    where weekly_reports.id = actions.weekly_report_id
      and (businesses.user_id = auth.uid() or public.current_user_is_admin())
  )
);

create policy "Users can update own action completion"
on public.actions for update
using (
  exists (
    select 1
    from public.weekly_reports
    join public.businesses on businesses.id = weekly_reports.business_id
    where weekly_reports.id = actions.weekly_report_id
      and (businesses.user_id = auth.uid() or public.current_user_is_admin())
  )
)
with check (
  exists (
    select 1
    from public.weekly_reports
    join public.businesses on businesses.id = weekly_reports.business_id
    where weekly_reports.id = actions.weekly_report_id
      and (businesses.user_id = auth.uid() or public.current_user_is_admin())
  )
);

create policy "Admins can create actions"
on public.actions for insert
with check (public.current_user_is_admin());

create policy "Users can manage own content pieces"
on public.content_pieces for all
using (
  exists (
    select 1 from public.businesses
    where businesses.id = content_pieces.business_id
      and (businesses.user_id = auth.uid() or public.current_user_is_admin())
  )
)
with check (
  exists (
    select 1 from public.businesses
    where businesses.id = content_pieces.business_id
      and (businesses.user_id = auth.uid() or public.current_user_is_admin())
  )
);

create policy "Users can read own score history"
on public.score_history for select
using (
  exists (
    select 1 from public.businesses
    where businesses.id = score_history.business_id
      and (businesses.user_id = auth.uid() or public.current_user_is_admin())
  )
);

create policy "Admins can manage score history"
on public.score_history for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "Users can read own notifications"
on public.notifications for select
using (user_id = auth.uid() or public.current_user_is_admin());

create policy "Users can update own notifications"
on public.notifications for update
using (user_id = auth.uid() or public.current_user_is_admin())
with check (user_id = auth.uid() or public.current_user_is_admin());

create policy "Admins can create notifications"
on public.notifications for insert
with check (public.current_user_is_admin());

create policy "Users can read own subscription"
on public.subscriptions for select
using (user_id = auth.uid() or public.current_user_is_admin());

create policy "Admins can manage subscriptions"
on public.subscriptions for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
