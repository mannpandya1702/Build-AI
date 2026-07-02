-- Agency Autopilot: full Section 5 schema (AGENCY_AUTOPILOT_SPEC.md).
-- Applied by the file-based migration runner (packages/core). Never mutate schema by hand.

create extension if not exists pgcrypto;

-- ---------- enums ----------
do $$ begin
  create type lead_status as enum (
    'discovered','enriched','qualified','disqualified',
    'analyzed','solution_ready','design_ready',
    'demo_building','demo_qa','outreach_ready','awaiting_approval','contacted',
    'replied','meeting_booked','nurture','negotiating',
    'closed_won','closed_lost',
    'final_building','final_qa','delivery_approval','delivered',
    'suppressed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type build_kind as enum ('demo','final');
exception when duplicate_object then null; end $$;

do $$ begin
  create type build_status as enum ('queued','building','deployed','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sequence_state as enum ('active','paused','replied','completed','suppressed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type email_direction as enum ('outbound','inbound');
exception when duplicate_object then null; end $$;

do $$ begin
  create type email_kind as enum ('outreach','followup_1','followup_2','booking_confirm','delivery','operator_notice');
exception when duplicate_object then null; end $$;

do $$ begin
  create type email_status as enum ('draft','awaiting_approval','approved','sent','bounced','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reply_classification as enum ('interested','question','not_interested','unsubscribe','auto_reply','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type meeting_status as enum ('scheduled','cancelled','completed','no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_level as enum ('debug','info','warn','error');
exception when duplicate_object then null; end $$;

-- ---------- updated_at trigger ----------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

-- ---------- tables ----------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  slug text unique,
  industry text,
  city text,
  region text,
  country text default 'US',
  website_url text,
  google_place_id text unique,
  gbp_url text,
  review_count int,
  rating numeric,
  photos jsonb default '[]',
  reviews jsonb default '[]',
  contact_name text,
  contact_email text,
  contact_phone text,
  source text default 'places',
  status lead_status not null default 'discovered',
  score int,
  score_breakdown jsonb,
  disqualify_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_status_idx on leads(status);
create index if not exists leads_score_idx on leads(score desc nulls last);

create table if not exists audits (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  lighthouse jsonb,
  screenshots jsonb default '[]',
  pages_crawled jsonb default '[]',
  findings jsonb default '[]',
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists audits_lead_idx on audits(lead_id);

create table if not exists solutions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  pitch_angle text,
  proposed_pages jsonb default '[]',
  features jsonb default '[]',
  differentiators jsonb default '[]',
  estimated_impact text,
  call_sheet_md text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists solutions_lead_idx on solutions(lead_id);

create table if not exists looks (
  id uuid primary key default gen_random_uuid(),
  preset text not null,
  name text not null,
  palette jsonb not null,
  type_pairing jsonb not null,
  hero_variant text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (preset, name)
);

create table if not exists designs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  brand jsonb,
  sitemap jsonb default '[]',
  page_specs jsonb default '[]',
  assets jsonb default '[]',
  look_id uuid references looks(id),
  look_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists designs_lead_idx on designs(lead_id);

create table if not exists builds (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  kind build_kind not null,
  status build_status not null default 'queued',
  repo_path text,
  vercel_deployment_id text,
  deploy_url text,
  iteration int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists builds_lead_idx on builds(lead_id);

create table if not exists qa_reports (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references builds(id) on delete cascade,
  passed boolean not null default false,
  checks jsonb default '{}',
  issues jsonb default '[]',
  iteration int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_sequences (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  current_step int not null default 0,
  next_send_at timestamptz,
  state sequence_state not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sequences_lead_idx on email_sequences(lead_id);
create index if not exists sequences_due_idx on email_sequences(state, next_send_at);

create table if not exists emails (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  sequence_id uuid references email_sequences(id) on delete set null,
  direction email_direction not null,
  kind email_kind not null,
  subject text,
  body_html text,
  body_text text,
  status email_status not null default 'draft',
  provider_message_id text,
  idempotency_key text unique,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists emails_lead_idx on emails(lead_id);
create index if not exists emails_status_idx on emails(status);

create table if not exists replies (
  id uuid primary key default gen_random_uuid(),
  email_id uuid not null references emails(id) on delete cascade,
  classification reply_classification not null,
  classified_by text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  cal_booking_uid text unique,
  title text,
  start_time timestamptz,
  end_time timestamptz,
  timezone text,
  status meeting_status not null default 'scheduled',
  attendee jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_events (
  id uuid primary key default gen_random_uuid(),
  agent text not null,
  lead_id uuid references leads(id) on delete set null,
  level event_level not null default 'info',
  type text not null,
  message text,
  payload jsonb default '{}',
  cost_usd numeric,
  created_at timestamptz not null default now()
);
create index if not exists events_created_idx on agent_events(created_at desc);
create index if not exists events_lead_idx on agent_events(lead_id);
create index if not exists events_type_idx on agent_events(type);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  body text,
  lead_id uuid references leads(id) on delete set null,
  read boolean not null default false,
  channel_sent jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppression_list (
  id uuid primary key default gen_random_uuid(),
  email text,
  domain text,
  reason text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_or_domain check (email is not null or domain is not null)
);
create unique index if not exists suppression_email_uq on suppression_list(email) where email is not null;
create unique index if not exists suppression_domain_uq on suppression_list(domain) where domain is not null;

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists daily_reports (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  funnel jsonb default '{}',
  costs jsonb default '{}',
  anomalies jsonb default '[]',
  summary_md text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at triggers for every table that has the column
do $$
declare t text;
begin
  for t in
    select table_name from information_schema.columns
    where column_name = 'updated_at' and table_schema = 'public'
  loop
    execute format('drop trigger if exists %I on %I', t || '_updated_at', t);
    execute format('create trigger %I before update on %I for each row execute function set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;
