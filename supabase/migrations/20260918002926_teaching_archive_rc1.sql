-- The core tables were provisioned outside git in the ministry-archive conversation.
-- Capture the subset used by RC1 so this migration also works on a fresh database.
create table if not exists public.preaching_messages (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null, message_type text not null default 'sermon', status text not null default 'idea',
 series_name text, primary_book text, primary_chapter integer, primary_reference text, main_subject text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.preaching_locations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null, city text, state_region text, notes text, created_at timestamptz not null default now()
);
create table if not exists public.preaching_message_versions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 message_id uuid not null references public.preaching_messages(id) on delete cascade, version_number integer not null,
 version_label text, introduction text, outline text, manuscript text, conclusion text, application text,
 preparation_notes text, change_summary text, is_current boolean not null default false,
 created_at timestamptz not null default now(), unique(message_id, version_number)
);
create table if not exists public.preaching_events (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 message_id uuid not null references public.preaching_messages(id) on delete cascade,
 prepared_version_id uuid references public.preaching_message_versions(id) on delete set null,
 location_id uuid references public.preaching_locations(id) on delete set null,
 preached_at timestamptz not null, service_type text, audience_label text, duration_minutes integer,
 prepared_snapshot jsonb not null default '{}'::jsonb, delivered_notes text, delivered_transcript text,
 spontaneous_additions text, scriptures_added_live text, what_connected text, questions_asked text,
 needs_more_study text, change_next_time text, notable_results text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.preaching_messages enable row level security;
alter table public.preaching_locations enable row level security;
alter table public.preaching_message_versions enable row level security;
alter table public.preaching_events enable row level security;
-- Restrictive policies also constrain any pre-existing permissive policies.
create policy teaching_messages_owner_guard on public.preaching_messages as restrictive for all to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy teaching_messages_read on public.preaching_messages for select to authenticated using ((select auth.uid()) = user_id);
create policy teaching_messages_insert on public.preaching_messages for insert to authenticated with check ((select auth.uid()) = user_id);
create policy teaching_events_owner_guard on public.preaching_events as restrictive for all to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and
 exists(select 1 from public.preaching_messages m where m.id = message_id and m.user_id = (select auth.uid())) and
 (prepared_version_id is null or exists(select 1 from public.preaching_message_versions v where v.id = prepared_version_id and v.user_id = (select auth.uid()) and v.message_id = preaching_events.message_id)) and
 (location_id is null or exists(select 1 from public.preaching_locations l where l.id = location_id and l.user_id = (select auth.uid()))));
