create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  category text not null check (category in ('verification', 'booking', 'payment')),
  entity_type text not null check (entity_type in ('verification_request', 'creator_profile', 'business_profile', 'booking', 'payment')),
  entity_id uuid not null,
  entity_label text not null,
  status_field text not null check (status_field in ('status', 'verification_status', 'payment_status')),
  old_status text,
  new_status text not null,
  created_at timestamptz not null default now()
);

grant select on public.admin_audit_logs to authenticated;
grant all on public.admin_audit_logs to service_role;

alter table public.admin_audit_logs enable row level security;

create policy "Admins read audit logs" on public.admin_audit_logs
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

create index admin_audit_logs_created_at_idx on public.admin_audit_logs (created_at desc);
create index admin_audit_logs_actor_id_idx on public.admin_audit_logs (actor_id);

create or replace function public.record_status_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  field_name text := tg_argv[0];
  audit_category text := tg_argv[1];
  audit_entity_type text := tg_argv[2];
  old_json jsonb := to_jsonb(old);
  new_json jsonb := to_jsonb(new);
  previous_status text := old_json ->> field_name;
  next_status text := new_json ->> field_name;
  label text;
begin
  if previous_status is not distinct from next_status then
    return null;
  end if;

  label := coalesce(
    new_json ->> 'title',
    new_json ->> 'display_name',
    new_json ->> 'company_name',
    case when tg_table_name = 'verification_requests'
      then (new_json ->> 'kind') || ' verification request' end,
    case when tg_table_name = 'payments'
      then (new_json ->> 'method') || ' payment · ' || (new_json ->> 'transaction_ref') end,
    new_json ->> 'id'
  );

  insert into public.admin_audit_logs (
    actor_id, category, entity_type, entity_id, entity_label,
    status_field, old_status, new_status
  ) values (
    auth.uid(), audit_category, audit_entity_type, (new_json ->> 'id')::uuid, label,
    field_name, previous_status, next_status
  );
  return null;
end $$;

create trigger verification_status_audit
  after update on public.verification_requests
  for each row execute function public.record_status_audit('status', 'verification', 'verification_request');

create trigger creator_verification_status_audit
  after update on public.creator_profiles
  for each row execute function public.record_status_audit('verification_status', 'verification', 'creator_profile');

create trigger business_verification_status_audit
  after update on public.business_profiles
  for each row execute function public.record_status_audit('verification_status', 'verification', 'business_profile');

create trigger booking_status_audit
  after update on public.bookings
  for each row execute function public.record_status_audit('status', 'booking', 'booking');

create trigger booking_payment_status_audit
  after update on public.bookings
  for each row execute function public.record_status_audit('payment_status', 'payment', 'booking');

create trigger payment_status_audit
  after update on public.payments
  for each row execute function public.record_status_audit('status', 'payment', 'payment');