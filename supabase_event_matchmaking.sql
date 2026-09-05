-- SHINE WITHOUT END: realtime event matchmaking + forfeit + world rank
-- Run this in Supabase SQL Editor. This is isolated from normal PLAY.
create extension if not exists pgcrypto;

create table if not exists public.event_matchmaking_queue (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  song text not null check (song in ('heart-bouquet','flos')),
  team jsonb not null,
  special text not null check (special in ('akito','kohane')),
  energy integer not null check (energy between 1 and 10),
  status text not null default 'waiting',
  match_id uuid,
  joined_at timestamptz not null default now()
);

create table if not exists public.event_matches (
  id uuid primary key default gen_random_uuid(),
  song text not null check (song in ('heart-bouquet','flos')),
  player1_id uuid not null references auth.users(id) on delete cascade,
  player2_id uuid not null references auth.users(id) on delete cascade,
  player1 jsonb not null,
  player2 jsonb not null,
  state jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  winner_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.event_matchmaking_queue enable row level security;
alter table public.event_matches enable row level security;

drop policy if exists event_queue_self on public.event_matchmaking_queue;
drop policy if exists event_queue_self on public.event_matchmaking_queue;
create policy event_queue_self on public.event_matchmaking_queue for select using (auth.uid()=user_id);

drop policy if exists event_match_participant_select on public.event_matches;
drop policy if exists event_match_participant_select on public.event_matches;
create policy event_match_participant_select on public.event_matches for select using (auth.uid()=player1_id or auth.uid()=player2_id);

drop policy if exists event_match_participant_update on public.event_matches;
drop policy if exists event_match_participant_update on public.event_matches;
create policy event_match_participant_update on public.event_matches for update using (auth.uid()=player1_id or auth.uid()=player2_id);

create or replace function public.event_join_matchmaking(p_song text,p_team jsonb,p_special text,p_energy integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare me uuid:=auth.uid(); myname text; opp record; mid uuid; myrow jsonb; opprow jsonb; safe_team jsonb;
begin
 if me is null then raise exception 'Unauthorized'; end if;
 safe_team:=case when jsonb_typeof(p_team)='array' then p_team else '[]'::jsonb end;
 if jsonb_array_length(safe_team)<>3 then raise exception 'Team must contain exactly 3 characters'; end if;
 select username into myname from public.profiles where id=me;
 delete from public.event_matchmaking_queue where user_id=me;
 select * into opp from public.event_matchmaking_queue q where q.status='waiting' and q.song=p_song and q.user_id<>me order by q.joined_at for update skip locked limit 1;
 if opp.user_id is null then
   insert into public.event_matchmaking_queue(user_id,username,song,team,special,energy,status) values(me,coalesce(myname,'PLAYER'),p_song,safe_team,p_special,p_energy,'waiting');
   return jsonb_build_object('status','waiting');
 end if;
 mid:=gen_random_uuid();
 myrow:=jsonb_build_object('username',coalesce(myname,'PLAYER'),'team',safe_team,'special',p_special,'energy',p_energy);
 opprow:=jsonb_build_object('username',opp.username,'team',case when jsonb_typeof(opp.team)='array' then opp.team else '[]'::jsonb end,'special',opp.special,'energy',opp.energy);
 insert into public.event_matches(id,song,player1_id,player2_id,player1,player2,state)
 values(mid,p_song,me,opp.user_id,myrow,opprow,jsonb_build_object('turn',1,'activeSide',null,'p1Points',jsonb_build_object('vocal',0,'rap',0,'act',0),'p2Points',jsonb_build_object('vocal',0,'rap',0,'act',0),'p1Special',0,'p2Special',0,'p1Buffs',jsonb_build_object(),'p2Buffs',jsonb_build_object(),'p1Cool',jsonb_build_object(),'p2Cool',jsonb_build_object(),'p1ActorIndex',0,'p2ActorIndex',0,'log',jsonb_build_array(),'rps',null,'status','active'));
 update public.event_matchmaking_queue set status='matched',match_id=mid where user_id in (me,opp.user_id);
 return jsonb_build_object('status','matched','match_id',mid);
end; $$;

create or replace function public.event_leave_matchmaking() returns void language sql security definer set search_path=public as $$
 delete from public.event_matchmaking_queue where user_id=auth.uid();
$$;

create or replace function public.event_submit_action(p_match_id uuid,p_state jsonb,p_expected_turn integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare m public.event_matches; expected_side text; me_side text;
begin
 select * into m from public.event_matches where id=p_match_id and (player1_id=auth.uid() or player2_id=auth.uid()) for update;
 if not found then raise exception 'Match not found'; end if;
 if m.status<>'active' then return false; end if;
 if coalesce((m.state->>'turn')::int,1)<>p_expected_turn then return false; end if;
 me_side:=case when m.player1_id=auth.uid() then 'p1' else 'p2' end;
 expected_side:=m.state->>'activeSide';
 if expected_side is not null and expected_side<>me_side then raise exception 'Not your turn'; end if;
 update public.event_matches set state=p_state,updated_at=now() where id=p_match_id;
 return true;
end; $$;

-- Called when a player confirms LEAVE during an active Player Match.
-- The remaining player wins by forfeit and receives half of the selected-energy reward.
create or replace function public.event_leave_match(p_match_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
 m public.event_matches;
 me uuid:=auth.uid(); winner uuid; leaver_payload jsonb; reward integer; winner_data jsonb; old_points bigint; new_points bigint; st jsonb;
begin
 select * into m from public.event_matches where id=p_match_id and (player1_id=me or player2_id=me) for update;
 if not found then raise exception 'Match not found'; end if;
 if m.status<>'active' then return jsonb_build_object('status',m.status); end if;
 winner:=case when m.player1_id=me then m.player2_id else m.player1_id end;
 leaver_payload:=case when m.player1_id=me then m.player1 else m.player2 end;
 reward:=floor((3210 + 1426*(greatest(1,least(10,coalesce((leaver_payload->>'energy')::int,1)))-1))/2);
 winner_data:=coalesce((select game_data from public.profiles where id=winner),'{}'::jsonb);
 old_points:=coalesce((winner_data->>'eventPoints')::bigint,0);
 new_points:=least(1000000,old_points+reward);
 winner_data:=jsonb_set(winner_data,'{eventPoints}',to_jsonb(new_points),true);
 update public.profiles set game_data=winner_data where id=winner;
 st:=coalesce(m.state,'{}'::jsonb)||jsonb_build_object('forfeit_by',me,'forfeit_winner',winner,'forfeit_points',reward,'status','forfeit');
 update public.event_matches set status='forfeit',winner_id=winner,state=st,updated_at=now() where id=p_match_id;
 delete from public.event_matchmaking_queue where user_id in (m.player1_id,m.player2_id);
 return jsonb_build_object('status','forfeit','winner_id',winner,'points',reward);
end; $$;

-- Top 100 by EVENT POINTS only. Level shown here is the event level (1-100).
create or replace function public.event_world_rank(p_limit integer default 100)
returns table(rank integer,id text,level integer,event_points bigint)
language sql security definer set search_path=public as $$
 with ranked as (
   select
     p.username::text as id,
     least(100,floor(greatest(0,coalesce((p.game_data->>'eventPoints')::bigint,0))/1000)::int+1) as level,
     greatest(0,coalesce((p.game_data->>'eventPoints')::bigint,0)) as event_points
   from public.profiles p
 )
 select row_number() over(order by r.event_points desc,r.id asc)::int,r.id,r.level,r.event_points
 from ranked r
 order by r.event_points desc,r.id asc
 limit greatest(1,least(100,coalesce(p_limit,100)));
$$;

-- Realtime (idempotent): only add a table when it is not already in the publication.
do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'event_matches'
    ) then
        alter publication supabase_realtime add table public.event_matches;
    end if;

    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'event_matchmaking_queue'
    ) then
        alter publication supabase_realtime add table public.event_matchmaking_queue;
    end if;
end $$;
