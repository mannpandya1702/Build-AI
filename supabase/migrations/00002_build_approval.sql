-- Phase 2 spend gate (MASTER_SPEC §2, §8.4): a new lead status where a qualified lead parks until
-- the operator approves paid analysis/build. The gate is a STATUS (not a flag) so it inherits the
-- state machine's crash-tolerance. Approval is recorded as an agent_events row (type
-- 'lead.build_approved'), consistent with the existing outbox-approval pattern.
--
-- NOTE: ALTER TYPE ... ADD VALUE runs inside the migration runner's transaction; this requires
-- PostgreSQL 12+ (Supabase/Neon are 15+). The value is only added here, never used in this same
-- transaction, so it is safe.
alter type lead_status add value if not exists 'awaiting_build_approval' after 'qualified';
