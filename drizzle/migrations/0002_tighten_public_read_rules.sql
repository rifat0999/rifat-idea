-- Social channels: only visible for published creators (plus owner via existing policy, and admins)
drop policy if exists "Public reads socials" on public.creator_socials;
create policy "Public reads socials of published creators" on public.creator_socials
  for select to anon, authenticated
  using (exists (select 1 from public.creator_profiles c where c.id = creator_socials.creator_id and c.is_published = true));
create policy "Admins read socials" on public.creator_socials
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Platform settings: only signed-in members with a role (business, creator or admin)
drop policy if exists "Anyone reads settings" on public.platform_settings;
revoke select on public.platform_settings from anon;
create policy "Members read settings" on public.platform_settings
  for select to authenticated
  using (
    public.has_role(auth.uid(), 'business'::public.app_role)
    or public.has_role(auth.uid(), 'creator'::public.app_role)
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Business profiles: owner, admins, creators they work with, and public only for brands that left a review
drop policy if exists "Public reads business info" on public.business_profiles;
create policy "Owners and admins read business" on public.business_profiles
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Creators read businesses they work with" on public.business_profiles
  for select to authenticated
  using (
    exists (select 1 from public.bookings b where b.business_id = business_profiles.user_id and b.creator_user_id = auth.uid())
    or exists (select 1 from public.conversations cv where cv.business_id = business_profiles.user_id and cv.creator_user_id = auth.uid())
  );
create policy "Public reads reviewing businesses" on public.business_profiles
  for select to anon, authenticated
  using (exists (select 1 from public.reviews r where r.business_id = business_profiles.user_id));