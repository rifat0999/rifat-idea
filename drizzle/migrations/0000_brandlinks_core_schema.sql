
-- ============ ENUMS ============
create type public.app_role as enum ('admin','business','creator');
create type public.verification_status as enum ('unverified','pending','verified','rejected');
create type public.social_platform as enum ('facebook','instagram','youtube','tiktok','linkedin','x','other');
create type public.booking_status as enum ('pending','accepted','declined','cancelled','in_progress','delivered','completed','disputed');
create type public.payment_status as enum ('unpaid','submitted','verified','rejected','released','refunded');
create type public.dispute_status as enum ('open','under_review','resolved','rejected');
create type public.campaign_status as enum ('draft','active','completed','cancelled');

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;

-- ============ PROFILES (private) ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  preferred_language text not null default 'en' check (preferred_language in ('en','bn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

-- ============ ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create policy "Users read own profile" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Users insert own profile" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "Users update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ============ PLATFORM SETTINGS ============
create table public.platform_settings (
  id int primary key default 1 check (id = 1),
  commission_rate numeric(5,2) not null default 10 check (commission_rate >= 0 and commission_rate <= 50),
  payment_instructions text not null default 'Send payment to BrandLinks via bKash/Nagad merchant or bank transfer, then submit the transaction ID for admin verification.',
  updated_at timestamptz not null default now(),
  updated_by uuid
);
grant select on public.platform_settings to anon, authenticated;
grant update on public.platform_settings to authenticated;
grant all on public.platform_settings to service_role;
alter table public.platform_settings enable row level security;
create policy "Anyone reads settings" on public.platform_settings for select to anon, authenticated using (true);
create policy "Admins update settings" on public.platform_settings for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.platform_settings (id, commission_rate) values (1, 10);

-- ============ CREATOR PROFILES (public directory data) ============
create table public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  display_name text not null check (char_length(display_name) between 2 and 80),
  headline text check (char_length(headline) <= 140),
  headline_bn text check (char_length(headline_bn) <= 140),
  bio text check (char_length(bio) <= 2000),
  bio_bn text check (char_length(bio_bn) <= 2000),
  avatar_url text,
  cover_url text,
  location text not null default 'Dhaka',
  niches text[] not null default '{}',
  languages text[] not null default '{bn,en}',
  audience jsonb not null default '{}'::jsonb,
  total_followers int not null default 0,
  avg_engagement numeric(5,2) not null default 0,
  starting_price int not null default 0,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  verification_status public.verification_status not null default 'unverified',
  is_published boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index creator_profiles_published_idx on public.creator_profiles (is_published, verification_status);
grant select on public.creator_profiles to anon, authenticated;
grant insert, update on public.creator_profiles to authenticated;
grant all on public.creator_profiles to service_role;
alter table public.creator_profiles enable row level security;
create policy "Public reads published creators" on public.creator_profiles for select to anon, authenticated
  using (is_published = true);
create policy "Owners and admins read creator" on public.creator_profiles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Creators insert own profile" on public.creator_profiles for insert to authenticated
  with check (user_id = auth.uid() and public.has_role(auth.uid(),'creator'));
create policy "Owners and admins update creator" on public.creator_profiles for update to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- ============ CREATOR SOCIALS ============
create table public.creator_socials (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  platform public.social_platform not null,
  handle text not null check (char_length(handle) between 1 and 100),
  url text check (url is null or url ~ '^https?://'),
  followers int not null default 0 check (followers >= 0),
  avg_views int not null default 0 check (avg_views >= 0),
  engagement_rate numeric(5,2) not null default 0 check (engagement_rate >= 0 and engagement_rate <= 100),
  created_at timestamptz not null default now(),
  unique (creator_id, platform)
);
grant select on public.creator_socials to anon, authenticated;
grant insert, update, delete on public.creator_socials to authenticated;
grant all on public.creator_socials to service_role;
alter table public.creator_socials enable row level security;
create policy "Public reads socials" on public.creator_socials for select to anon, authenticated using (true);
create policy "Owners manage socials" on public.creator_socials for all to authenticated
  using (exists (select 1 from public.creator_profiles c where c.id = creator_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.creator_profiles c where c.id = creator_id and c.user_id = auth.uid()));

-- ============ PACKAGES ============
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  title_bn text check (char_length(title_bn) <= 120),
  description text check (char_length(description) <= 1000),
  platform public.social_platform not null,
  deliverables text[] not null default '{}',
  price_bdt int not null check (price_bdt >= 500 and price_bdt <= 10000000),
  delivery_days int not null default 7 check (delivery_days between 1 and 90),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.packages to anon, authenticated;
grant insert, update, delete on public.packages to authenticated;
grant all on public.packages to service_role;
alter table public.packages enable row level security;
create policy "Public reads active packages" on public.packages for select to anon, authenticated using (is_active = true);
create policy "Owners read own packages" on public.packages for select to authenticated
  using (exists (select 1 from public.creator_profiles c where c.id = creator_id and c.user_id = auth.uid()));
create policy "Owners manage packages" on public.packages for all to authenticated
  using (exists (select 1 from public.creator_profiles c where c.id = creator_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.creator_profiles c where c.id = creator_id and c.user_id = auth.uid()));

-- ============ BUSINESS PROFILES (public company info only) ============
create table public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  company_name text not null check (char_length(company_name) between 2 and 120),
  industry text,
  website text check (website is null or website ~ '^https?://'),
  location text default 'Dhaka',
  logo_url text,
  about text check (char_length(about) <= 1000),
  verification_status public.verification_status not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.business_profiles to anon, authenticated;
grant insert, update on public.business_profiles to authenticated;
grant all on public.business_profiles to service_role;
alter table public.business_profiles enable row level security;
create policy "Public reads business info" on public.business_profiles for select to anon, authenticated using (true);
create policy "Businesses insert own" on public.business_profiles for insert to authenticated
  with check (user_id = auth.uid() and public.has_role(auth.uid(),'business'));
create policy "Owners and admins update business" on public.business_profiles for update to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- ============ CAMPAIGNS ============
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  title text not null check (char_length(title) between 3 and 140),
  brief text check (char_length(brief) <= 4000),
  objective text,
  platforms public.social_platform[] not null default '{}',
  niches text[] not null default '{}',
  budget_bdt int not null default 0 check (budget_bdt >= 0),
  start_date date,
  end_date date,
  status public.campaign_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.campaigns to authenticated;
grant all on public.campaigns to service_role;
alter table public.campaigns enable row level security;
create trigger campaigns_updated before update on public.campaigns for each row execute function public.set_updated_at();

-- ============ BOOKINGS ============
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  creator_id uuid not null references public.creator_profiles(id) on delete restrict,
  creator_user_id uuid not null,
  package_id uuid references public.packages(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  title text not null check (char_length(title) between 3 and 140),
  requirements text check (char_length(requirements) <= 4000),
  amount_bdt int not null check (amount_bdt >= 500),
  commission_rate numeric(5,2) not null default 0,
  commission_bdt int not null default 0,
  creator_payout_bdt int not null default 0,
  status public.booking_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  due_date date,
  deliverable_url text check (deliverable_url is null or deliverable_url ~ '^https?://'),
  decline_reason text check (char_length(decline_reason) <= 500),
  accepted_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_business_idx on public.bookings (business_id);
create index bookings_creator_user_idx on public.bookings (creator_user_id);
grant select, insert, update on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "Parties and admins read bookings" on public.bookings for select to authenticated
  using (business_id = auth.uid() or creator_user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Businesses create bookings" on public.bookings for insert to authenticated
  with check (business_id = auth.uid() and public.has_role(auth.uid(),'business'));
create policy "Parties and admins update bookings" on public.bookings for update to authenticated
  using (business_id = auth.uid() or creator_user_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (business_id = auth.uid() or creator_user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- Campaign policies (after bookings exists)
create policy "Owners manage campaigns" on public.campaigns for all to authenticated
  using (business_id = auth.uid()) with check (business_id = auth.uid() and public.has_role(auth.uid(),'business'));
create policy "Admins and booked creators read campaigns" on public.campaigns for select to authenticated
  using (public.has_role(auth.uid(),'admin') or exists (
    select 1 from public.bookings b where b.campaign_id = campaigns.id and b.creator_user_id = auth.uid()));

-- ============ PAYMENTS (manual, admin-verified) ============
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  business_id uuid not null,
  amount_bdt int not null,
  method text not null check (method in ('bkash','nagad','rocket','bank_transfer')),
  transaction_ref text not null check (char_length(transaction_ref) between 4 and 64),
  sender_account text check (char_length(sender_account) <= 40),
  status text not null default 'submitted' check (status in ('submitted','verified','rejected')),
  admin_note text check (char_length(admin_note) <= 500),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "Payers and admins read payments" on public.payments for select to authenticated
  using (business_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Businesses submit payments" on public.payments for insert to authenticated
  with check (business_id = auth.uid());
create policy "Admins review payments" on public.payments for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ REVIEWS ============
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique references public.bookings(id) on delete set null,
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  business_id uuid not null,
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);
grant select on public.reviews to anon, authenticated;
grant insert on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "Public reads reviews" on public.reviews for select to anon, authenticated using (true);
create policy "Businesses review completed bookings" on public.reviews for insert to authenticated
  with check (business_id = auth.uid() and booking_id is not null and exists (
    select 1 from public.bookings b where b.id = booking_id and b.business_id = auth.uid() and b.status = 'completed'));

-- ============ DISPUTES ============
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  raised_by uuid not null,
  reason text not null check (char_length(reason) between 3 and 140),
  details text check (char_length(details) <= 2000),
  status public.dispute_status not null default 'open',
  resolution text check (char_length(resolution) <= 2000),
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.disputes to authenticated;
grant all on public.disputes to service_role;
alter table public.disputes enable row level security;
create policy "Parties and admins read disputes" on public.disputes for select to authenticated
  using (public.has_role(auth.uid(),'admin') or exists (
    select 1 from public.bookings b where b.id = booking_id and (b.business_id = auth.uid() or b.creator_user_id = auth.uid())));
create policy "Parties raise disputes" on public.disputes for insert to authenticated
  with check (raised_by = auth.uid() and exists (
    select 1 from public.bookings b where b.id = booking_id and (b.business_id = auth.uid() or b.creator_user_id = auth.uid())));
create policy "Admins resolve disputes" on public.disputes for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ VERIFICATION REQUESTS (private) ============
create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null check (kind in ('creator','business')),
  message text check (char_length(message) <= 1000),
  proof_url text check (proof_url is null or proof_url ~ '^https?://'),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text check (char_length(admin_note) <= 500),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.verification_requests to authenticated;
grant all on public.verification_requests to service_role;
alter table public.verification_requests enable row level security;
create policy "Owners and admins read requests" on public.verification_requests for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Users submit own request" on public.verification_requests for insert to authenticated
  with check (user_id = auth.uid());
create policy "Admins review requests" on public.verification_requests for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ MESSAGING ============
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  creator_user_id uuid not null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (business_id, creator_id)
);
grant select, insert on public.conversations to authenticated;
grant all on public.conversations to service_role;
alter table public.conversations enable row level security;
create policy "Participants read conversations" on public.conversations for select to authenticated
  using (business_id = auth.uid() or creator_user_id = auth.uid());
create policy "Participants start conversations" on public.conversations for insert to authenticated
  with check (business_id = auth.uid() or creator_user_id = auth.uid());

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index messages_conv_idx on public.messages (conversation_id, created_at);
grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "Participants read messages" on public.messages for select to authenticated
  using (exists (select 1 from public.conversations c where c.id = conversation_id
    and (c.business_id = auth.uid() or c.creator_user_id = auth.uid())));
create policy "Participants send messages" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id
    and (c.business_id = auth.uid() or c.creator_user_id = auth.uid())));

alter publication supabase_realtime add table public.messages;

-- ============ TRIGGER LOGIC ============

-- Creator profile: protect admin-only fields, recompute aggregates
create or replace function public.creator_profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is not null and not public.has_role(uid,'admin') then
    if tg_op = 'INSERT' then
      new.verification_status := 'unverified';
      new.is_featured := false;
    else
      new.user_id := old.user_id;
      new.is_featured := old.is_featured;
      if coalesce(current_setting('app.internal', true),'') <> 'on' then
        new.verification_status := old.verification_status;
      end if;
    end if;
  end if;
  if tg_op = 'UPDATE' then
    new.updated_at := now();
    new.total_followers := coalesce((select sum(followers) from public.creator_socials where creator_id = new.id),0);
    new.avg_engagement := coalesce((select round(avg(engagement_rate),2) from public.creator_socials where creator_id = new.id),0);
    new.starting_price := coalesce((select min(price_bdt) from public.packages where creator_id = new.id and is_active),0);
    new.rating_avg := coalesce((select round(avg(rating)::numeric,2) from public.reviews where creator_id = new.id),0);
    new.rating_count := (select count(*) from public.reviews where creator_id = new.id);
  end if;
  return new;
end $$;
create trigger creator_profiles_guard before insert or update on public.creator_profiles
  for each row execute function public.creator_profiles_guard();

create or replace function public.touch_creator_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.creator_profiles set updated_at = now()
   where id = coalesce(case when tg_op = 'DELETE' then old.creator_id else new.creator_id end, old.creator_id);
  return null;
end $$;
create trigger socials_touch after insert or update or delete on public.creator_socials
  for each row execute function public.touch_creator_profile();
create trigger packages_touch after insert or update or delete on public.packages
  for each row execute function public.touch_creator_profile();
create trigger reviews_touch after insert or update or delete on public.reviews
  for each row execute function public.touch_creator_profile();

-- Business profile guard
create or replace function public.business_profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is not null and not public.has_role(uid,'admin') then
    if tg_op = 'INSERT' then new.verification_status := 'unverified';
    else
      new.user_id := old.user_id;
      if coalesce(current_setting('app.internal', true),'') <> 'on' then
        new.verification_status := old.verification_status;
      end if;
    end if;
  end if;
  if tg_op = 'UPDATE' then new.updated_at := now(); end if;
  return new;
end $$;
create trigger business_profiles_guard before insert or update on public.business_profiles
  for each row execute function public.business_profiles_guard();

-- Bookings: set server-side financials on insert
create or replace function public.bookings_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_rate numeric; v_creator public.creator_profiles%rowtype; v_pkg public.packages%rowtype;
begin
  select * into v_creator from public.creator_profiles where id = new.creator_id;
  if not found or not v_creator.is_published then raise exception 'Creator not available'; end if;
  if v_creator.user_id = new.business_id then raise exception 'You cannot book yourself'; end if;
  new.creator_user_id := v_creator.user_id;
  if new.package_id is not null then
    select * into v_pkg from public.packages where id = new.package_id and creator_id = new.creator_id and is_active;
    if not found then raise exception 'Package not available'; end if;
    new.amount_bdt := v_pkg.price_bdt;
  end if;
  if new.campaign_id is not null and not exists (
    select 1 from public.campaigns where id = new.campaign_id and business_id = new.business_id) then
    raise exception 'Invalid campaign';
  end if;
  select commission_rate into v_rate from public.platform_settings where id = 1;
  new.commission_rate := coalesce(v_rate, 10);
  new.commission_bdt := round(new.amount_bdt * new.commission_rate / 100.0);
  new.creator_payout_bdt := new.amount_bdt - new.commission_bdt;
  new.status := 'pending';
  new.payment_status := 'unpaid';
  new.deliverable_url := null;
  new.accepted_at := null; new.delivered_at := null; new.completed_at := null;
  return new;
end $$;
create trigger bookings_before_insert before insert on public.bookings
  for each row execute function public.bookings_before_insert();

-- Bookings: enforce status workflow
create or replace function public.bookings_before_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); internal boolean := coalesce(current_setting('app.internal', true),'') = 'on';
begin
  new.updated_at := now();
  if new.status = 'accepted' and old.status <> 'accepted' then new.accepted_at := now(); end if;
  if new.status = 'delivered' and old.status <> 'delivered' then new.delivered_at := now(); end if;
  if new.status = 'completed' and old.status <> 'completed' then new.completed_at := now(); end if;

  if uid is null or public.has_role(uid,'admin') then return new; end if;

  -- immutable for parties
  new.business_id := old.business_id; new.creator_id := old.creator_id; new.creator_user_id := old.creator_user_id;
  new.package_id := old.package_id; new.campaign_id := old.campaign_id; new.amount_bdt := old.amount_bdt;
  new.commission_rate := old.commission_rate; new.commission_bdt := old.commission_bdt;
  new.creator_payout_bdt := old.creator_payout_bdt; new.created_at := old.created_at;

  if new.payment_status is distinct from old.payment_status and not internal then
    raise exception 'Payment status is managed by BrandLinks admins';
  end if;

  if new.status is distinct from old.status then
    if uid = old.creator_user_id then
      if not ((old.status = 'pending' and new.status in ('accepted','declined'))
           or (old.status = 'accepted' and new.status = 'in_progress' and old.payment_status = 'verified')
           or (old.status in ('accepted','in_progress') and new.status = 'delivered' and old.payment_status = 'verified')
           or (old.status in ('accepted','in_progress','delivered') and new.status = 'disputed' and internal)) then
        raise exception 'This status change is not allowed';
      end if;
    elsif uid = old.business_id then
      if not ((old.status = 'pending' and new.status = 'cancelled')
           or (old.status = 'accepted' and new.status = 'cancelled' and old.payment_status in ('unpaid','rejected'))
           or (old.status = 'delivered' and new.status in ('completed','in_progress'))
           or (old.status in ('accepted','in_progress','delivered') and new.status = 'disputed' and internal)) then
        raise exception 'This status change is not allowed';
      end if;
    else
      raise exception 'Not allowed';
    end if;
  end if;

  if uid = old.creator_user_id then
    new.title := old.title; new.requirements := old.requirements; new.due_date := old.due_date;
  else
    new.deliverable_url := old.deliverable_url; new.decline_reason := old.decline_reason;
    if old.status <> 'pending' then
      new.title := old.title; new.requirements := old.requirements; new.due_date := old.due_date;
    end if;
  end if;
  return new;
end $$;
create trigger bookings_before_update before update on public.bookings
  for each row execute function public.bookings_before_update();

-- Payments
create or replace function public.payments_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare b public.bookings%rowtype;
begin
  select * into b from public.bookings where id = new.booking_id;
  if not found or b.business_id <> auth.uid() then raise exception 'Booking not found'; end if;
  if b.status not in ('accepted','in_progress') or b.payment_status not in ('unpaid','rejected') then
    raise exception 'Payment cannot be submitted for this booking right now';
  end if;
  new.business_id := b.business_id;
  new.amount_bdt := b.amount_bdt;
  new.status := 'submitted';
  new.admin_note := null; new.reviewed_by := null; new.reviewed_at := null;
  return new;
end $$;
create trigger payments_before_insert before insert on public.payments
  for each row execute function public.payments_before_insert();

create or replace function public.payments_after_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.internal','on',true);
  if tg_op = 'INSERT' then
    update public.bookings set payment_status = 'submitted' where id = new.booking_id;
  elsif new.status is distinct from old.status then
    update public.bookings set payment_status =
      case new.status when 'verified' then 'verified'::public.payment_status
                      when 'rejected' then 'rejected'::public.payment_status
                      else 'submitted'::public.payment_status end
     where id = new.booking_id;
  end if;
  perform set_config('app.internal','off',true);
  return null;
end $$;
create trigger payments_after_change after insert or update on public.payments
  for each row execute function public.payments_after_change();

create or replace function public.payments_before_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.booking_id := old.booking_id; new.business_id := old.business_id; new.amount_bdt := old.amount_bdt;
  new.transaction_ref := old.transaction_ref; new.method := old.method;
  if new.status is distinct from old.status then
    new.reviewed_by := auth.uid(); new.reviewed_at := now();
  end if;
  return new;
end $$;
create trigger payments_before_update before update on public.payments
  for each row execute function public.payments_before_update();

-- Reviews
create or replace function public.reviews_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare b public.bookings%rowtype;
begin
  if auth.uid() is null then return new; end if;
  select * into b from public.bookings where id = new.booking_id;
  if not found or b.business_id <> auth.uid() or b.status <> 'completed' then
    raise exception 'You can only review completed bookings';
  end if;
  new.creator_id := b.creator_id;
  new.business_id := b.business_id;
  return new;
end $$;
create trigger reviews_before_insert before insert on public.reviews
  for each row execute function public.reviews_before_insert();

-- Disputes
create or replace function public.disputes_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare b public.bookings%rowtype;
begin
  select * into b from public.bookings where id = new.booking_id;
  if not found or (b.business_id <> auth.uid() and b.creator_user_id <> auth.uid()) then
    raise exception 'Booking not found';
  end if;
  if b.status not in ('accepted','in_progress','delivered') then
    raise exception 'A dispute cannot be opened for this booking';
  end if;
  new.raised_by := auth.uid();
  new.status := 'open';
  new.resolution := null; new.resolved_by := null; new.resolved_at := null;
  return new;
end $$;
create trigger disputes_before_insert before insert on public.disputes
  for each row execute function public.disputes_before_insert();

create or replace function public.disputes_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.internal','on',true);
  update public.bookings set status = 'disputed' where id = new.booking_id;
  perform set_config('app.internal','off',true);
  return null;
end $$;
create trigger disputes_after_insert after insert on public.disputes
  for each row execute function public.disputes_after_insert();

create or replace function public.disputes_before_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.booking_id := old.booking_id; new.raised_by := old.raised_by;
  if new.status in ('resolved','rejected') and old.status not in ('resolved','rejected') then
    new.resolved_by := auth.uid(); new.resolved_at := now();
  end if;
  return new;
end $$;
create trigger disputes_before_update before update on public.disputes
  for each row execute function public.disputes_before_update();

-- Verification requests
create or replace function public.verification_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.verification_requests where user_id = new.user_id and status = 'pending') then
    raise exception 'You already have a pending verification request';
  end if;
  if new.kind = 'creator' and not exists (select 1 from public.creator_profiles where user_id = new.user_id) then
    raise exception 'Create your creator profile first';
  end if;
  if new.kind = 'business' and not exists (select 1 from public.business_profiles where user_id = new.user_id) then
    raise exception 'Create your business profile first';
  end if;
  new.status := 'pending'; new.admin_note := null; new.reviewed_by := null; new.reviewed_at := null;
  return new;
end $$;
create trigger verification_before_insert before insert on public.verification_requests
  for each row execute function public.verification_before_insert();

create or replace function public.verification_after_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare v public.verification_status;
begin
  v := case new.status when 'approved' then 'verified'::public.verification_status
                       when 'rejected' then 'rejected'::public.verification_status
                       else 'pending'::public.verification_status end;
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then return null; end if;
  perform set_config('app.internal','on',true);
  if new.kind = 'creator' then
    update public.creator_profiles set verification_status = v where user_id = new.user_id;
  else
    update public.business_profiles set verification_status = v where user_id = new.user_id;
  end if;
  perform set_config('app.internal','off',true);
  return null;
end $$;
create trigger verification_after_change after insert or update on public.verification_requests
  for each row execute function public.verification_after_change();

create or replace function public.verification_before_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := old.user_id; new.kind := old.kind;
  if new.status is distinct from old.status then new.reviewed_by := auth.uid(); new.reviewed_at := now(); end if;
  return new;
end $$;
create trigger verification_before_update before update on public.verification_requests
  for each row execute function public.verification_before_update();

-- Conversations / messages
create or replace function public.conversations_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  select user_id into v_user from public.creator_profiles where id = new.creator_id;
  if v_user is null then raise exception 'Creator not found'; end if;
  new.creator_user_id := v_user;
  if v_user = new.business_id then raise exception 'Invalid conversation'; end if;
  return new;
end $$;
create trigger conversations_before_insert before insert on public.conversations
  for each row execute function public.conversations_before_insert();

create or replace function public.messages_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return null;
end $$;
create trigger messages_after_insert after insert on public.messages
  for each row execute function public.messages_after_insert();

-- ============ ACCOUNT SETUP ============
create or replace function public.setup_account(_uid uuid, _role public.app_role, _name text)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text := coalesce(nullif(trim(_name),''), 'New member'); v_slug text;
begin
  if _role not in ('business','creator') then raise exception 'Invalid role'; end if;
  insert into public.user_roles (user_id, role) values (_uid, _role) on conflict do nothing;
  if _role = 'business' then
    insert into public.business_profiles (user_id, company_name) values (_uid, left(v_name,120))
      on conflict (user_id) do nothing;
  else
    v_slug := trim(both '-' from lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g')));
    if char_length(v_slug) < 3 then v_slug := 'creator'; end if;
    v_slug := left(v_slug, 60) || '-' || substr(replace(_uid::text,'-',''), 1, 6);
    insert into public.creator_profiles (user_id, slug, display_name)
      values (_uid, v_slug, left(case when char_length(v_name) < 2 then 'Creator' else v_name end, 80))
      on conflict (user_id) do nothing;
  end if;
end $$;
revoke execute on function public.setup_account(uuid, public.app_role, text) from public, anon, authenticated;

create or replace function public.choose_role(_role public.app_role, _name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if _role not in ('business','creator') then raise exception 'Invalid role'; end if;
  if exists (select 1 from public.user_roles where user_id = auth.uid()) then
    raise exception 'Your account type is already set';
  end if;
  perform public.setup_account(auth.uid(), _role, _name);
end $$;
revoke execute on function public.choose_role(public.app_role, text) from public, anon;
grant execute on function public.choose_role(public.app_role, text) to authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_role text := new.raw_user_meta_data->>'role';
        v_name text := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1));
begin
  insert into public.profiles (id, full_name, avatar_url)
    values (new.id, v_name, new.raw_user_meta_data->>'avatar_url')
    on conflict (id) do nothing;
  if v_role in ('business','creator') then
    perform public.setup_account(new.id, v_role::public.app_role, v_name);
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
