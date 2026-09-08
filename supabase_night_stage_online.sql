-- =========================================================
-- REALYZE!! · NIGHT STAGE ONLINE V64
-- Public matchmaking + friend rooms + hidden roles + leave vote
-- 8 players minimum to start, 10 maximum.
-- Re-runnable migration.
-- =========================================================

begin;

create extension if not exists pgcrypto;

create table if not exists public.night_stage_rooms (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    kind text not null default 'matchmaking' check (kind in ('matchmaking','friend')),
    host_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'waiting' check (status in ('waiting','playing','pause_vote','ended','cancelled')),
    fill_deadline timestamptz,
    phase text not null default 'ROLE REVEAL',
    round_no integer not null default 1 check (round_no >= 1),
    live_integrity integer not null default 100 check (live_integrity between 0 and 100),
    winner text check (winner is null or winner in ('PERFORMER','WOLF','STOPPED')),
    win_reason text,
    pause_started_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.night_stage_room_players (
    room_id uuid not null references public.night_stage_rooms(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    username text not null default 'PLAYER',
    character_id text,
    seat integer not null check (seat between 1 and 10),
    active boolean not null default true,
    secret_role text,
    secret_team text check (secret_team is null or secret_team in ('PERFORMER','WOLF')),
    joined_at timestamptz not null default now(),
    left_at timestamptz,
    primary key (room_id,user_id),
    unique (room_id,seat)
);

create table if not exists public.night_stage_continue_votes (
    room_id uuid not null references public.night_stage_rooms(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    continue_game boolean not null,
    created_at timestamptz not null default now(),
    primary key (room_id,user_id)
);

create table if not exists public.night_stage_friend_invites (
    id uuid primary key default gen_random_uuid(),
    room_id uuid not null references public.night_stage_rooms(id) on delete cascade,
    inviter_id uuid not null references auth.users(id) on delete cascade,
    target_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'pending' check (status in ('pending','accepted','declined','expired')),
    created_at timestamptz not null default now(),
    responded_at timestamptz
);

-- Compatibility if an earlier V63 draft was already executed.
-- Keep old optional columns, but normalize the constraints/columns this build relies on.
alter table public.night_stage_rooms add column if not exists fill_deadline timestamptz;
alter table public.night_stage_rooms add column if not exists phase text;
alter table public.night_stage_rooms add column if not exists round_no integer;
alter table public.night_stage_rooms add column if not exists live_integrity integer;
alter table public.night_stage_rooms add column if not exists win_reason text;
alter table public.night_stage_rooms add column if not exists pause_started_at timestamptz;

alter table public.night_stage_rooms drop constraint if exists night_stage_rooms_kind_check;
alter table public.night_stage_rooms drop constraint if exists night_stage_rooms_status_check;
alter table public.night_stage_rooms drop constraint if exists night_stage_rooms_winner_check;
update public.night_stage_rooms set kind='matchmaking' where kind='public';
update public.night_stage_rooms set status='waiting' where status='countdown';
update public.night_stage_rooms set status='ended' where status='finished';
update public.night_stage_rooms set phase=coalesce(phase,'ROLE REVEAL'),round_no=coalesce(round_no,1),live_integrity=coalesce(live_integrity,100);
alter table public.night_stage_rooms add constraint night_stage_rooms_kind_check check (kind in ('matchmaking','friend'));
alter table public.night_stage_rooms add constraint night_stage_rooms_status_check check (status in ('waiting','playing','pause_vote','ended','cancelled'));
alter table public.night_stage_rooms add constraint night_stage_rooms_winner_check check (winner is null or winner in ('PERFORMER','WOLF','STOPPED'));

alter table public.night_stage_room_players add column if not exists character_id text;
alter table public.night_stage_room_players add column if not exists secret_team text;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='night_stage_room_players' and column_name='representative_id') then
    execute 'update public.night_stage_room_players set character_id=coalesce(character_id,representative_id) where character_id is null';
  end if;
end $$;

-- An earlier draft used UNIQUE(room_id,seat), which prevents reusing a seat after a player leaves.
alter table public.night_stage_room_players drop constraint if exists night_stage_room_players_room_id_seat_key;
create unique index if not exists ns_v63_room_active_seat_unique
    on public.night_stage_room_players(room_id,seat) where active;

create index if not exists ns_v63_rooms_waiting_idx
    on public.night_stage_rooms(kind,status,fill_deadline,created_at);
create index if not exists ns_v63_players_room_active_idx
    on public.night_stage_room_players(room_id,active,seat);
create index if not exists ns_v63_invites_target_idx
    on public.night_stage_friend_invites(target_id,status,created_at desc);

alter table public.night_stage_rooms enable row level security;
alter table public.night_stage_room_players enable row level security;
alter table public.night_stage_continue_votes enable row level security;
alter table public.night_stage_friend_invites enable row level security;

-- Clients do not read these tables directly. All reads/writes go through safe RPCs,
-- which prevents another client from selecting secret_role / secret_team.
revoke all on public.night_stage_rooms from anon, authenticated;
revoke all on public.night_stage_room_players from anon, authenticated;
revoke all on public.night_stage_continue_votes from anon, authenticated;
revoke all on public.night_stage_friend_invites from anon, authenticated;

-- ---------- helpers ----------
create or replace function public.ns_v63_room_code()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    c text;
begin
    loop
        -- V64: do not call gen_random_bytes(). On Supabase pgcrypto is often
        -- installed in the extensions schema, so a SECURITY DEFINER function
        -- with search_path=public could not resolve it and friend-room creation
        -- failed with: function gen_random_bytes(integer) does not exist.
        -- md5(random + clock + txid) is sufficient for a short non-secret room
        -- code; the UNIQUE constraint + loop still guarantees no duplicate code.
        c := upper(substr(md5(
            random()::text || ':' ||
            clock_timestamp()::text || ':' ||
            txid_current()::text
        ),1,6));
        exit when not exists(select 1 from public.night_stage_rooms where code=c);
    end loop;
    return c;
end;
$$;

create or replace function public.ns_v63_username(p_uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(nullif(p.username,''),'PLAYER')
    from public.profiles p
    where p.id=p_uid
    limit 1
$$;

create or replace function public.ns_v63_next_seat(p_room_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
    select s
    from generate_series(1,10) s
    where not exists (
        select 1 from public.night_stage_room_players p
        where p.room_id=p_room_id and p.active and p.seat=s
    )
    order by s
    limit 1
$$;

create or replace function public.ns_v63_snapshot(p_room_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    room_row public.night_stage_rooms%rowtype;
    mine public.night_stage_room_players%rowtype;
    players_json jsonb;
begin
    if uid is null then raise exception 'AUTH_REQUIRED'; end if;

    select * into room_row
    from public.night_stage_rooms
    where id=p_room_id;
    if room_row.id is null then raise exception 'ROOM_NOT_FOUND'; end if;

    select * into mine
    from public.night_stage_room_players
    where room_id=p_room_id and user_id=uid
    limit 1;
    if mine.user_id is null then raise exception 'NOT_IN_ROOM'; end if;

    select coalesce(jsonb_agg(
        jsonb_build_object(
            'user_id',p.user_id,
            'username',p.username,
            'character_id',p.character_id,
            'seat',p.seat,
            'active',p.active
        ) order by p.seat
    ),'[]'::jsonb)
    into players_json
    from public.night_stage_room_players p
    where p.room_id=p_room_id;

    return jsonb_build_object(
        'room',jsonb_build_object(
            'id',room_row.id,
            'code',room_row.code,
            'kind',room_row.kind,
            'host_id',room_row.host_id,
            'status',room_row.status,
            'fill_deadline',room_row.fill_deadline,
            'phase',room_row.phase,
            'round_no',room_row.round_no,
            'live_integrity',room_row.live_integrity,
            'winner',room_row.winner,
            'win_reason',room_row.win_reason,
            'pause_started_at',room_row.pause_started_at
        ),
        'players',players_json,
        'my_role',case when room_row.status in ('playing','pause_vote','ended') then mine.secret_role else null end,
        'my_team',case when room_row.status in ('playing','pause_vote','ended') then mine.secret_team else null end
    );
end;
$$;

create or replace function public.ns_v63_assign_roles(p_room_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    n integer;
    wolf_count integer;
    ids uuid[];
    uid uuid;
    performer_roles text[] := array['PRODUCER','SECURITY','CENTER','SOUND ENGINEER'];
    i integer := 1;
    perf_i integer := 1;
    role_name text;
begin
    select count(*) into n
    from public.night_stage_room_players
    where room_id=p_room_id and active;

    if n<8 or n>10 then raise exception 'NEED_8_TO_10_PLAYERS'; end if;
    wolf_count := case when n=10 then 3 else 2 end;

    select array_agg(user_id order by random()) into ids
    from public.night_stage_room_players
    where room_id=p_room_id and active;

    foreach uid in array ids loop
        if i<=wolf_count then
            role_name := 'BACKSTAGE WOLF';
            update public.night_stage_room_players
            set secret_role=role_name,secret_team='WOLF'
            where room_id=p_room_id and user_id=uid;
        else
            if perf_i<=array_length(performer_roles,1) then
                role_name := performer_roles[perf_i];
            else
                role_name := 'STAGE MEMBER';
            end if;
            update public.night_stage_room_players
            set secret_role=role_name,secret_team='PERFORMER'
            where room_id=p_room_id and user_id=uid;
            perf_i := perf_i+1;
        end if;
        i := i+1;
    end loop;
end;
$$;

create or replace function public.ns_v63_start_room(p_room_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    room_row public.night_stage_rooms%rowtype;
    n integer;
begin
    select * into room_row
    from public.night_stage_rooms
    where id=p_room_id
    for update;
    if room_row.id is null then raise exception 'ROOM_NOT_FOUND'; end if;

    select count(*) into n
    from public.night_stage_room_players
    where room_id=p_room_id and active;
    if n<8 or n>10 then raise exception 'NEED_8_TO_10_PLAYERS'; end if;

    if room_row.status='playing' then return public.ns_v63_snapshot(p_room_id); end if;
    if room_row.status<>'waiting' then raise exception 'ROOM_NOT_WAITING'; end if;

    perform public.ns_v63_assign_roles(p_room_id);
    update public.night_stage_rooms
    set status='playing',fill_deadline=null,phase='ROLE REVEAL',round_no=1,
        live_integrity=100,winner=null,win_reason=null,pause_started_at=null,updated_at=now()
    where id=p_room_id;

    delete from public.night_stage_continue_votes where room_id=p_room_id;
    return public.ns_v63_snapshot(p_room_id);
end;
$$;

create or replace function public.ns_v63_recompute_win(p_room_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    wolves integer;
    performers integer;
    integrity integer;
begin
    select count(*) filter(where secret_team='WOLF'),
           count(*) filter(where secret_team='PERFORMER')
    into wolves,performers
    from public.night_stage_room_players
    where room_id=p_room_id and active;

    select live_integrity into integrity from public.night_stage_rooms where id=p_room_id;

    if wolves=0 then
        update public.night_stage_rooms
        set status='ended',winner='PERFORMER',win_reason='Tất cả BACKSTAGE WOLF đã rời hoặc bị loại.',pause_started_at=null,updated_at=now()
        where id=p_room_id;
        return true;
    end if;

    if coalesce(integrity,100)<=0 then
        update public.night_stage_rooms
        set status='ended',winner='WOLF',win_reason='LIVE INTEGRITY đã về 0%.',pause_started_at=null,updated_at=now()
        where id=p_room_id;
        return true;
    end if;

    if performers=0 or wolves>=performers then
        update public.night_stage_rooms
        set status='ended',winner='WOLF',win_reason='Số Wolf đã bằng hoặc vượt số Performer còn lại.',pause_started_at=null,updated_at=now()
        where id=p_room_id;
        return true;
    end if;

    return false;
end;
$$;

-- ---------- public matchmaking ----------
create or replace function public.night_stage_join_public_queue(p_character_id text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    rid uuid;
    seat_no integer;
    uname text;
    n integer;
begin
    if uid is null then raise exception 'AUTH_REQUIRED'; end if;
    perform pg_advisory_xact_lock(hashtext('night_stage_v63_public_queue'));

    -- Resume an existing waiting room first.
    select p.room_id into rid
    from public.night_stage_room_players p
    join public.night_stage_rooms r on r.id=p.room_id
    where p.user_id=uid and p.active and r.status='waiting' and r.kind='matchmaking'
    order by p.joined_at desc
    limit 1;

    if rid is null then
        select r.id into rid
        from public.night_stage_rooms r
        where r.kind='matchmaking' and r.status='waiting'
          and (select count(*) from public.night_stage_room_players p where p.room_id=r.id and p.active)<10
        order by r.created_at
        limit 1
        for update skip locked;
    end if;

    if rid is null then
        insert into public.night_stage_rooms(code,kind,host_id)
        values(public.ns_v63_room_code(),'matchmaking',uid)
        returning id into rid;
    end if;

    uname := public.ns_v63_username(uid);
    if not exists(select 1 from public.night_stage_room_players where room_id=rid and user_id=uid and active) then
        seat_no := public.ns_v63_next_seat(rid);
        if seat_no is null then raise exception 'ROOM_FULL'; end if;
        insert into public.night_stage_room_players(room_id,user_id,username,character_id,seat,active,left_at)
        values(rid,uid,uname,p_character_id,seat_no,true,null)
        on conflict(room_id,user_id) do update
        set username=excluded.username,character_id=excluded.character_id,seat=excluded.seat,active=true,left_at=null;
    else
        update public.night_stage_room_players
        set character_id=p_character_id,username=uname
        where room_id=rid and user_id=uid;
    end if;

    select count(*) into n from public.night_stage_room_players where room_id=rid and active;

    if n>=10 then
        return public.ns_v63_start_room(rid);
    elsif n>=8 then
        update public.night_stage_rooms
        set fill_deadline=coalesce(fill_deadline,now()+interval '10 seconds'),updated_at=now()
        where id=rid and status='waiting';
    end if;

    return public.ns_v63_snapshot(rid);
end;
$$;

create or replace function public.night_stage_touch_room(p_room_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    room_row public.night_stage_rooms%rowtype;
    n integer;
begin
    if uid is null then raise exception 'AUTH_REQUIRED'; end if;
    if not exists(select 1 from public.night_stage_room_players where room_id=p_room_id and user_id=uid) then
        raise exception 'NOT_IN_ROOM';
    end if;

    select * into room_row from public.night_stage_rooms where id=p_room_id for update;
    if room_row.id is null then raise exception 'ROOM_NOT_FOUND'; end if;

    if room_row.kind='matchmaking' and room_row.status='waiting' then
        select count(*) into n from public.night_stage_room_players where room_id=p_room_id and active;
        if n>=10 then
            return public.ns_v63_start_room(p_room_id);
        elsif n>=8 and room_row.fill_deadline is null then
            update public.night_stage_rooms set fill_deadline=now()+interval '10 seconds',updated_at=now() where id=p_room_id;
        elsif n>=8 and room_row.fill_deadline<=now() then
            return public.ns_v63_start_room(p_room_id);
        elsif n<8 and room_row.fill_deadline is not null then
            update public.night_stage_rooms set fill_deadline=null,updated_at=now() where id=p_room_id;
        end if;
    end if;

    return public.ns_v63_snapshot(p_room_id);
end;
$$;

-- ---------- friend rooms ----------
create or replace function public.night_stage_create_friend_room(p_character_id text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    rid uuid;
    uname text;
begin
    if uid is null then raise exception 'AUTH_REQUIRED'; end if;
    uname := public.ns_v63_username(uid);

    insert into public.night_stage_rooms(code,kind,host_id)
    values(public.ns_v63_room_code(),'friend',uid)
    returning id into rid;

    insert into public.night_stage_room_players(room_id,user_id,username,character_id,seat)
    values(rid,uid,uname,p_character_id,1);

    return public.ns_v63_snapshot(rid);
end;
$$;

create or replace function public.night_stage_join_friend_room(p_code text,p_character_id text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    rid uuid;
    n integer;
    seat_no integer;
    uname text;
begin
    if uid is null then raise exception 'AUTH_REQUIRED'; end if;

    select id into rid
    from public.night_stage_rooms
    where kind='friend' and status='waiting' and code=upper(trim(p_code))
    for update;
    if rid is null then raise exception 'ROOM_NOT_FOUND_OR_ALREADY_STARTED'; end if;

    select count(*) into n from public.night_stage_room_players where room_id=rid and active;
    if n>=10 and not exists(select 1 from public.night_stage_room_players where room_id=rid and user_id=uid and active) then
        raise exception 'ROOM_FULL';
    end if;

    uname := public.ns_v63_username(uid);
    if exists(select 1 from public.night_stage_room_players where room_id=rid and user_id=uid) then
        if not exists(select 1 from public.night_stage_room_players where room_id=rid and user_id=uid and active) then
            seat_no := public.ns_v63_next_seat(rid);
            if seat_no is null then raise exception 'ROOM_FULL'; end if;
        else
            select seat into seat_no from public.night_stage_room_players where room_id=rid and user_id=uid;
        end if;
        update public.night_stage_room_players
        set username=uname,character_id=p_character_id,seat=seat_no,active=true,left_at=null
        where room_id=rid and user_id=uid;
    else
        seat_no := public.ns_v63_next_seat(rid);
        insert into public.night_stage_room_players(room_id,user_id,username,character_id,seat)
        values(rid,uid,uname,p_character_id,seat_no);
    end if;

    return public.ns_v63_snapshot(rid);
end;
$$;

create or replace function public.night_stage_start_friend_room(p_room_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    room_row public.night_stage_rooms%rowtype;
begin
    if uid is null then raise exception 'AUTH_REQUIRED'; end if;
    select * into room_row from public.night_stage_rooms where id=p_room_id for update;
    if room_row.id is null then raise exception 'ROOM_NOT_FOUND'; end if;
    if room_row.kind<>'friend' then raise exception 'NOT_FRIEND_ROOM'; end if;
    if room_row.host_id<>uid then raise exception 'HOST_ONLY'; end if;
    return public.ns_v63_start_room(p_room_id);
end;
$$;

create or replace function public.night_stage_leave_lobby(p_room_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    room_row public.night_stage_rooms%rowtype;
    next_host uuid;
begin
    if uid is null then raise exception 'AUTH_REQUIRED'; end if;
    select * into room_row from public.night_stage_rooms where id=p_room_id for update;
    if room_row.id is null then return true; end if;
    if room_row.status<>'waiting' then raise exception 'ROOM_ALREADY_STARTED'; end if;

    delete from public.night_stage_room_players
    where room_id=p_room_id and user_id=uid;

    if room_row.host_id=uid then
        select user_id into next_host
        from public.night_stage_room_players
        where room_id=p_room_id and active
        order by seat
        limit 1;
        if next_host is null then
            update public.night_stage_rooms set status='cancelled',updated_at=now() where id=p_room_id;
        else
            update public.night_stage_rooms set host_id=next_host,updated_at=now() where id=p_room_id;
        end if;
    end if;
    return true;
end;
$$;

-- ---------- friend invites ----------
create or replace function public.night_stage_invite_friend(p_room_id uuid,p_target_username text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    target_uid uuid;
    room_row public.night_stage_rooms%rowtype;
begin
    if uid is null then raise exception 'AUTH_REQUIRED'; end if;
    select * into room_row from public.night_stage_rooms where id=p_room_id;
    if room_row.id is null or room_row.status<>'waiting' or room_row.kind<>'friend' then raise exception 'ROOM_NOT_INVITABLE'; end if;
    if not exists(select 1 from public.night_stage_room_players where room_id=p_room_id and user_id=uid and active) then raise exception 'NOT_IN_ROOM'; end if;

    select id into target_uid from public.profiles where lower(username)=lower(trim(p_target_username)) limit 1;
    if target_uid is null then raise exception 'PLAYER_NOT_FOUND'; end if;
    if target_uid=uid then raise exception 'CANNOT_INVITE_SELF'; end if;

    update public.night_stage_friend_invites
    set status='expired',responded_at=now()
    where room_id=p_room_id and target_id=target_uid and status='pending';

    insert into public.night_stage_friend_invites(room_id,inviter_id,target_id)
    values(p_room_id,uid,target_uid);
    return true;
end;
$$;

create or replace function public.night_stage_get_invites()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    out_json jsonb;
begin
    if uid is null then raise exception 'AUTH_REQUIRED'; end if;

    select coalesce(jsonb_agg(jsonb_build_object(
        'id',i.id,
        'room_code',r.code,
        'inviter',coalesce(p.username,'PLAYER'),
        'created_at',i.created_at
    ) order by i.created_at desc),'[]'::jsonb)
    into out_json
    from public.night_stage_friend_invites i
    join public.night_stage_rooms r on r.id=i.room_id and r.status='waiting'
    left join public.profiles p on p.id=i.inviter_id
    where i.target_id=uid and i.status='pending';

    return out_json;
end;
$$;

create or replace function public.night_stage_accept_invite(p_invite_id uuid,p_character_id text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    inv public.night_stage_friend_invites%rowtype;
    snap jsonb;
begin
    if uid is null then raise exception 'AUTH_REQUIRED'; end if;
    select * into inv from public.night_stage_friend_invites where id=p_invite_id for update;
    if inv.id is null or inv.target_id<>uid or inv.status<>'pending' then raise exception 'INVITE_NOT_AVAILABLE'; end if;

    select public.night_stage_join_friend_room((select code from public.night_stage_rooms where id=inv.room_id),p_character_id) into snap;
    update public.night_stage_friend_invites set status='accepted',responded_at=now() where id=p_invite_id;
    return snap;
end;
$$;

create or replace function public.night_stage_decline_invite(p_invite_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare uid uuid := auth.uid();
begin
    if uid is null then raise exception 'AUTH_REQUIRED'; end if;
    update public.night_stage_friend_invites
    set status='declined',responded_at=now()
    where id=p_invite_id and target_id=uid and status='pending';
    return found;
end;
$$;

-- ---------- exit / continue vote ----------
create or replace function public.night_stage_request_exit(p_room_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    room_row public.night_stage_rooms%rowtype;
    active_n integer;
    ended boolean;
begin
    if uid is null then raise exception 'AUTH_REQUIRED'; end if;
    select * into room_row from public.night_stage_rooms where id=p_room_id for update;
    if room_row.id is null then raise exception 'ROOM_NOT_FOUND'; end if;
    if room_row.status not in ('playing','pause_vote') then
        return jsonb_build_object('status',room_row.status,'winner',room_row.winner,'win_reason',room_row.win_reason);
    end if;

    update public.night_stage_room_players
    set active=false,left_at=now()
    where room_id=p_room_id and user_id=uid and active;

    ended := public.ns_v63_recompute_win(p_room_id);
    if ended then
        select * into room_row from public.night_stage_rooms where id=p_room_id;
        return jsonb_build_object('status',room_row.status,'winner',room_row.winner,'win_reason',room_row.win_reason);
    end if;

    select count(*) into active_n from public.night_stage_room_players where room_id=p_room_id and active;
    if active_n=0 then
        update public.night_stage_rooms set status='ended',winner='STOPPED',win_reason='Không còn người chơi trong trận.',updated_at=now() where id=p_room_id;
    else
        delete from public.night_stage_continue_votes where room_id=p_room_id;
        update public.night_stage_rooms
        set status='pause_vote',pause_started_at=now(),updated_at=now()
        where id=p_room_id;
    end if;

    select * into room_row from public.night_stage_rooms where id=p_room_id;
    return jsonb_build_object('status',room_row.status,'winner',room_row.winner,'win_reason',room_row.win_reason);
end;
$$;

create or replace function public.night_stage_vote_continue(p_room_id uuid,p_continue boolean)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    room_row public.night_stage_rooms%rowtype;
    active_n integer;
    voted_n integer;
    yes_n integer;
    no_n integer;
begin
    if uid is null then raise exception 'AUTH_REQUIRED'; end if;
    select * into room_row from public.night_stage_rooms where id=p_room_id for update;
    if room_row.id is null then raise exception 'ROOM_NOT_FOUND'; end if;
    if room_row.status<>'pause_vote' then return public.ns_v63_snapshot(p_room_id); end if;
    if not exists(select 1 from public.night_stage_room_players where room_id=p_room_id and user_id=uid and active) then raise exception 'NOT_ACTIVE_PLAYER'; end if;

    insert into public.night_stage_continue_votes(room_id,user_id,continue_game)
    values(p_room_id,uid,p_continue)
    on conflict(room_id,user_id) do update set continue_game=excluded.continue_game,created_at=now();

    select count(*) into active_n from public.night_stage_room_players where room_id=p_room_id and active;
    select count(*),count(*) filter(where continue_game),count(*) filter(where not continue_game)
    into voted_n,yes_n,no_n
    from public.night_stage_continue_votes where room_id=p_room_id;

    if voted_n>=active_n then
        if yes_n>no_n then
            update public.night_stage_rooms set status='playing',pause_started_at=null,updated_at=now() where id=p_room_id;
        elsif no_n>yes_n then
            update public.night_stage_rooms set status='ended',winner='STOPPED',win_reason='Đa số người còn lại chọn dừng trận.',pause_started_at=null,updated_at=now() where id=p_room_id;
        end if;
    end if;

    return public.ns_v63_snapshot(p_room_id);
end;
$$;

create or replace function public.night_stage_finalize_continue_vote(p_room_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    room_row public.night_stage_rooms%rowtype;
    yes_n integer;
    no_n integer;
begin
    select * into room_row from public.night_stage_rooms where id=p_room_id for update;
    if room_row.id is null then raise exception 'ROOM_NOT_FOUND'; end if;
    if room_row.status<>'pause_vote' then return public.ns_v63_snapshot(p_room_id); end if;
    if room_row.pause_started_at is null or room_row.pause_started_at > now()-interval '20 seconds' then
        return public.ns_v63_snapshot(p_room_id);
    end if;

    select count(*) filter(where continue_game),count(*) filter(where not continue_game)
    into yes_n,no_n
    from public.night_stage_continue_votes where room_id=p_room_id;

    if yes_n>no_n then
        update public.night_stage_rooms set status='playing',pause_started_at=null,updated_at=now() where id=p_room_id;
    else
        update public.night_stage_rooms set status='ended',winner='STOPPED',win_reason='Vote tiếp tục không đạt đa số. Trận đã dừng.',pause_started_at=null,updated_at=now() where id=p_room_id;
    end if;
    return public.ns_v63_snapshot(p_room_id);
end;
$$;

-- ---------- grants ----------
-- Helper functions are SECURITY DEFINER but not callable by the client.
revoke all on function public.ns_v63_room_code() from public;
revoke all on function public.ns_v63_username(uuid) from public;
revoke all on function public.ns_v63_next_seat(uuid) from public;
revoke all on function public.ns_v63_snapshot(uuid) from public;
revoke all on function public.ns_v63_assign_roles(uuid) from public;
revoke all on function public.ns_v63_start_room(uuid) from public;
revoke all on function public.ns_v63_recompute_win(uuid) from public;

revoke all on function public.night_stage_join_public_queue(text) from public;
revoke all on function public.night_stage_touch_room(uuid) from public;
revoke all on function public.night_stage_create_friend_room(text) from public;
revoke all on function public.night_stage_join_friend_room(text,text) from public;
revoke all on function public.night_stage_start_friend_room(uuid) from public;
revoke all on function public.night_stage_leave_lobby(uuid) from public;
revoke all on function public.night_stage_invite_friend(uuid,text) from public;
revoke all on function public.night_stage_get_invites() from public;
revoke all on function public.night_stage_accept_invite(uuid,text) from public;
revoke all on function public.night_stage_decline_invite(uuid) from public;
revoke all on function public.night_stage_request_exit(uuid) from public;
revoke all on function public.night_stage_vote_continue(uuid,boolean) from public;
revoke all on function public.night_stage_finalize_continue_vote(uuid) from public;

grant execute on function public.night_stage_join_public_queue(text) to authenticated;
grant execute on function public.night_stage_touch_room(uuid) to authenticated;
grant execute on function public.night_stage_create_friend_room(text) to authenticated;
grant execute on function public.night_stage_join_friend_room(text,text) to authenticated;
grant execute on function public.night_stage_start_friend_room(uuid) to authenticated;
grant execute on function public.night_stage_leave_lobby(uuid) to authenticated;
grant execute on function public.night_stage_invite_friend(uuid,text) to authenticated;
grant execute on function public.night_stage_get_invites() to authenticated;
grant execute on function public.night_stage_accept_invite(uuid,text) to authenticated;
grant execute on function public.night_stage_decline_invite(uuid) to authenticated;
grant execute on function public.night_stage_request_exit(uuid) to authenticated;
grant execute on function public.night_stage_vote_continue(uuid,boolean) to authenticated;
grant execute on function public.night_stage_finalize_continue_vote(uuid) to authenticated;

commit;
