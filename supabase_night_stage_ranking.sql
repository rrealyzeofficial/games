-- =========================================================
-- REALYZE!! · NIGHT STAGE LEADERBOARD V59
-- Run this once in Supabase SQL Editor.
-- Safe to run again: CREATE IF NOT EXISTS + CREATE OR REPLACE
-- + DROP TRIGGER IF EXISTS are used.
--
-- This leaderboard is derived automatically from:
--   profiles.game_data.nightStagePoints
--   profiles.game_data.nightStageFaction
-- so the game does NOT need a second client-side score write.
-- =========================================================

begin;

create table if not exists public.night_stage_rankings (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    points bigint not null default 0 check (points >= 0),
    faction text null check (faction in ('an','akito','saki')),
    updated_at timestamptz not null default now()
);

create index if not exists night_stage_rankings_points_idx
    on public.night_stage_rankings (points desc, user_id asc);

alter table public.night_stage_rankings enable row level security;

-- Clients read the leaderboard through RPC functions below.
-- Direct writes are intentionally blocked.
revoke all on table public.night_stage_rankings from anon, authenticated;

-- ---------------------------------------------------------
-- Keep ranking row synchronized with profiles.game_data.
-- ---------------------------------------------------------
create or replace function public.sync_night_stage_ranking_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_points bigint := 0;
    v_faction text := null;
begin
    if coalesce(new.game_data->>'nightStagePoints','') ~ '^[0-9]+$' then
        v_points := greatest(0,(new.game_data->>'nightStagePoints')::bigint);
    end if;

    v_faction := lower(nullif(new.game_data->>'nightStageFaction',''));
    if v_faction not in ('an','akito','saki') then
        v_faction := null;
    end if;

    insert into public.night_stage_rankings as nsr
        (user_id,points,faction,updated_at)
    values
        (new.id,v_points,v_faction,now())
    on conflict (user_id) do update
    set
        points = excluded.points,
        faction = excluded.faction,
        updated_at = case
            when nsr.points is distinct from excluded.points
              or nsr.faction is distinct from excluded.faction
            then now()
            else nsr.updated_at
        end;

    return new;
end;
$$;

drop trigger if exists trg_sync_night_stage_ranking on public.profiles;
create trigger trg_sync_night_stage_ranking
after insert or update of game_data on public.profiles
for each row
execute function public.sync_night_stage_ranking_from_profile();

-- ---------------------------------------------------------
-- Backfill players who already existed before this script.
-- ---------------------------------------------------------
insert into public.night_stage_rankings as nsr
    (user_id,points,faction,updated_at)
select
    p.id,
    case
        when coalesce(p.game_data->>'nightStagePoints','') ~ '^[0-9]+$'
        then greatest(0,(p.game_data->>'nightStagePoints')::bigint)
        else 0
    end as points,
    case lower(nullif(p.game_data->>'nightStageFaction',''))
        when 'an' then 'an'
        when 'akito' then 'akito'
        when 'saki' then 'saki'
        else null
    end as faction,
    now()
from public.profiles p
on conflict (user_id) do update
set
    points = excluded.points,
    faction = excluded.faction,
    updated_at = case
        when nsr.points is distinct from excluded.points
          or nsr.faction is distinct from excluded.faction
        then now()
        else nsr.updated_at
    end;

-- ---------------------------------------------------------
-- Leaderboard RPC.
-- p_limit = 3 for the lobby; p_limit = 100 for ranking popup.
-- ---------------------------------------------------------
create or replace function public.get_night_stage_leaderboard(p_limit integer default 100)
returns table (
    rank bigint,
    user_id uuid,
    username text,
    faction text,
    points bigint,
    is_me boolean
)
language sql
stable
security definer
set search_path = public
as $$
    with ranked as (
        select
            row_number() over (
                order by r.points desc, r.user_id asc
            ) as rank,
            r.user_id,
            p.username,
            r.faction,
            r.points,
            (r.user_id = auth.uid()) as is_me
        from public.night_stage_rankings r
        join public.profiles p on p.id = r.user_id
    )
    select
        ranked.rank,
        ranked.user_id,
        ranked.username,
        ranked.faction,
        ranked.points,
        ranked.is_me
    from ranked
    order by ranked.rank
    limit least(greatest(coalesce(p_limit,100),1),100);
$$;

-- ---------------------------------------------------------
-- Current player's true rank even when they are outside Top 100.
-- ---------------------------------------------------------
create or replace function public.get_night_stage_my_rank()
returns table (
    rank bigint,
    points bigint
)
language sql
stable
security definer
set search_path = public
as $$
    with ranked as (
        select
            row_number() over (
                order by r.points desc, r.user_id asc
            ) as rank,
            r.user_id,
            r.points
        from public.night_stage_rankings r
    )
    select ranked.rank, ranked.points
    from ranked
    where ranked.user_id = auth.uid()
    limit 1;
$$;

revoke all on function public.get_night_stage_leaderboard(integer) from public;
revoke all on function public.get_night_stage_my_rank() from public;

grant execute on function public.get_night_stage_leaderboard(integer) to authenticated;
grant execute on function public.get_night_stage_my_rank() to authenticated;

commit;
