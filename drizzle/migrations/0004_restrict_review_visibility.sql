drop policy if exists "Public reads reviews" on public.reviews;

create policy "Public reads published creator reviews" on public.reviews
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.creator_profiles c
      where c.id = reviews.creator_id and c.is_published = true
    )
  );

create policy "Review participants read reviews" on public.reviews
  for select to authenticated
  using (
    business_id = auth.uid()
    or exists (
      select 1 from public.creator_profiles c
      where c.id = reviews.creator_id and c.user_id = auth.uid()
    )
  );

create policy "Admins read reviews" on public.reviews
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));