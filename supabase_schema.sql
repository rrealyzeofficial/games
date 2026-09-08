-- REALYZE!! online account + friends + chat schema for Supabase
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  game_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status = 'pending'),
  created_at timestamptz not null default now(),
  unique(sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

create table if not exists public.friendships (
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create index if not exists friend_requests_receiver_idx on public.friend_requests(receiver_id, created_at desc);
create index if not exists friend_requests_sender_idx on public.friend_requests(sender_id, created_at desc);
create index if not exists messages_pair_idx on public.messages(sender_id, receiver_id, created_at);
create index if not exists profiles_username_lower_idx on public.profiles(lower(username));

-- Create profile automatically after Supabase Auth signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  uname text := new.raw_user_meta_data ->> 'username';
begin
  if uname is null or uname !~ '^[A-Za-z0-9_]{3,20}$' then
    raise exception 'Invalid REALYZE ID Name';
  end if;
  insert into public.profiles (id, username, game_data)
  values (
    new.id,
    uname,
    jsonb_build_object(
      'username', uname,
      'createdAt', floor(extract(epoch from now()) * 1000)::bigint,
      'gems', 5000,
      'coins', 10000,
      'tickets', 10,
      'rank', 1,
      'gachaPity', 0,
      'characterPity', 0,
      'gachaHistory', '[]'::jsonb,
      'myCards', '[]'::jsonb,
      'myCharacters', '[]'::jsonb,
      'characterProgress', '{}'::jsonb,
      'selectedCharacterId', 'mystery'
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Public username search. It exposes username + id only, never game_data.
create or replace function public.search_profile(search_username text)
returns table (id uuid, username text)
language sql
security definer set search_path = public
as $$
  select p.id, p.username
  from public.profiles p
  where lower(p.username) = lower(trim(search_username))
  limit 1;
$$;

-- Send request safely on the server.
create or replace function public.send_friend_request(target_username text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  target uuid;
  existing_friend boolean;
  existing_out boolean;
  existing_in boolean;
begin
  if me is null then raise exception 'Unauthorized'; end if;
  select id into target from public.profiles where lower(username) = lower(trim(target_username)) limit 1;
  if target is null then raise exception 'Không tìm thấy ID Name này.'; end if;
  if target = me then raise exception 'Không thể kết bạn với chính mình.'; end if;
  select exists(select 1 from public.friendships f where f.user_a = least(me,target) and f.user_b = greatest(me,target)) into existing_friend;
  if existing_friend then raise exception 'Hai người đã là bạn.'; end if;
  select exists(select 1 from public.friend_requests r where r.sender_id=me and r.receiver_id=target) into existing_out;
  if existing_out then raise exception 'Lời mời đã được gửi.'; end if;
  select exists(select 1 from public.friend_requests r where r.sender_id=target and r.receiver_id=me) into existing_in;
  if existing_in then raise exception 'Người này đã gửi lời mời cho bạn.'; end if;
  insert into public.friend_requests(sender_id, receiver_id) values(me,target);
end;
$$;

create or replace function public.accept_friend_request(requester_username text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  other uuid;
begin
  if me is null then raise exception 'Unauthorized'; end if;
  select p.id into other from public.profiles p where lower(p.username)=lower(trim(requester_username)) limit 1;
  if other is null then raise exception 'User not found.'; end if;
  if not exists(select 1 from public.friend_requests r where r.sender_id=other and r.receiver_id=me) then raise exception 'Friend request not found.'; end if;
  delete from public.friend_requests where sender_id=other and receiver_id=me;
  insert into public.friendships(user_a,user_b) values(least(me,other), greatest(me,other)) on conflict do nothing;
end;
$$;

create or replace function public.decline_friend_request(requester_username text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare me uuid := auth.uid(); other uuid;
begin
  select id into other from public.profiles where lower(username)=lower(trim(requester_username)) limit 1;
  if other is null then raise exception 'User not found.'; end if;
  delete from public.friend_requests where sender_id=other and receiver_id=me;
end;
$$;

create or replace function public.cancel_friend_request(target_username text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare me uuid := auth.uid(); target uuid;
begin
  select id into target from public.profiles where lower(username)=lower(trim(target_username)) limit 1;
  if target is null then raise exception 'User not found.'; end if;
  delete from public.friend_requests where sender_id=me and receiver_id=target;
end;
$$;

create or replace function public.send_friend_message(target_username text, message_body text)
returns public.messages
language plpgsql
security definer set search_path = public
as $$
declare
  me uuid := auth.uid(); target uuid; result public.messages;
begin
  if me is null then raise exception 'Unauthorized'; end if;
  if char_length(trim(message_body)) = 0 then raise exception 'Tin nhắn trống.'; end if;
  if char_length(message_body) > 2000 then raise exception 'Tin nhắn quá dài.'; end if;
  select id into target from public.profiles where lower(username)=lower(trim(target_username)) limit 1;
  if target is null then raise exception 'User not found.'; end if;
  if not exists(select 1 from public.friendships f where f.user_a=least(me,target) and f.user_b=greatest(me,target)) then
    raise exception 'Chỉ có thể chat với bạn bè.';
  end if;
  insert into public.messages(sender_id, receiver_id, body) values(me,target,trim(message_body)) returning * into result;
  return result;
end;
$$;

-- RLS: clients use publishable key only. Secret/service-role keys must never be put in frontend.
alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.messages enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.friend_requests from anon, authenticated;
revoke all on table public.friendships from anon, authenticated;
revoke all on table public.messages from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.friend_requests, public.friendships, public.messages to authenticated;

drop policy if exists profiles_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_self on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists requests_self on public.friend_requests;
create policy requests_self on public.friend_requests for select to authenticated using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists friendships_self on public.friendships;
create policy friendships_self on public.friendships for select to authenticated using (user_a = auth.uid() or user_b = auth.uid());

drop policy if exists messages_self on public.messages;
create policy messages_self on public.messages for select to authenticated using (sender_id = auth.uid() or receiver_id = auth.uid());

revoke all on function public.search_profile(text) from public;
grant execute on function public.search_profile(text) to authenticated;
revoke all on function public.send_friend_request(text) from public;
grant execute on function public.send_friend_request(text) to authenticated;
revoke all on function public.accept_friend_request(text) from public;
grant execute on function public.accept_friend_request(text) to authenticated;
revoke all on function public.decline_friend_request(text) from public;
grant execute on function public.decline_friend_request(text) to authenticated;
revoke all on function public.cancel_friend_request(text) from public;
grant execute on function public.cancel_friend_request(text) to authenticated;
revoke all on function public.send_friend_message(text,text) from public;
grant execute on function public.send_friend_message(text,text) to authenticated;

-- Realtime for chat/friend requests if you want to enable it later.
-- alter publication supabase_realtime add table public.messages;
-- alter publication supabase_realtime add table public.friend_requests;

-- Returns only the caller's friend/request usernames.
create or replace function public.get_friend_data()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare me uuid := auth.uid(); result jsonb;
begin
  if me is null then raise exception 'Unauthorized'; end if;
  select jsonb_build_object(
    'friends', coalesce((select jsonb_agg(case when f.user_a=me then pb.username else pa.username end order by case when f.user_a=me then pb.username else pa.username end)
                         from public.friendships f
                         join public.profiles pa on pa.id=f.user_a
                         join public.profiles pb on pb.id=f.user_b
                         where f.user_a=me or f.user_b=me),'[]'::jsonb),
    'friendRequests', coalesce((select jsonb_agg(p.username order by r.created_at desc)
                                from public.friend_requests r join public.profiles p on p.id=r.sender_id
                                where r.receiver_id=me),'[]'::jsonb),
    'sentFriendRequests', coalesce((select jsonb_agg(p.username order by r.created_at desc)
                                    from public.friend_requests r join public.profiles p on p.id=r.receiver_id
                                    where r.sender_id=me),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.get_friend_data() from public;
grant execute on function public.get_friend_data() to authenticated;
