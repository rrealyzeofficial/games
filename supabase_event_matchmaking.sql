
-- SHINE WITHOUT END: realtime event matchmaking
-- Run once in Supabase SQL Editor. This creates isolated tables/RPCs; it does not alter PLAY.
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
create policy event_queue_self on public.event_matchmaking_queue for select using (auth.uid()=user_id);
drop policy if exists event_match_participant_select on public.event_matches;
create policy event_match_participant_select on public.event_matches for select using (auth.uid()=player1_id or auth.uid()=player2_id);
drop policy if exists event_match_participant_update on public.event_matches;
create policy event_match_participant_update on public.event_matches for update using (auth.uid()=player1_id or auth.uid()=player2_id);
create or replace function public.event_join_matchmaking(p_song text,p_team jsonb,p_special text,p_energy integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare me uuid:=auth.uid(); myname text; opp record; mid uuid; myrow jsonb; opprow jsonb;
begin
 if me is null then raise exception 'Unauthorized'; end if;
 select username into myname from public.profiles where id=me;
 delete from public.event_matchmaking_queue where user_id=me;
 select * into opp from public.event_matchmaking_queue q where q.status='waiting' and q.song=p_song and q.user_id<>me order by q.joined_at for update skip locked limit 1;
 if opp.user_id is null then
   insert into public.event_matchmaking_queue(user_id,username,song,team,special,energy,status) values(me,coalesce(myname,'PLAYER'),p_song,p_team,p_special,p_energy,'waiting');
   return jsonb_build_object('status','waiting');
 end if;
 mid:=gen_random_uuid();
 myrow:=jsonb_build_object('username',coalesce(myname,'PLAYER'),'team',p_team,'special',p_special,'energy',p_energy);
 opprow:=jsonb_build_object('username',opp.username,'team',opp.team,'special',opp.special,'energy',opp.energy);
 insert into public.event_matches(id,song,player1_id,player2_id,player1,player2,state) values(mid,p_song,me,opp.user_id,myrow,opprow,jsonb_build_object('turn',1,'activeSide','you','points',jsonb_build_object('vocal',0,'rap',0,'act',0),'enemy',jsonb_build_object('vocal',0,'rap',0,'act',0),'specialEnergy',0,'enemySpecialEnergy',0,'log',jsonb_build_array()));
 update public.event_matchmaking_queue set status='matched',match_id=mid where user_id in (me,opp.user_id);
 return jsonb_build_object('status','matched','match_id',mid);
end; $$;
create or replace function public.event_leave_matchmaking() returns void language sql security definer set search_path=public as $$ delete from public.event_matchmaking_queue where user_id=auth.uid(); $$;
create or replace function public.event_submit_action(p_match_id uuid,p_state jsonb,p_expected_turn integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare m public.event_matches;
begin
 select * into m from public.event_matches where id=p_match_id and (player1_id=auth.uid() or player2_id=auth.uid()) for update;
 if not found then raise exception 'Match not found'; end if;
 if coalesce((m.state->>'turn')::int,1)<>p_expected_turn then return false; end if;
 update public.event_matches set state=p_state,updated_at=now() where id=p_match_id;
 return true;
end; $$;
-- Realtime: add these tables to the publication if not already present.
alter publication supabase_realtime add table public.event_matches;
alter publication supabase_realtime add table public.event_matchmaking_queue;
