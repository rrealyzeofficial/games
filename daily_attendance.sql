-- REALYZE!! — DAILY ATTENDANCE ONLY
-- Run this file AFTER your existing REALYZE Supabase schema.
-- This migration is intentionally standalone and safe to run repeatedly.
-- No localStorage is used for attendance.

create extension if not exists pgcrypto;

create table if not exists public.daily_attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  attendance_date date not null,
  month_key text not null check (month_key ~ '^[0-9]{4}-[0-9]{2}$'),
  day integer not null check (day between 1 and 31),
  reward_type text not null check (reward_type in ('coins','gems')),
  reward_amount integer not null default 0 check (reward_amount >= 0),
  reward_character_id text,
  created_at timestamptz not null default now(),
  unique (user_id, attendance_date)
);

create index if not exists daily_attendance_user_month_idx
  on public.daily_attendance(user_id, month_key, attendance_date);

alter table public.daily_attendance enable row level security;

-- Clients do not need direct table access; the two functions below are the API.
revoke all on table public.daily_attendance from anon, authenticated;

drop policy if exists daily_attendance_self on public.daily_attendance;
create policy daily_attendance_self
  on public.daily_attendance
  for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------
-- Read current month's attendance
-- ---------------------------------------------------------
drop function if exists public.get_daily_attendance(text);
create or replace function public.get_daily_attendance(month_key_input text default null)
returns setof public.daily_attendance
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  current_month text := to_char((now() at time zone 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM');
  requested_month text := coalesce(month_key_input, current_month);
begin
  if me is null then
    raise exception 'Unauthorized';
  end if;

  if requested_month !~ '^[0-9]{4}-[0-9]{2}$' then
    raise exception 'Invalid month.';
  end if;

  return query
    select *
    from public.daily_attendance
    where user_id = me
      and month_key = requested_month
    order by attendance_date asc;
end;
$$;

revoke all on function public.get_daily_attendance(text) from public;
grant execute on function public.get_daily_attendance(text) to authenticated;

-- ---------------------------------------------------------
-- Claim today's reward — server authoritative
-- Day 1..7: 100/150/200/250/300/350/400 coins
-- Day 8: 320 gems
-- Repeat every 8 days.
-- Day 15 and 30: additionally award LUMINA 6★.
-- Missing days are NOT inserted and cannot be claimed later.
-- ---------------------------------------------------------
drop function if exists public.claim_daily_attendance();
create or replace function public.claim_daily_attendance()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  today_v date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  month_v text := to_char(today_v, 'YYYY-MM');
  day_v integer := extract(day from today_v)::integer;
  cycle_v integer := ((day_v - 1) % 8) + 1;
  reward_type_v text;
  reward_amount_v integer;
  reward_character_v text := null;
  gd jsonb;
  existing_id uuid;
  character_added boolean := false;
  character_duplicate boolean := false;
  cp jsonb;
begin
  if me is null then
    raise exception 'Unauthorized';
  end if;

  select id into existing_id
  from public.daily_attendance
  where user_id = me
    and attendance_date = today_v
  limit 1;

  if existing_id is not null then
    return jsonb_build_object(
      'already_claimed', true,
      'attendance_date', today_v,
      'day', day_v
    );
  end if;

  if cycle_v = 8 then
    reward_type_v := 'gems';
    reward_amount_v := 320;
  else
    reward_type_v := 'coins';
    reward_amount_v := 50 + cycle_v * 50;
  end if;

  if day_v in (15, 30) then
    reward_character_v := 'lumina';
  end if;

  select game_data into gd
  from public.profiles
  where id = me
  for update;

  if gd is null then
    raise exception 'Profile not found.';
  end if;

  if reward_type_v = 'coins' then
    gd := jsonb_set(
      gd,
      '{coins}',
      to_jsonb(coalesce((gd->>'coins')::numeric, 0) + reward_amount_v),
      true
    );
  else
    gd := jsonb_set(
      gd,
      '{gems}',
      to_jsonb(coalesce((gd->>'gems')::numeric, 0) + reward_amount_v),
      true
    );
  end if;

  if reward_character_v is not null then
    if not coalesce((gd->'myCharacters') @> '["lumina"]'::jsonb, false) then
      gd := jsonb_set(
        gd,
        '{myCharacters}',
        coalesce(gd->'myCharacters', '[]'::jsonb) || '["lumina"]'::jsonb,
        true
      );
      gd := jsonb_set(
        gd,
        '{characterProgress,lumina}',
        '{"rank":1,"level":1}'::jsonb,
        true
      );
      character_added := true;
    else
      cp := coalesce(gd->'characterProgress'->'lumina', '{"rank":1,"level":1}'::jsonb);
      cp := jsonb_set(cp, '{rank}', to_jsonb(least(5, greatest(1, coalesce((cp->>'rank')::integer, 1)) + 1)), true);
      gd := jsonb_set(gd, '{characterProgress,lumina}', cp, true);
      character_duplicate := true;
    end if;
  end if;

  update public.profiles
  set game_data = gd
  where id = me;

  insert into public.daily_attendance (
    user_id,
    attendance_date,
    month_key,
    day,
    reward_type,
    reward_amount,
    reward_character_id
  ) values (
    me,
    today_v,
    month_v,
    day_v,
    reward_type_v,
    reward_amount_v,
    reward_character_v
  );

  return jsonb_build_object(
    'already_claimed', false,
    'attendance_date', today_v,
    'month_key', month_v,
    'day', day_v,
    'reward_type', reward_type_v,
    'reward_amount', reward_amount_v,
    'reward_character_id', reward_character_v,
    'character_added', character_added,
    'character_duplicate', character_duplicate
  );
exception
  when unique_violation then
    return jsonb_build_object(
      'already_claimed', true,
      'attendance_date', today_v,
      'day', day_v
    );
end;
$$;

revoke all on function public.claim_daily_attendance() from public;
grant execute on function public.claim_daily_attendance() to authenticated;

-- Optional manual checks after signing in as a real user:
-- select * from public.daily_attendance order by attendance_date desc limit 20;
-- select public.get_daily_attendance(to_char((now() at time zone 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM'));
