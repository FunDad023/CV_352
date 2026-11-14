-- Nhịp Cầu: run this schema in the Supabase SQL Editor.
-- Browser access is protected by RLS. Never add a service_role key to this app.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 48),
  avatar_url text,
  bio text not null default '' check (char_length(bio) <= 160),
  created_at timestamptz not null default now()
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friend_requests_not_self check (sender_id <> receiver_id)
);

-- Only one pending request can exist between a pair, regardless of direction.
create unique index if not exists friend_requests_one_pending_per_pair
  on public.friend_requests (least(sender_id, receiver_id), greatest(sender_id, receiver_id))
  where status = 'pending';
create index if not exists friend_requests_receiver_pending_idx
  on public.friend_requests (receiver_id, created_at desc) where status = 'pending';

create table if not exists public.friendships (
  user_low uuid not null references public.profiles (id) on delete cascade,
  user_high uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_low, user_high),
  constraint friendships_sorted_pair check (user_low < user_high)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_low uuid not null references public.profiles (id) on delete cascade,
  participant_high uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint conversations_sorted_pair check (participant_low < participant_high),
  constraint conversations_one_to_one_pair unique (participant_low, participant_high)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

-- Create a profile automatically whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  suffix text;
  chosen_name text;
begin
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', split_part(coalesce(new.email, ''), '@', 1)),
    '[^a-zA-Z0-9_]+', '', 'g'
  ));
  if char_length(base_username) < 3 then
    base_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  base_username := left(base_username, 24);
  candidate := base_username;
  chosen_name := left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), candidate), 48);
  if char_length(chosen_name) = 0 then chosen_name := candidate; end if;

  loop
    insert into public.profiles (id, username, display_name)
      values (new.id, candidate, chosen_name)
      on conflict (username) do nothing;
    if found then exit; end if;
    suffix := substr(md5(random()::text || clock_timestamp()::text), 1, 5);
    candidate := left(base_username, 18) || '_' || suffix;
    chosen_name := left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), candidate), 48);
  end loop;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep request identity fields immutable; receivers can only accept or decline pending requests.
create or replace function public.guard_friend_request_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.sender_id <> old.sender_id or new.receiver_id <> old.receiver_id or new.created_at <> old.created_at then
    raise exception 'Friend request participants and creation time cannot be changed';
  end if;
  if old.status <> 'pending' or new.status not in ('accepted', 'declined') then
    raise exception 'Only pending requests can be accepted or declined';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists friend_request_update_guard on public.friend_requests;
create trigger friend_request_update_guard
  before update on public.friend_requests
  for each row execute procedure public.guard_friend_request_update();

-- Accepted requests become a canonical (sorted) friendship row.
create or replace function public.create_friendship_on_accept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status = 'pending' then
    insert into public.friendships (user_low, user_high)
      values (least(new.sender_id, new.receiver_id), greatest(new.sender_id, new.receiver_id))
      on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists friend_request_accepted on public.friend_requests;
create trigger friend_request_accepted
  after update of status on public.friend_requests
  for each row execute procedure public.create_friendship_on_accept();

-- Backfill profiles for accounts that existed before this schema was installed.
insert into public.profiles (id, username, display_name)
select
  u.id,
  'user_' || substr(replace(u.id::text, '-', ''), 1, 12),
  left(coalesce(nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''), nullif(split_part(coalesce(u.email, ''), '@', 1), ''), 'Member'), 48)
from auth.users as u
left join public.profiles as p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Authenticated users can find profiles" on public.profiles;
create policy "Authenticated users can find profiles"
  on public.profiles for select to authenticated using (true);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "Participants can read friend requests" on public.friend_requests;
create policy "Participants can read friend requests"
  on public.friend_requests for select to authenticated
  using (sender_id = (select auth.uid()) or receiver_id = (select auth.uid()));
drop policy if exists "Users can send friend requests" on public.friend_requests;
create policy "Users can send friend requests"
  on public.friend_requests for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and sender_id <> receiver_id
    and not exists (
      select 1 from public.friendships f
      where f.user_low = least(sender_id, receiver_id)
        and f.user_high = greatest(sender_id, receiver_id)
    )
  );
drop policy if exists "Receivers can respond to friend requests" on public.friend_requests;
create policy "Receivers can respond to friend requests"
  on public.friend_requests for update to authenticated
  using (receiver_id = (select auth.uid()) and status = 'pending')
  with check (receiver_id = (select auth.uid()) and status in ('accepted', 'declined'));

drop policy if exists "Users can read their friendships" on public.friendships;
create policy "Users can read their friendships"
  on public.friendships for select to authenticated
  using (user_low = (select auth.uid()) or user_high = (select auth.uid()));
drop policy if exists "Friends can end a friendship" on public.friendships;
create policy "Friends can end a friendship"
  on public.friendships for delete to authenticated
  using (user_low = (select auth.uid()) or user_high = (select auth.uid()));

drop policy if exists "Participants can read conversations" on public.conversations;
create policy "Participants can read conversations"
  on public.conversations for select to authenticated
  using (participant_low = (select auth.uid()) or participant_high = (select auth.uid()));
drop policy if exists "Friends can create conversations" on public.conversations;
create policy "Friends can create conversations"
  on public.conversations for insert to authenticated
  with check (
    (participant_low = (select auth.uid()) or participant_high = (select auth.uid()))
    and exists (
      select 1 from public.friendships f
      where f.user_low = participant_low and f.user_high = participant_high
    )
  );

drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
  on public.messages for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.participant_low = (select auth.uid()) or c.participant_high = (select auth.uid()))
  ));
drop policy if exists "Participants can send their own messages" on public.messages;
create policy "Participants can send their own messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.participant_low = (select auth.uid()) or c.participant_high = (select auth.uid()))
    )
  );

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (username, display_name, avatar_url, bio) on public.profiles to authenticated;
grant select, insert on public.friend_requests to authenticated;
revoke update on public.friend_requests from authenticated;
grant update (status) on public.friend_requests to authenticated;
grant select, delete on public.friendships to authenticated;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;

-- Enable realtime message delivery when the standard Supabase publication exists.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
     ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
