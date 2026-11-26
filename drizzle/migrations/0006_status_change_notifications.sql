create table public.notifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 category text not null check (category in ('verification','booking','payment')),
 entity_id uuid not null,
 entity_label text not null,
 old_status text not null,
 new_status text not null,
 created_at timestamptz not null default now(),
 read_at timestamptz
);
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "Recipients read own notifications" on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy "Recipients mark own notifications read" on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index notifications_unread_idx on public.notifications(user_id) where read_at is null;
create function public.notify_status_change() returns trigger language plpgsql security definer set search_path = '' as $$
declare
 field_name text := tg_argv[0];
 kind text := tg_argv[1];
 before_row jsonb := to_jsonb(old);
 after_row jsonb := to_jsonb(new);
 recipients uuid[];
 label text;
begin
 if before_row ->> field_name is not distinct from after_row ->> field_name then return null; end if;
 if tg_table_name = 'bookings' then
   recipients := array[new.business_id, new.creator_user_id];
   label := new.title;
 else
   recipients := array[(after_row ->> 'user_id')::uuid];
   label := coalesce(after_row ->> 'display_name', after_row ->> 'company_name');
 end if;
 insert into public.notifications(user_id, category, entity_id, entity_label, old_status, new_status)
 select distinct p.id, kind, new.id, label, before_row ->> field_name, after_row ->> field_name
 from public.profiles p where p.id = any(recipients);
 return null;
end $$;
revoke all on function public.notify_status_change() from public, anon, authenticated;
create trigger creator_status_notification after update of verification_status on public.creator_profiles for each row execute function public.notify_status_change('verification_status','verification');
create trigger business_status_notification after update of verification_status on public.business_profiles for each row execute function public.notify_status_change('verification_status','verification');
create trigger booking_status_notification after update of status on public.bookings for each row execute function public.notify_status_change('status','booking');
create trigger payment_status_notification after update of payment_status on public.bookings for each row execute function public.notify_status_change('payment_status','payment');