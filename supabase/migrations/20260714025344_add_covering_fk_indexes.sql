create index if not exists lunar_calculator_assumptions_version_id_idx
on public.lunar_calculator_assumptions (version_id);

create index if not exists lunar_calculator_saved_runs_calculator_id_idx
on public.lunar_calculator_saved_runs (calculator_id);

create index if not exists lunar_calculator_validation_rules_version_id_idx
on public.lunar_calculator_validation_rules (version_id);

create index if not exists lunar_company_contracts_award_id_idx
on public.lunar_company_contracts (award_id);

create index if not exists member_chat_read_receipts_user_id_idx
on public.member_chat_read_receipts (user_id);

create index if not exists member_notification_preferences_organization_id_idx
on public.member_notification_preferences (organization_id);

create index if not exists member_role_assignments_role_id_idx
on public.member_role_assignments (role_id);