create policy teaching_events_read on public.preaching_events for select to authenticated using ((select auth.uid()) = user_id);
create policy teaching_events_insert on public.preaching_events for insert to authenticated with check ((select auth.uid()) = user_id);
revoke all on public.preaching_events from anon, authenticated;
grant select, insert on public.preaching_events to authenticated;
revoke all on public.preaching_messages from anon;
grant select, insert on public.preaching_messages to authenticated;
-- No fresh-database access to unused location/version editing until that UI is implemented.
revoke all on public.preaching_locations, public.preaching_message_versions from anon;
grant select on public.preaching_locations, public.preaching_message_versions to authenticated;
create index if not exists preaching_events_owner_page on public.preaching_events(user_id, id);
create index if not exists preaching_messages_owner_page on public.preaching_messages(user_id, id);
create unique index teaching_event_occasion on public.preaching_events
 (user_id, (prepared_snapshot#>>'{snapshot,id}'), (prepared_snapshot#>>'{delivery,date}'), (prepared_snapshot#>>'{delivery,location}'))
 where prepared_snapshot->>'schemaVersion' = '1';
create unique index if not exists preaching_events_id_owner on public.preaching_events(id, user_id);

create table public.preaching_event_addenda (
 id uuid primary key, user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 event_id uuid not null, created_at timestamptz not null, body text not null check(length(btrim(body)) > 0),
 foreign key(event_id, user_id) references public.preaching_events(id, user_id)
);
alter table public.preaching_event_addenda enable row level security;
revoke all on public.preaching_event_addenda from anon, authenticated;
grant select, insert on public.preaching_event_addenda to authenticated;
create policy teaching_addenda_read on public.preaching_event_addenda for select to authenticated using ((select auth.uid()) = user_id);
create policy teaching_addenda_insert on public.preaching_event_addenda for insert to authenticated with check ((select auth.uid()) = user_id);
create index preaching_addenda_owner_page on public.preaching_event_addenda(user_id, id);
create index preaching_addenda_event on public.preaching_event_addenda(event_id, user_id);

create function public.protect_teaching_history() returns trigger language plpgsql set search_path = '' as $$
begin
 raise exception 'Teaching history is immutable. Create a revised copy or append a delivery note.' using errcode = '23514';
end $$;
create trigger teaching_event_immutable before update or delete on public.preaching_events
 for each row execute function public.protect_teaching_history();
create trigger teaching_addendum_immutable before update or delete on public.preaching_event_addenda
 for each row execute function public.protect_teaching_history();
revoke all on function public.protect_teaching_history() from public, anon, authenticated;

-- Invoker rights preserve RLS; one atomic transaction creates master identity + event.
create function public.record_teaching_archive_event(record jsonb) returns uuid
 language plpgsql security invoker set search_path = '' as $$
declare
 owner_id uuid := auth.uid(); event_id uuid := (record->>'id')::uuid;
 master_id uuid := (record->>'messageId')::uuid; previous jsonb; source_id uuid;
begin
 if owner_id is null then raise exception 'Sign in required' using errcode = '42501'; end if;
 if record->>'schemaVersion' is distinct from '1' or jsonb_typeof(record->'snapshot') is distinct from 'object'
 or jsonb_typeof(record->'delivery') is distinct from 'object'
 or coalesce(btrim(record#>>'{snapshot,title}'),'') = ''
 or coalesce(btrim(record#>>'{delivery,location}'),'') = ''
 or coalesce(record#>>'{delivery,date}','') !~ '^\d{4}-\d{2}-\d{2}$'
 or jsonb_typeof(record#>'{snapshot,slides}') is distinct from 'array'
 or event_id is null or master_id is null
 then raise exception 'Invalid teaching archive event' using errcode = '23514'; end if;
 perform (record#>>'{delivery,date}')::date;
 -- Serialize retries of the same event across devices; differing content never wins.
 perform pg_advisory_xact_lock(hashtextextended(event_id::text, 0));
 select prepared_snapshot into previous from public.preaching_events where id = event_id and user_id = owner_id;
 if found then
   if previous is distinct from record then raise exception 'Historical record conflict' using errcode = '23514'; end if;
   return event_id;
 end if;
 source_id := (record->>'sourceEventId')::uuid;
 if source_id is not null and not exists(select 1 from public.preaching_events where id=source_id and user_id=owner_id and message_id=master_id) then
   raise exception 'Source event must belong to this owner and message' using errcode = '23514';
 end if;
 insert into public.preaching_messages(id,user_id,title,message_type,primary_reference,main_subject)
 values(master_id,owner_id,record#>>'{snapshot,title}',lower(record#>>'{snapshot,kind}'),record#>>'{snapshot,passage}',record#>>'{snapshot,theme}')
 on conflict(id) do nothing;
 if not exists(select 1 from public.preaching_messages where id=master_id and user_id=owner_id) then
   raise exception 'Message ownership mismatch' using errcode = '42501';
 end if;
 insert into public.preaching_events(id,user_id,message_id,preached_at,audience_label,service_type,prepared_snapshot,delivered_notes,change_next_time)
 values(event_id,owner_id,master_id,((record#>>'{delivery,date}') || 'T12:00:00Z')::timestamptz,
 record#>>'{delivery,audience}',record#>>'{snapshot,service}',record,record#>>'{delivery,deliveredNotes}',record#>>'{delivery,reflection}');
 return event_id;
end $$;
revoke all on function public.record_teaching_archive_event(jsonb) from public, anon;
grant execute on function public.record_teaching_archive_event(jsonb) to authenticated;

create function public.append_teaching_delivery_note(note jsonb) returns uuid
 language plpgsql security invoker set search_path = '' as $$
declare owner_id uuid := auth.uid(); note_id uuid := (note->>'id')::uuid; previous public.preaching_event_addenda;
begin
 if owner_id is null then raise exception 'Sign in required' using errcode = '42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(note_id::text, 0));
 select * into previous from public.preaching_event_addenda where id=note_id and user_id=owner_id;
 if found then
   if previous.event_id is distinct from (note->>'eventId')::uuid or previous.body is distinct from note->>'body'
      or previous.created_at is distinct from (note->>'createdAt')::timestamptz then
     raise exception 'Historical note conflict' using errcode = '23514';
   end if;
   return note_id;
 end if;
 insert into public.preaching_event_addenda(id,user_id,event_id,created_at,body)
 values(note_id,owner_id,(note->>'eventId')::uuid,(note->>'createdAt')::timestamptz,note->>'body');
 return note_id;
end $$;
revoke all on function public.append_teaching_delivery_note(jsonb) from public, anon;
grant execute on function public.append_teaching_delivery_note(jsonb) to authenticated;
