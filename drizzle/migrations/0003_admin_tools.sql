create policy "Admins update campaigns" on public.campaigns for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  roles public.app_role[],
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not public.has_role(auth.uid(),'admin') then
    raise exception 'Admins only';
  end if;
  return query
    select u.id, u.email::text, p.full_name, p.phone,
           coalesce(array_agg(r.role order by r.role) filter (where r.role is not null), '{}')::public.app_role[],
           u.created_at, u.last_sign_in_at
      from auth.users u
      left join public.profiles p on p.id = u.id
      left join public.user_roles r on r.user_id = u.id
     group by u.id, u.email, p.full_name, p.phone, u.created_at, u.last_sign_in_at
     order by u.created_at desc;
end $$;
revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.admin_set_admin(_user_id uuid, _enabled boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then
    raise exception 'Admins only';
  end if;
  if not exists (select 1 from auth.users u where u.id = _user_id) then
    raise exception 'User not found';
  end if;
  if _enabled then
    insert into public.user_roles (user_id, role) values (_user_id, 'admin') on conflict do nothing;
  else
    if _user_id = auth.uid() then
      raise exception 'You cannot remove your own admin access';
    end if;
    delete from public.user_roles where user_id = _user_id and role = 'admin';
  end if;
end $$;
revoke execute on function public.admin_set_admin(uuid, boolean) from public, anon;
grant execute on function public.admin_set_admin(uuid, boolean) to authenticated;