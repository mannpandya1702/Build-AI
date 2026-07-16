-- Phase 4 (MASTER_SPEC §8.3): the multi-service spine. A lead can carry several opportunities, one
-- per service_type, each with its own lifecycle. This migration is ADDITIVE — the existing lead
-- pipeline keeps running on lead_status; the scheduler is routed onto opportunities in a later slice.

do $$ begin
  create type service_type as enum ('website','chatbot','voice_agent','ai_automation');
exception when duplicate_object then null; end $$;

do $$ begin
  create type opportunity_status as enum (
    'identified','proposed','awaiting_build_approval','building','demo_ready',
    'in_outreach','negotiating','closed_won','onboarding','live','paused','churned','closed_lost'
  );
exception when duplicate_object then null; end $$;

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  service_type service_type not null,
  status opportunity_status not null default 'identified',
  score int,
  score_breakdown jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, service_type)
);
create index if not exists opportunities_lead_idx on opportunities(lead_id);
create index if not exists opportunities_status_type_idx on opportunities(status, service_type);
create index if not exists opportunities_score_idx on opportunities(score desc nulls last);

-- updated_at trigger (same helper installed in 00001)
do $$ begin
  create trigger opportunities_set_updated_at before update on opportunities
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- Backfill: one `website` opportunity per existing lead, status mapped from the lead's current stage.
insert into opportunities (lead_id, service_type, status, score, score_breakdown)
select l.id, 'website'::service_type,
  (case l.status
     when 'discovered' then 'identified'
     when 'enriched' then 'identified'
     when 'qualified' then 'proposed'
     when 'awaiting_build_approval' then 'awaiting_build_approval'
     when 'analyzed' then 'building'
     when 'solution_ready' then 'building'
     when 'design_ready' then 'building'
     when 'demo_building' then 'building'
     when 'demo_qa' then 'building'
     when 'outreach_ready' then 'demo_ready'
     when 'awaiting_approval' then 'demo_ready'
     when 'contacted' then 'in_outreach'
     when 'replied' then 'negotiating'
     when 'nurture' then 'in_outreach'
     when 'negotiating' then 'negotiating'
     when 'meeting_booked' then 'negotiating'
     when 'closed_won' then 'closed_won'
     when 'final_building' then 'onboarding'
     when 'final_qa' then 'onboarding'
     when 'delivery_approval' then 'onboarding'
     when 'delivered' then 'live'
     else 'closed_lost'
   end)::opportunity_status,
  l.score, l.score_breakdown
from leads l
on conflict (lead_id, service_type) do nothing;
