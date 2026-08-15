create extension if not exists pgcrypto;

create table if not exists public.resource_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  author text,
  year integer,
  source_url text,
  copyright_status text not null,
  commercial_use_notes text,
  attribution_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.library_resources (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.resource_sources(id),
  title text not null,
  author text not null,
  year integer,
  category text not null,
  source_url text not null,
  download_url text,
  source_license_url text,
  file_path text not null unique,
  public_domain_status text not null,
  commercial_use_status text not null,
  attribution_required boolean not null default true,
  rights_basis text not null,
  notes text,
  import_status text not null,
  word_count integer,
  file_size_bytes integer,
  checksum_sha256 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (title, author, source_url)
);

create table if not exists public.bible_books (
  id smallint primary key,
  name text not null unique,
  testament text not null check (testament in ('old', 'new')),
  sort_order smallint not null unique,
  source_id uuid references public.resource_sources(id)
);

create table if not exists public.bible_chapters (
  id uuid primary key default gen_random_uuid(),
  book_id smallint not null references public.bible_books(id) on delete cascade,
  chapter_number smallint not null check (chapter_number > 0),
  source_id uuid references public.resource_sources(id),
  unique (book_id, chapter_number)
);

create table if not exists public.bible_verses (
  id uuid primary key default gen_random_uuid(),
  book_id smallint not null references public.bible_books(id) on delete cascade,
  chapter_number smallint not null check (chapter_number > 0),
  verse_number smallint not null check (verse_number > 0),
  verse_ref text not null unique,
  text text not null,
  search_vector tsvector generated always as (to_tsvector('english', text)) stored,
  source_id uuid references public.resource_sources(id),
  unique (book_id, chapter_number, verse_number)
);

create index if not exists bible_verses_ref_idx on public.bible_verses (verse_ref);
create index if not exists library_resources_category_idx on public.library_resources (category);
create index if not exists library_resources_source_id_idx on public.library_resources (source_id);
create index if not exists library_resources_import_status_idx on public.library_resources (import_status);
create index if not exists bible_verses_book_chapter_idx on public.bible_verses (book_id, chapter_number, verse_number);
create index if not exists bible_verses_search_idx on public.bible_verses using gin (search_vector);
create index if not exists bible_books_source_id_idx on public.bible_books (source_id);
create index if not exists bible_chapters_source_id_idx on public.bible_chapters (source_id);
create index if not exists bible_verses_source_id_idx on public.bible_verses (source_id);

alter table public.library_resources
  add column if not exists resource_status text not null default 'Verified'
    check (resource_status in ('Verified', 'Needs Review', 'Do Not Import', 'Permission Needed', 'Personal Use Only'));

alter table public.library_resources
  add column if not exists rights_notes text;

alter table public.library_resources
  add column if not exists doctrinal_review_status text not null default 'needs review';

alter table public.library_resources
  add column if not exists doctrinal_notes text;

alter table public.library_resources
  add column if not exists warning_labels text[] not null default '{}'::text[];

alter table public.library_resources
  add column if not exists recommended_use text;

alter table public.library_resources
  add column if not exists perspective_notes text;

create table if not exists public.dictionary_entries (
  id uuid primary key default gen_random_uuid(),
  headword text not null,
  normalized_headword text not null,
  definition text not null,
  source_id uuid references public.resource_sources(id),
  search_vector tsvector generated always as (to_tsvector('english', headword || ' ' || definition)) stored,
  unique (normalized_headword, definition)
);

create index if not exists dictionary_entries_headword_idx on public.dictionary_entries (normalized_headword);
create index if not exists dictionary_entries_search_idx on public.dictionary_entries using gin (search_vector);
create index if not exists dictionary_entries_source_id_idx on public.dictionary_entries (source_id);

create table if not exists public.cross_references (
  id uuid primary key default gen_random_uuid(),
  verse_ref text not null,
  target_ref text not null,
  label text,
  source text not null default 'TSK placeholder',
  source_id uuid,
  created_at timestamptz not null default now(),
  unique (verse_ref, target_ref, source)
);

create index if not exists cross_references_verse_ref_idx on public.cross_references (verse_ref);
create index if not exists cross_references_source_id_idx on public.cross_references (source_id);

create table if not exists public.commentary_entries (
  id uuid primary key default gen_random_uuid(),
  source_id uuid,
  book text not null,
  chapter integer not null check (chapter > 0),
  verse_start integer not null check (verse_start > 0),
  verse_end integer not null check (verse_end >= verse_start),
  author text not null,
  resource_title text not null,
  source_title text,
  entry_text text not null,
  public_domain_status text not null,
  rights_basis text,
  recommended_use text,
  source_url text,
  created_at timestamptz not null default now(),
  unique (book, chapter, verse_start, verse_end, author, resource_title)
);

create index if not exists commentary_entries_lookup_idx
  on public.commentary_entries (book, chapter, verse_start, verse_end);
create index if not exists commentary_entries_source_id_idx on public.commentary_entries (source_id);
create unique index if not exists commentary_entries_unique_source_idx
  on public.commentary_entries (book, chapter, verse_start, verse_end, author, resource_title);

create table if not exists public.user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  verse_ref text not null,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_notes_user_ref_idx on public.user_notes (user_id, verse_ref);

create table if not exists public.user_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  verse_ref text not null,
  color text not null default 'gold',
  created_at timestamptz not null default now(),
  unique (user_id, verse_ref)
);

create index if not exists user_highlights_user_ref_idx on public.user_highlights (user_id, verse_ref);

create table if not exists public.user_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  verse_ref text not null,
  created_at timestamptz not null default now(),
  unique (user_id, verse_ref)
);

create index if not exists user_bookmarks_user_ref_idx on public.user_bookmarks (user_id, verse_ref);

create table if not exists public.user_library_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resource_slug text not null,
  title text not null,
  author text not null,
  progress numeric not null default 0 check (progress >= 0 and progress <= 100),
  font_size integer not null default 18 check (font_size between 12 and 32),
  line_spacing numeric not null default 1.65 check (line_spacing between 1 and 3),
  reading_width text not null default 'comfortable',
  theme text not null default 'sepia',
  bookmarks jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, resource_slug)
);

create index if not exists user_library_progress_user_slug_idx on public.user_library_progress (user_id, resource_slug);

create table if not exists public.user_completed_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resource_slug text not null,
  title text not null,
  author text not null,
  completed_at timestamptz not null default now(),
  unique (user_id, resource_slug)
);

create index if not exists user_completed_resources_user_slug_idx on public.user_completed_resources (user_id, resource_slug);

create table if not exists public.user_library_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resource_slug text not null check (length(trim(resource_slug)) between 1 and 240),
  is_favorite boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id, resource_slug)
);

create or replace function public.keep_newest_library_favorite_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.updated_at > new.updated_at then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.keep_newest_library_favorite_update() from public;

drop trigger if exists keep_newest_library_favorite_update on public.user_library_favorites;
create trigger keep_newest_library_favorite_update
  before update on public.user_library_favorites
  for each row execute function public.keep_newest_library_favorite_update();

create table if not exists public.user_listening_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resource_slug text not null,
  title text not null,
  author text not null,
  progress numeric not null default 0 check (progress >= 0 and progress <= 100),
  rate numeric not null default 1 check (rate >= 0.5 and rate <= 3),
  updated_at timestamptz not null default now(),
  unique (user_id, resource_slug)
);

create index if not exists user_listening_progress_user_slug_idx on public.user_listening_progress (user_id, resource_slug);

create table if not exists public.user_bible_listening_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  target_id text not null,
  label text not null,
  book text not null,
  chapter integer not null check (chapter > 0),
  verse_ref text,
  progress numeric not null default 0 check (progress >= 0 and progress <= 100),
  updated_at timestamptz not null default now(),
  unique (user_id, target_id)
);

create index if not exists user_bible_listening_progress_user_target_idx
  on public.user_bible_listening_progress (user_id, target_id);

create table if not exists public.user_bible_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book text not null,
  read_chapters integer[] not null default '{}'::integer[],
  listened_chapters integer[] not null default '{}'::integer[],
  updated_at timestamptz not null default now(),
  unique (user_id, book)
);

create index if not exists user_bible_mastery_user_book_idx on public.user_bible_mastery (user_id, book);

create table if not exists public.user_scripture_memory (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  verse_ref text not null,
  verse_text text not null,
  progress numeric not null default 0 check (progress >= 0 and progress <= 100),
  repetitions integer not null default 0 check (repetitions >= 0),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, verse_ref)
);

create index if not exists user_scripture_memory_user_ref_idx on public.user_scripture_memory (user_id, verse_ref);

create table if not exists public.user_study_playlists (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  completed_item_ids text[] not null default '{}'::text[],
  completed_at timestamptz,
  last_item_index integer not null default 0 check (last_item_index >= 0),
  repeat_playlist boolean not null default false,
  repeat_item boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists user_study_playlists_user_updated_idx
  on public.user_study_playlists (user_id, updated_at desc);

create table if not exists public.user_study_playlist_items (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  playlist_id text not null,
  item_type text not null,
  label text not null,
  book text,
  chapter integer,
  chapter_end integer,
  verse_start integer,
  verse_end integer,
  resource_title text,
  resource_slug text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, playlist_id) references public.user_study_playlists(user_id, id) on delete cascade
);

create index if not exists user_study_playlist_items_user_playlist_idx
  on public.user_study_playlist_items (user_id, playlist_id, position);

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  passage_or_resource text,
  category text not null default 'General',
  message text not null check (length(trim(message)) > 0),
  optional_email text,
  created_at timestamptz not null default now()
);

create index if not exists beta_feedback_created_idx on public.beta_feedback (created_at desc);
create index if not exists beta_feedback_user_idx on public.beta_feedback (user_id, created_at desc);

create table if not exists public.strongs_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  year integer,
  source_url text not null,
  rights_status text not null,
  commercial_use_notes text not null,
  attribution_notes text,
  review_status text not null default 'Needs Review'
    check (review_status in ('Verified', 'Needs Review', 'Permission Needed', 'Do Not Import')),
  created_at timestamptz not null default now(),
  unique (title, source_url)
);

create table if not exists public.strongs_entries (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.strongs_sources(id),
  strongs_number text not null,
  language text not null check (language in ('Greek', 'Hebrew', 'Aramaic')),
  original_word text not null,
  transliteration text,
  pronunciation text,
  english_words text[] not null default '{}'::text[],
  root text,
  related_numbers text[] not null default '{}'::text[],
  plain_definition text not null,
  first_occurrence text,
  key_verses text[] not null default '{}'::text[],
  source_url text,
  rights_status text not null,
  review_status text not null default 'Needs Review'
    check (review_status in ('Verified', 'Needs Review', 'Permission Needed', 'Do Not Import')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists strongs_entries_unique_source_idx
  on public.strongs_entries (strongs_number, coalesce(source_id, '00000000-0000-0000-0000-000000000000'::uuid));
create unique index if not exists strongs_entries_unique_source_id_idx
  on public.strongs_entries (strongs_number, source_id);
create index if not exists strongs_entries_number_idx on public.strongs_entries (strongs_number);
create index if not exists strongs_entries_language_idx on public.strongs_entries (language);
create index if not exists strongs_entries_english_words_idx on public.strongs_entries using gin (english_words);
create index if not exists strongs_entries_source_id_idx on public.strongs_entries (source_id);

create table if not exists public.user_personal_library_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  author text,
  category text not null default 'Personal Library',
  original_filename text,
  file_type text not null check (file_type in ('txt', 'epub', 'pdf', 'docx')),
  storage_path text,
  import_status text not null default 'Personal Use Only'
    check (import_status in ('Personal Use Only', 'Needs Review', 'Do Not Import')),
  visibility text not null default 'private' check (visibility = 'private'),
  rights_notes text not null default 'Personal-use upload only. Do not publish globally without documented permission or public-domain verification.',
  doctrinal_notes text,
  warning_labels text[] not null default array['Personal use only'],
  recommended_use text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_personal_library_resources_user_idx
  on public.user_personal_library_resources (user_id, updated_at desc);

create table if not exists public.user_resource_permission_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  author text,
  owner text,
  source_url text,
  requested_use text not null,
  status text not null default 'Permission Needed'
    check (status in ('Permission Needed', 'Needs Review', 'Verified', 'Do Not Import')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_resource_permission_requests_user_idx
  on public.user_resource_permission_requests (user_id, updated_at desc);

create table if not exists public.presentation_sessions (
  session_id text primary key,
  presentation_id text,
  current_slide_index integer not null default 0 check (current_slide_index >= 0),
  is_blank boolean not null default false,
  is_active boolean not null default true,
  presenter_user_id uuid references auth.users(id) on delete set null,
  control_mode text not null default 'open' check (control_mode in ('open', 'approval')),
  controller_lock boolean not null default false,
  controllers jsonb not null default '[]'::jsonb,
  last_controller_id text,
  display_last_seen_at timestamptz,
  expires_at timestamptz not null default (now() + interval '4 hours'),
  title text not null default 'Presentation',
  theme_id text not null default 'warm-bible-study',
  slides jsonb not null default '[]'::jsonb,
  target_minutes integer not null default 30 check (target_minutes > 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists presentation_sessions_active_idx
  on public.presentation_sessions (session_id, is_active, expires_at, updated_at desc);

create index if not exists presentation_sessions_presenter_user_idx
  on public.presentation_sessions (presenter_user_id)
  where presenter_user_id is not null;

alter table public.presentation_sessions
  add column if not exists control_mode text not null default 'open',
  add column if not exists controller_lock boolean not null default false,
  add column if not exists controllers jsonb not null default '[]'::jsonb,
  add column if not exists last_controller_id text,
  add column if not exists display_last_seen_at timestamptz,
  add column if not exists expires_at timestamptz not null default (now() + interval '4 hours');

alter table public.presentation_sessions
  drop constraint if exists presentation_sessions_control_mode_check;

alter table public.presentation_sessions
  add constraint presentation_sessions_control_mode_check
  check (control_mode in ('open', 'approval'));

create table if not exists public.presentation_session_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.presentation_sessions(session_id) on delete cascade,
  event_type text not null check (event_type in ('start', 'join', 'display_join', 'next', 'previous', 'jump', 'first', 'last', 'blank', 'unblank', 'end', 'refresh', 'approve_controller', 'lock_controller', 'unlock_controller', 'restart_timer', 'expire')),
  slide_index integer,
  is_blank boolean,
  created_by uuid references auth.users(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists presentation_session_events_session_idx
  on public.presentation_session_events (session_id, created_at desc);

create index if not exists presentation_session_events_created_by_idx
  on public.presentation_session_events (created_by)
  where created_by is not null;

create table if not exists public.user_roles (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index if not exists user_roles_user_role_idx
  on public.user_roles (user_id, role);

create table if not exists public.admin_acquisition_records (
  id uuid primary key default gen_random_uuid(),
  record_type text not null check (record_type in ('author', 'book', 'rights_holder', 'licensed_rights', 'media_intake', 'audiobook_pilot')),
  record_key text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (record_type, record_key)
);

create index if not exists admin_acquisition_records_type_idx
  on public.admin_acquisition_records (record_type, record_key);

alter table public.presentation_session_events
  drop constraint if exists presentation_session_events_event_type_check;

alter table public.presentation_session_events
  add constraint presentation_session_events_event_type_check
  check (event_type in ('start', 'join', 'display_join', 'next', 'previous', 'jump', 'first', 'last', 'blank', 'unblank', 'end', 'refresh', 'approve_controller', 'lock_controller', 'unlock_controller', 'restart_timer', 'expire'));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'presentation_sessions'
    ) then
      alter publication supabase_realtime add table public.presentation_sessions;
    end if;
  end if;
end $$;

alter table public.resource_sources enable row level security;
alter table public.library_resources enable row level security;
alter table public.bible_books enable row level security;
alter table public.bible_chapters enable row level security;
alter table public.bible_verses enable row level security;
alter table public.dictionary_entries enable row level security;
alter table public.cross_references enable row level security;
alter table public.commentary_entries enable row level security;
alter table public.user_notes enable row level security;
alter table public.user_highlights enable row level security;
alter table public.user_bookmarks enable row level security;
alter table public.user_library_progress enable row level security;
alter table public.user_completed_resources enable row level security;
alter table public.user_library_favorites enable row level security;
alter table public.user_listening_progress enable row level security;
alter table public.user_bible_listening_progress enable row level security;
alter table public.user_bible_mastery enable row level security;
alter table public.user_scripture_memory enable row level security;
alter table public.user_study_playlists enable row level security;
alter table public.user_study_playlist_items enable row level security;
alter table public.beta_feedback enable row level security;
alter table public.strongs_sources enable row level security;
alter table public.strongs_entries enable row level security;
alter table public.user_personal_library_resources enable row level security;
alter table public.user_resource_permission_requests enable row level security;
alter table public.presentation_sessions enable row level security;
alter table public.presentation_session_events enable row level security;
alter table public.user_roles enable row level security;
alter table public.admin_acquisition_records enable row level security;

drop policy if exists "Public sources are readable" on public.resource_sources;
drop policy if exists "Library resources are readable" on public.library_resources;
drop policy if exists "Bible books are readable" on public.bible_books;
drop policy if exists "Bible chapters are readable" on public.bible_chapters;
drop policy if exists "Bible verses are readable" on public.bible_verses;
drop policy if exists "Dictionary entries are readable" on public.dictionary_entries;
drop policy if exists "Cross references are readable" on public.cross_references;
drop policy if exists "Commentary entries are readable" on public.commentary_entries;
drop policy if exists "Users can read their notes" on public.user_notes;
drop policy if exists "Users can create their notes" on public.user_notes;
drop policy if exists "Users can update their notes" on public.user_notes;
drop policy if exists "Users can delete their notes" on public.user_notes;
drop policy if exists "Users can read their highlights" on public.user_highlights;
drop policy if exists "Users can create their highlights" on public.user_highlights;
drop policy if exists "Users can update their highlights" on public.user_highlights;
drop policy if exists "Users can delete their highlights" on public.user_highlights;
drop policy if exists "Users can read their bookmarks" on public.user_bookmarks;
drop policy if exists "Users can create their bookmarks" on public.user_bookmarks;
drop policy if exists "Users can update their bookmarks" on public.user_bookmarks;
drop policy if exists "Users can delete their bookmarks" on public.user_bookmarks;
drop policy if exists "Users can read their library progress" on public.user_library_progress;
drop policy if exists "Users can create their library progress" on public.user_library_progress;
drop policy if exists "Users can update their library progress" on public.user_library_progress;
drop policy if exists "Users can delete their library progress" on public.user_library_progress;
drop policy if exists "Users can read their completed resources" on public.user_completed_resources;
drop policy if exists "Users can create their completed resources" on public.user_completed_resources;
drop policy if exists "Users can update their completed resources" on public.user_completed_resources;
drop policy if exists "Users can delete their completed resources" on public.user_completed_resources;
drop policy if exists "Users can read their library favorites" on public.user_library_favorites;
drop policy if exists "Users can create their library favorites" on public.user_library_favorites;
drop policy if exists "Users can update their library favorites" on public.user_library_favorites;
drop policy if exists "Users can delete their library favorites" on public.user_library_favorites;
drop policy if exists "Users can read their listening progress" on public.user_listening_progress;
drop policy if exists "Users can create their listening progress" on public.user_listening_progress;
drop policy if exists "Users can update their listening progress" on public.user_listening_progress;
drop policy if exists "Users can delete their listening progress" on public.user_listening_progress;
drop policy if exists "Users can read their Bible listening progress" on public.user_bible_listening_progress;
drop policy if exists "Users can create their Bible listening progress" on public.user_bible_listening_progress;
drop policy if exists "Users can update their Bible listening progress" on public.user_bible_listening_progress;
drop policy if exists "Users can delete their Bible listening progress" on public.user_bible_listening_progress;
drop policy if exists "Users can read their Bible mastery" on public.user_bible_mastery;
drop policy if exists "Users can create their Bible mastery" on public.user_bible_mastery;
drop policy if exists "Users can update their Bible mastery" on public.user_bible_mastery;
drop policy if exists "Users can delete their Bible mastery" on public.user_bible_mastery;
drop policy if exists "Users can read their scripture memory" on public.user_scripture_memory;
drop policy if exists "Users can create their scripture memory" on public.user_scripture_memory;
drop policy if exists "Users can update their scripture memory" on public.user_scripture_memory;
drop policy if exists "Users can delete their scripture memory" on public.user_scripture_memory;
drop policy if exists "Users can read their study playlists" on public.user_study_playlists;
drop policy if exists "Users can create their study playlists" on public.user_study_playlists;
drop policy if exists "Users can update their study playlists" on public.user_study_playlists;
drop policy if exists "Users can delete their study playlists" on public.user_study_playlists;
drop policy if exists "Users can read their study playlist items" on public.user_study_playlist_items;
drop policy if exists "Users can create their study playlist items" on public.user_study_playlist_items;
drop policy if exists "Users can update their study playlist items" on public.user_study_playlist_items;
drop policy if exists "Users can delete their study playlist items" on public.user_study_playlist_items;
drop policy if exists "Anyone can create beta feedback" on public.beta_feedback;
drop policy if exists "Strong sources are readable" on public.strongs_sources;
drop policy if exists "Strong entries are readable" on public.strongs_entries;
drop policy if exists "Users can read their personal library resources" on public.user_personal_library_resources;
drop policy if exists "Users can create their personal library resources" on public.user_personal_library_resources;
drop policy if exists "Users can update their personal library resources" on public.user_personal_library_resources;
drop policy if exists "Users can delete their personal library resources" on public.user_personal_library_resources;
drop policy if exists "Users can read their permission requests" on public.user_resource_permission_requests;
drop policy if exists "Users can create their permission requests" on public.user_resource_permission_requests;
drop policy if exists "Users can update their permission requests" on public.user_resource_permission_requests;
drop policy if exists "Users can delete their permission requests" on public.user_resource_permission_requests;
drop policy if exists "Presentation sessions are joinable by code" on public.presentation_sessions;
drop policy if exists "Presentation sessions can be started" on public.presentation_sessions;
drop policy if exists "Presentation sessions can be controlled by code" on public.presentation_sessions;
drop policy if exists "Presentation events are readable" on public.presentation_session_events;
drop policy if exists "Presentation events can be created" on public.presentation_session_events;
drop policy if exists "Users can read their own roles" on public.user_roles;
drop policy if exists "Admins can read acquisition records" on public.admin_acquisition_records;
drop policy if exists "Admins can manage acquisition records" on public.admin_acquisition_records;

create policy "Public sources are readable"
  on public.resource_sources for select
  using (true);

create policy "Library resources are readable"
  on public.library_resources for select
  using (true);

create policy "Bible books are readable"
  on public.bible_books for select
  using (true);

create policy "Bible chapters are readable"
  on public.bible_chapters for select
  using (true);

create policy "Bible verses are readable"
  on public.bible_verses for select
  using (true);

create policy "Dictionary entries are readable"
  on public.dictionary_entries for select
  using (true);

create policy "Cross references are readable"
  on public.cross_references for select
  using (true);

create policy "Commentary entries are readable"
  on public.commentary_entries for select
  using (true);

create policy "Users can read their notes"
  on public.user_notes for select
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their notes"
  on public.user_notes for insert
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their notes"
  on public.user_notes for update
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their notes"
  on public.user_notes for delete
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can read their highlights"
  on public.user_highlights for select
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their highlights"
  on public.user_highlights for insert
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their highlights"
  on public.user_highlights for update
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their highlights"
  on public.user_highlights for delete
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can read their bookmarks"
  on public.user_bookmarks for select
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their bookmarks"
  on public.user_bookmarks for insert
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their bookmarks"
  on public.user_bookmarks for update
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their bookmarks"
  on public.user_bookmarks for delete
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can read their library progress"
  on public.user_library_progress for select
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their library progress"
  on public.user_library_progress for insert
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their library progress"
  on public.user_library_progress for update
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their library progress"
  on public.user_library_progress for delete
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can read their completed resources"
  on public.user_completed_resources for select
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their completed resources"
  on public.user_completed_resources for insert
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their completed resources"
  on public.user_completed_resources for update
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their completed resources"
  on public.user_completed_resources for delete
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can read their library favorites"
  on public.user_library_favorites for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their library favorites"
  on public.user_library_favorites for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their library favorites"
  on public.user_library_favorites for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their library favorites"
  on public.user_library_favorites for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can read their listening progress"
  on public.user_listening_progress for select
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their listening progress"
  on public.user_listening_progress for insert
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their listening progress"
  on public.user_listening_progress for update
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their listening progress"
  on public.user_listening_progress for delete
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can read their Bible listening progress"
  on public.user_bible_listening_progress for select
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their Bible listening progress"
  on public.user_bible_listening_progress for insert
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their Bible listening progress"
  on public.user_bible_listening_progress for update
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their Bible listening progress"
  on public.user_bible_listening_progress for delete
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can read their Bible mastery"
  on public.user_bible_mastery for select
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their Bible mastery"
  on public.user_bible_mastery for insert
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their Bible mastery"
  on public.user_bible_mastery for update
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their Bible mastery"
  on public.user_bible_mastery for delete
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can read their scripture memory"
  on public.user_scripture_memory for select
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their scripture memory"
  on public.user_scripture_memory for insert
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their scripture memory"
  on public.user_scripture_memory for update
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their scripture memory"
  on public.user_scripture_memory for delete
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can read their study playlists"
  on public.user_study_playlists for select
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their study playlists"
  on public.user_study_playlists for insert
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their study playlists"
  on public.user_study_playlists for update
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their study playlists"
  on public.user_study_playlists for delete
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can read their study playlist items"
  on public.user_study_playlist_items for select
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their study playlist items"
  on public.user_study_playlist_items for insert
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their study playlist items"
  on public.user_study_playlist_items for update
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their study playlist items"
  on public.user_study_playlist_items for delete
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Anyone can create beta feedback"
  on public.beta_feedback for insert
  with check (
    length(trim(message)) > 0
    and length(message) <= 5000
    and category in (
      'General',
      'Bible Reader',
      'Study Drawer',
      'Library',
      'Listening',
      'Commentary',
      'Search',
      'Mobile Layout',
      'Bug',
      'Feature Request'
    )
  );

create policy "Strong sources are readable"
  on public.strongs_sources for select
  using (true);

create policy "Strong entries are readable"
  on public.strongs_entries for select
  using (review_status = 'Verified');

create policy "Users can read their personal library resources"
  on public.user_personal_library_resources for select
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their personal library resources"
  on public.user_personal_library_resources for insert
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their personal library resources"
  on public.user_personal_library_resources for update
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their personal library resources"
  on public.user_personal_library_resources for delete
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can read their permission requests"
  on public.user_resource_permission_requests for select
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their permission requests"
  on public.user_resource_permission_requests for insert
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their permission requests"
  on public.user_resource_permission_requests for update
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their permission requests"
  on public.user_resource_permission_requests for delete
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Presentation sessions are joinable by code"
  on public.presentation_sessions for select
  using (true);

create policy "Presentation sessions can be started"
  on public.presentation_sessions for insert
  with check (session_id ~ '^[A-Z0-9]{3}-[A-Z0-9]{3}$');

create policy "Presentation sessions can be controlled by code"
  on public.presentation_sessions for update
  using (session_id ~ '^[A-Z0-9]{3}-[A-Z0-9]{3}$')
  with check (session_id ~ '^[A-Z0-9]{3}-[A-Z0-9]{3}$');

create policy "Presentation events are readable"
  on public.presentation_session_events for select
  using (true);

create policy "Presentation events can be created"
  on public.presentation_session_events for insert
  with check (session_id ~ '^[A-Z0-9]{3}-[A-Z0-9]{3}$');

create policy "Users can read their own roles"
  on public.user_roles for select
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Admins can read acquisition records"
  on public.admin_acquisition_records for select
  using (
    exists (
      select 1
      from public.user_roles
      where user_id = (select auth.uid())
        and role = 'admin'
    )
  );

create policy "Admins can manage acquisition records"
  on public.admin_acquisition_records for all
  using (
    exists (
      select 1
      from public.user_roles
      where user_id = (select auth.uid())
        and role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.user_roles
      where user_id = (select auth.uid())
        and role = 'admin'
    )
  );

grant select on public.resource_sources to anon, authenticated;
grant select on public.library_resources to anon, authenticated;
grant select on public.bible_books to anon, authenticated;
grant select on public.bible_chapters to anon, authenticated;
grant select on public.bible_verses to anon, authenticated;
grant select on public.dictionary_entries to anon, authenticated;
grant select on public.cross_references to anon, authenticated;
grant select on public.commentary_entries to anon, authenticated;
grant select, insert, update, delete on public.user_notes to authenticated;
grant select, insert, update, delete on public.user_highlights to authenticated;
grant select, insert, update, delete on public.user_bookmarks to authenticated;
grant select, insert, update, delete on public.user_library_progress to authenticated;
grant select, insert, update, delete on public.user_completed_resources to authenticated;
revoke all on public.user_library_favorites from anon, authenticated;
grant select, insert, update, delete on public.user_library_favorites to authenticated;
grant select, insert, update, delete on public.user_listening_progress to authenticated;
grant select, insert, update, delete on public.user_bible_listening_progress to authenticated;
grant select, insert, update, delete on public.user_bible_mastery to authenticated;
grant select, insert, update, delete on public.user_scripture_memory to authenticated;
grant select, insert, update, delete on public.user_study_playlists to authenticated;
grant select, insert, update, delete on public.user_study_playlist_items to authenticated;
grant insert on public.beta_feedback to anon, authenticated;
grant select on public.strongs_sources to anon, authenticated;
grant select on public.strongs_entries to anon, authenticated;
grant select, insert, update, delete on public.user_personal_library_resources to authenticated;
grant select, insert, update, delete on public.user_resource_permission_requests to authenticated;
grant select, insert, update on public.presentation_sessions to anon, authenticated;
grant select, insert on public.presentation_session_events to anon, authenticated;
grant select on public.user_roles to authenticated;
revoke all on public.user_roles from anon;
grant select, insert, update, delete on public.admin_acquisition_records to authenticated;
revoke all on public.admin_acquisition_records from anon;

insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where lower(email) = 'st396@hotmail.com'
on conflict (user_id, role) do nothing;

insert into public.admin_acquisition_records (record_type, record_key, payload)
values
  (
    'author',
    'harry-a-ironside',
    jsonb_build_object(
      'id', 'harry-a-ironside',
      'name', 'Harry A. Ironside',
      'birthYear', 1876,
      'deathYear', 1951,
      'tradition', 'Brethren / Bible teacher',
      'biography', 'American Bible teacher and preacher known for clear expository teaching and many published addresses.',
      'website', 'https://archive.org/search?query=creator%3A%22H.+A.+Ironside%22',
      'notes', 'Useful for Bible exposition, but editions and later reprints need careful review.',
      'publicDomainStatus', 'Mixed',
      'copyrightNotes', 'Early works may be public domain by publication date. Later editions, revised works, and modern publisher editions require review.'
    )
  ),
  (
    'author',
    'charles-spurgeon',
    jsonb_build_object(
      'id', 'charles-spurgeon',
      'name', 'Charles Spurgeon',
      'birthYear', 1834,
      'deathYear', 1892,
      'tradition', 'Baptist',
      'biography', 'English Baptist preacher whose sermons, devotional works, and pastoral writings remain widely used.',
      'website', 'https://www.gutenberg.org/ebooks/author/45',
      'notes', 'Strong priority author for preaching, devotion, evangelism, and Christian living.',
      'publicDomainStatus', 'Public Domain',
      'copyrightNotes', 'Original nineteenth-century works are public domain. Verify source text and edition notes before import.'
    )
  ),
  (
    'author',
    'j-c-ryle',
    jsonb_build_object(
      'id', 'j-c-ryle',
      'name', 'J. C. Ryle',
      'birthYear', 1816,
      'deathYear', 1900,
      'tradition', 'Anglican evangelical',
      'biography', 'Evangelical bishop known for practical, plain-spoken works on holiness, the Gospels, and Christian living.',
      'website', 'https://archive.org/search?query=creator%3A%22Ryle%2C+J.+C.%22',
      'notes', 'Helpful devotional and teaching resource. Mark secondary doctrinal differences where appropriate.',
      'publicDomainStatus', 'Public Domain',
      'copyrightNotes', 'Original works are generally public domain. Confirm edition/source before import.'
    )
  ),
  (
    'author',
    'd-l-moody',
    jsonb_build_object(
      'id', 'd-l-moody',
      'name', 'D. L. Moody',
      'birthYear', 1837,
      'deathYear', 1899,
      'tradition', 'Evangelist',
      'biography', 'American evangelist associated with revival work, evangelism, and practical Christian instruction.',
      'website', 'https://www.gutenberg.org/ebooks/author/402',
      'notes', 'Useful for evangelism, Christian living, and simple teaching.',
      'publicDomainStatus', 'Public Domain',
      'copyrightNotes', 'Original works are generally public domain. Confirm Project Gutenberg or comparable source notices.'
    )
  ),
  (
    'author',
    'e-m-bounds',
    jsonb_build_object(
      'id', 'e-m-bounds',
      'name', 'E. M. Bounds',
      'birthYear', 1835,
      'deathYear', 1913,
      'tradition', 'Methodist / prayer writer',
      'biography', 'Prayer-focused writer whose works have been widely used for devotional and ministry preparation.',
      'website', 'https://www.gutenberg.org/ebooks/author/2832',
      'notes', 'Important prayer collection candidate. Add discernment labels where needed.',
      'publicDomainStatus', 'Public Domain',
      'copyrightNotes', 'Original works are generally public domain; verify modern compiled editions separately.'
    )
  ),
  (
    'author',
    'andrew-murray',
    jsonb_build_object(
      'id', 'andrew-murray',
      'name', 'Andrew Murray',
      'birthYear', 1828,
      'deathYear', 1917,
      'tradition', 'Dutch Reformed',
      'biography', 'Pastor and devotional writer known for works on prayer, abiding in Christ, humility, and Christian growth.',
      'website', 'https://www.gutenberg.org/ebooks/author/1231',
      'notes', 'Useful devotional classic author. Mark perspective notes where helpful.',
      'publicDomainStatus', 'Public Domain',
      'copyrightNotes', 'Original works are generally public domain. Verify edition and source terms.'
    )
  ),
  (
    'book',
    'all-of-grace',
    jsonb_build_object(
      'id', 'all-of-grace',
      'title', 'All of Grace',
      'subtitle', '',
      'author', 'Charles Spurgeon',
      'publicationYear', 1886,
      'publisher', 'Original nineteenth-century edition',
      'isbn', '',
      'edition', 'Public-domain source edition',
      'sourceUrl', 'https://www.gutenberg.org/ebooks/58181',
      'fileType', 'TXT',
      'copyrightStatus', 'Public Domain',
      'confidenceScore', 96,
      'reviewStatus', 'Approved',
      'notes', 'Project Gutenberg source. Keep source notice and verify text before public import.',
      'dateAdded', '2026-06-04',
      'topic', 'Evangelism'
    )
  ),
  (
    'book',
    'power-through-prayer',
    jsonb_build_object(
      'id', 'power-through-prayer',
      'title', 'Power Through Prayer',
      'subtitle', '',
      'author', 'E. M. Bounds',
      'publicationYear', 1910,
      'publisher', 'Original edition',
      'isbn', '',
      'edition', 'Public-domain source edition',
      'sourceUrl', 'https://www.gutenberg.org/ebooks/33441',
      'fileType', 'TXT',
      'copyrightStatus', 'Public Domain',
      'confidenceScore', 95,
      'reviewStatus', 'Approved',
      'notes', 'Useful prayer classic candidate. Verify source notice before import.',
      'dateAdded', '2026-06-04',
      'topic', 'Prayer'
    )
  ),
  (
    'book',
    'lectures-on-romans-ironside',
    jsonb_build_object(
      'id', 'lectures-on-romans-ironside',
      'title', 'Lectures on Romans',
      'subtitle', '',
      'author', 'Harry A. Ironside',
      'publicationYear', null,
      'publisher', 'Needs source verification',
      'isbn', '',
      'edition', 'Unknown',
      'sourceUrl', 'https://archive.org/search?query=creator%3A%22H.+A.+Ironside%22+Romans',
      'fileType', 'Unknown',
      'copyrightStatus', 'Unknown',
      'confidenceScore', 42,
      'reviewStatus', 'Needs Review',
      'notes', 'Do not import until publication year, edition, publisher, and rights basis are documented.',
      'dateAdded', '2026-06-04',
      'topic', 'Commentary'
    )
  ),
  (
    'book',
    'modern-way-of-life-placeholder',
    jsonb_build_object(
      'id', 'modern-way-of-life-placeholder',
      'title', 'Way of Life resource placeholder',
      'subtitle', 'Permission needed only',
      'author', 'David Cloud / Way of Life Literature',
      'publicationYear', null,
      'publisher', 'Way of Life Literature',
      'isbn', '',
      'edition', 'Modern',
      'sourceUrl', 'https://www.wayoflife.org/',
      'fileType', 'Permission tracker',
      'copyrightStatus', 'Copyrighted',
      'confidenceScore', 98,
      'reviewStatus', 'Rejected',
      'notes', 'Do not publicly import without written permission. Keep as permission-needed or personal-use-only planning.',
      'dateAdded', '2026-06-04',
      'topic', 'KJV / Textual Issues'
    )
  ),
  (
    'rights_holder',
    'moody-publishers',
    jsonb_build_object('id', 'moody-publishers', 'organizationName', 'Moody Publishers', 'contactName', '', 'email', '', 'website', 'https://www.moodypublishers.com/', 'licensingNotes', 'Modern editions and Moody-controlled works require permission or a licensing agreement.', 'lastContactDate', '')
  ),
  (
    'rights_holder',
    'kregel',
    jsonb_build_object('id', 'kregel', 'organizationName', 'Kregel', 'contactName', '', 'email', '', 'website', 'https://www.kregel.com/', 'licensingNotes', 'Track commentary, Bible study, and reprint rights separately.', 'lastContactDate', '')
  ),
  (
    'rights_holder',
    'baker',
    jsonb_build_object('id', 'baker', 'organizationName', 'Baker', 'contactName', '', 'email', '', 'website', 'https://www.bakerpublishinggroup.com/', 'licensingNotes', 'Publisher partnership candidate for future premium/authorized resources.', 'lastContactDate', '')
  ),
  (
    'rights_holder',
    'crossway',
    jsonb_build_object('id', 'crossway', 'organizationName', 'Crossway', 'contactName', '', 'email', '', 'website', 'https://www.crossway.org/', 'licensingNotes', 'Modern copyrighted works and Bible/licensing questions require written permission.', 'lastContactDate', '')
  ),
  (
    'rights_holder',
    'christian-focus',
    jsonb_build_object('id', 'christian-focus', 'organizationName', 'Christian Focus', 'contactName', '', 'email', '', 'website', 'https://www.christianfocus.com/', 'licensingNotes', 'Track ebook, audiobook, and app display permissions separately.', 'lastContactDate', '')
  ),
  (
    'licensed_rights',
    'way-of-life-permission-needed',
    jsonb_build_object(
      'id', 'way-of-life-permission-needed',
      'title', 'Way of Life resource review',
      'author', 'David Cloud',
      'publisher', 'Way of Life Literature',
      'rightsHolder', 'Way of Life Literature',
      'contactName', '',
      'contactEmail', '',
      'website', 'https://www.wayoflife.org/',
      'copyrightYear', 'Modern',
      'edition', 'Current ministry edition',
      'isbn', '',
      'requestedUse', 'Evaluate whether selected books could be licensed for public Library, private-user upload, excerpts, or audio.',
      'permissionStatus', 'Permission Needed',
      'publicAppPermission', 'No',
      'privateUserImportPermission', 'Unknown',
      'excerptPermission', 'Unknown',
      'audiobookPermission', 'Unknown',
      'aiTtsNarrationPermission', 'Unknown',
      'paidSubscriptionPermission', 'Unknown',
      'freeBetaPermission', 'Unknown',
      'royaltyTerms', 'Not requested',
      'nextFollowUpDate', '',
      'notes', 'Do not import or publish any copyrighted text without written permission.'
    )
  ),
  (
    'licensed_rights',
    'john-phillips-premium-candidate',
    jsonb_build_object(
      'id', 'john-phillips-premium-candidate',
      'title', 'John Phillips commentary resources',
      'author', 'John Phillips',
      'publisher', 'Kregel / rights holder review needed',
      'rightsHolder', 'Kregel or estate/publisher to confirm',
      'contactName', '',
      'contactEmail', '',
      'website', 'https://www.kregel.com/',
      'copyrightYear', 'Modern',
      'edition', 'Modern print/digital editions',
      'isbn', '',
      'requestedUse', 'Future premium commentary licensing candidate.',
      'permissionStatus', 'Permission Needed',
      'publicAppPermission', 'No',
      'privateUserImportPermission', 'Unknown',
      'excerptPermission', 'Unknown',
      'audiobookPermission', 'Unknown',
      'aiTtsNarrationPermission', 'Unknown',
      'paidSubscriptionPermission', 'Unknown',
      'freeBetaPermission', 'No',
      'royaltyTerms', 'Not requested',
      'nextFollowUpDate', '',
      'notes', 'Keep as licensed-resource planning only until rights holder confirms terms.'
    )
  ),
  (
    'licensed_rights',
    'public-domain-control',
    jsonb_build_object(
      'id', 'public-domain-control',
      'title', 'Public-domain control record',
      'author', 'Public-domain author',
      'publisher', 'Original public-domain source',
      'rightsHolder', 'No modern rights holder for original text',
      'contactName', '',
      'contactEmail', '',
      'website', '',
      'copyrightYear', 'Before 1929',
      'edition', 'Original public-domain edition',
      'isbn', '',
      'requestedUse', 'Public Library, search, reading, study, and device TTS.',
      'permissionStatus', 'Public Domain',
      'publicAppPermission', 'Yes, for verified public-domain source text',
      'privateUserImportPermission', 'Yes',
      'excerptPermission', 'Yes',
      'audiobookPermission', 'Device TTS allowed; generated/public audio reviewed separately',
      'aiTtsNarrationPermission', 'Review before distributing generated audio files',
      'paidSubscriptionPermission', 'Review source and attribution requirements first',
      'freeBetaPermission', 'Yes',
      'royaltyTerms', 'None for original public-domain text',
      'nextFollowUpDate', '',
      'notes', 'Use this as the contrast record for public-domain imports.'
    )
  ),
  (
    'media_intake',
    'all-of-grace-audiobook-candidate',
    jsonb_build_object(
      'id', 'all-of-grace-audiobook-candidate',
      'kind', 'Audiobook',
      'title', 'All of Grace audiobook candidate',
      'creator', 'C. H. Spurgeon',
      'passage', '',
      'series', 'Spurgeon Starter',
      'duration', '3 hr 10 min estimate',
      'sourceUrl', 'https://www.gutenberg.org/ebooks/772',
      'rightsStatus', 'Public Domain',
      'intakeStatus', 'Ready For Storage',
      'storageBucket', 'fathers-business-bible-study-public',
      'storagePath', 'audio/audiobooks/spurgeon/all-of-grace/',
      'transcriptPath', 'data/library/verified/all-of-grace-c-h-spurgeon.txt',
      'coverPath', 'media/covers/audiobooks/all-of-grace.webp',
      'visibility', 'Private admin draft',
      'notes', 'Text is public domain. Human or generated narration should be reviewed separately before distributing audio files.',
      'nextAction', 'Choose narration path: device voice only, human narration, or premium TTS sample.'
    )
  ),
  (
    'media_intake',
    'pilgrims-progress-audiobook-candidate',
    jsonb_build_object(
      'id', 'pilgrims-progress-audiobook-candidate',
      'kind', 'Audiobook',
      'title', 'The Pilgrim''s Progress audiobook candidate',
      'creator', 'John Bunyan',
      'passage', '',
      'series', 'Christian Classics Starter',
      'duration', '6 hr estimate',
      'sourceUrl', 'https://www.gutenberg.org/ebooks/131',
      'rightsStatus', 'Public Domain',
      'intakeStatus', 'Ready For Storage',
      'storageBucket', 'fathers-business-bible-study-public',
      'storagePath', 'audio/audiobooks/bunyan/pilgrims-progress/',
      'transcriptPath', 'data/library/verified/the-pilgrim-s-progress-john-bunyan.txt',
      'coverPath', 'media/covers/audiobooks/pilgrims-progress.webp',
      'visibility', 'Private admin draft',
      'notes', 'Public-domain candidate for testing long-form audiobook structure. Confirm exact Library text slug before attaching audio.',
      'nextAction', 'Verify matching text resource, choose chapter markers, and decide narrator approach.'
    )
  ),
  (
    'media_intake',
    'hosea-4-9-teaching-audio',
    jsonb_build_object(
      'id', 'hosea-4-9-teaching-audio',
      'kind', 'Teaching Series',
      'title', 'Hosea 4-9 Sunday School teaching audio',
      'creator', 'Stephen Scheer',
      'passage', 'Hosea 4-9',
      'series', 'Minor Prophets Sunday School',
      'duration', '45-60 min planned',
      'sourceUrl', '',
      'rightsStatus', 'Personal Use Only',
      'intakeStatus', 'Draft',
      'storageBucket', 'fathers-business-bible-study-public',
      'storagePath', 'audio/teaching/minor-prophets/hosea-4-9/',
      'transcriptPath', 'transcripts/teaching/minor-prophets/hosea-4-9.md',
      'coverPath', 'media/covers/teaching/hosea-4-9.webp',
      'visibility', 'Private admin draft',
      'notes', 'Use for testing sermon/lesson audio workflow. Public release requires ownership and speaker permission confirmation.',
      'nextAction', 'Record, transcribe, attach teaching outline, and confirm whether public app use is intended.'
    )
  ),
  (
    'media_intake',
    'church-sermon-audio-owned',
    jsonb_build_object(
      'id', 'church-sermon-audio-owned',
      'kind', 'Sermon Audio',
      'title', 'Church sermon audio intake template',
      'creator', 'Preacher / church',
      'passage', 'John 3',
      'series', 'Gospel Messages',
      'duration', '35 min estimate',
      'sourceUrl', '',
      'rightsStatus', 'Permission Needed',
      'intakeStatus', 'Needs Rights Review',
      'storageBucket', 'fathers-business-bible-study-public',
      'storagePath', 'audio/sermons/{church}/{series}/{slug}.mp3',
      'transcriptPath', 'transcripts/sermons/{church}/{series}/{slug}.md',
      'coverPath', 'media/covers/sermons/{church}/{series}.webp',
      'visibility', 'Private admin draft',
      'notes', 'Do not publish sermon audio until church/preacher ownership, recording consent, and distribution permission are documented.',
      'nextAction', 'Add rights holder, speaker permission, source file, transcript, and public/private decision.'
    )
  ),
  (
    'media_intake',
    'bible-audio-kjv-future-license',
    jsonb_build_object(
      'id', 'bible-audio-kjv-future-license',
      'kind', 'Bible Audio',
      'title', 'Licensed KJV Bible audio placeholder',
      'creator', 'Future licensed narrator or provider',
      'passage', 'John 3',
      'series', 'KJV Bible Audio',
      'duration', 'Chapter based',
      'sourceUrl', '',
      'rightsStatus', 'Permission Needed',
      'intakeStatus', 'Needs Rights Review',
      'storageBucket', 'fathers-business-bible-study-public',
      'storagePath', 'audio/bible/kjv/{book}/{chapter}.mp3',
      'transcriptPath', 'data/bible/kjv/{book}/{chapter}.json',
      'coverPath', 'media/covers/bible/kjv-audio.webp',
      'visibility', 'Private admin draft',
      'notes', 'Browser/device speech remains the default. Do not distribute licensed Bible audio files until rights are granted.',
      'nextAction', 'Research licensed KJV audio terms and compare with premium TTS pilot.'
    )
  ),
  (
    'audiobook_pilot',
    'all-of-grace-audiobook-pilot',
    jsonb_build_object(
      'id', 'all-of-grace-audiobook-pilot',
      'mediaRecordId', 'all-of-grace-audiobook-candidate',
      'libraryTitle', 'All of Grace',
      'libraryAuthor', 'C. H. Spurgeon',
      'libraryFilePath', 'data/library/verified/all-of-grace-c-h-spurgeon.txt',
      'sourceUrl', 'https://archive.org/details/allofgraceearnes00spur',
      'rightsEvidence', 'Internet Archive scan of an 1886 edition. C. H. Spurgeon died in 1892; this edition is public domain in the United States.',
      'pilotStatus', 'Text cleanup needed before public narration',
      'textCleanupStatus', 'Front matter and OCR artifacts need review before polished narration.',
      'narrationStatus', 'No narration files uploaded yet',
      'estimatedDuration', '3 hr 10 min',
      'publicReadiness', 'Private pilot only until narration rights, transcript cleanup, and audio quality review are complete.',
      'pilotSteps', jsonb_build_array(
        'Confirm the preferred public-domain text edition already attached in the Library.',
        'Remove OCR front matter noise and proof chapter headings without changing Spurgeon''s wording.',
        'Record or generate one short private sample segment for voice quality review.',
        'Upload approved sample audio to R2 under the planned path.',
        'Only mark public after source, narration, transcript, and rights review are documented.'
      ),
      'segments', jsonb_build_array(
        jsonb_build_object('number', 1, 'title', 'To You!', 'textAnchor', 'TO YOU!', 'audioPath', 'audio/audiobooks/spurgeon/all-of-grace/001-to-you.mp3', 'transcriptPath', 'transcripts/audiobooks/spurgeon/all-of-grace/001-to-you.md', 'status', 'Ready To Record', 'estimatedMinutes', 7, 'notes', 'Clean private transcript exists. Ready for the first narration sample.'),
        jsonb_build_object('number', 2, 'title', 'What Are We At?', 'textAnchor', 'WHAT ARE WE AT?', 'audioPath', 'audio/audiobooks/spurgeon/all-of-grace/002-what-are-we-at.mp3', 'transcriptPath', 'transcripts/audiobooks/spurgeon/all-of-grace/002-what-are-we-at.md', 'status', 'Ready To Record', 'estimatedMinutes', 8, 'notes', 'Clean private transcript exists. Ready for the second narration sample.')
      )
    )
  )
on conflict (record_type, record_key) do nothing;

insert into public.resource_sources (
  title,
  author,
  year,
  source_url,
  copyright_status,
  commercial_use_notes,
  attribution_notes
)
values
  (
    'King James Version, 1769 Oxford standard text',
    'Public domain Bible text',
    1769,
    'https://www.gutenberg.org/ebooks/10',
    'Public domain in the United States',
    'Verify rights by jurisdiction before commercial distribution outside the United States.',
    'KJV wording only for Scripture references.'
  ),
  (
    'American Dictionary of the English Language',
    'Noah Webster',
    1828,
    'https://archive.org/details/americandictiona01websrich',
    'Public domain original work',
    'Modern transcriptions, databases, and APIs may have separate terms.',
    'Use source-level attribution when importing a full Webster dataset.'
  ),
  (
    'Treasury of Scripture Knowledge',
    'R. A. Torrey edition and earlier public-domain source tradition',
    1836,
    'https://www.biblestudytools.com/concordances/treasury-of-scripture-knowledge/',
    'Public domain source; verify selected import dataset terms before bundling',
    'Commercial use depends on the selected digital source terms.',
    'Use for cross-reference import metadata.'
  ),
  (
    'H. A. Ironside placeholder',
    'H. A. Ironside',
    null,
    null,
    'Placeholder only; verify public-domain status and selected source before importing.',
    'Do not use commercially until source status is documented.',
    'Reserved for future commentary/resource import planning.'
  ),
  (
    'H. A. Ironside Commentary Samples',
    'H. A. Ironside',
    1928,
    'https://www.wholesomewords.org/etexts/ironside/writings.html',
    'Mixed source status. Romans first edition is 1928 and public domain in the United States; John and Luke are curated summaries pending full-text renewal and edition review.',
    'Use Phase 2 curated summaries only until every selected full-text source has a complete rights audit.',
    'Second commentary voice for John 3, Romans 5, and Luke 24. Keep collapsed and secondary to Scripture.'
  ),
  (
    'Matthew Henry''s Commentary on the Whole Bible',
    'Matthew Henry',
    1706,
    'https://www.ccel.org/ccel/henry/mhc.html',
    'Public domain original work; published 1706-1721 and author died in 1714.',
    'Underlying work is public domain; verify terms for any specific digital transcription, site formatting, or modern edited edition before commercial redistribution.',
    'Phase 1 commentary collection. Use after Bible text, Webster''s 1828, TSK, and curated connections.'
  ),
  (
    'The Expositor''s Bible: The Gospel of St. John, Volume I',
    'Marcus Dods',
    1892,
    'https://www.gutenberg.org/ebooks/33151',
    'Project Gutenberg public-domain ebook in the United States',
    'Commercial use must follow Project Gutenberg trademark/license terms when retaining Project Gutenberg material.',
    'First commentary collection path for John. Source downloaded from Project Gutenberg.'
  ),
  (
    'E. M. Bounds placeholder',
    'E. M. Bounds',
    null,
    null,
    'Placeholder only; verify public-domain status and selected source before importing.',
    'Do not use commercially until source status is documented.',
    'Reserved for future prayer/classic book import planning.'
  ),
  (
    'Pilgrim''s Progress placeholder',
    'John Bunyan',
    1678,
    null,
    'Public-domain work; verify selected digital source terms before importing.',
    'Commercial use depends on selected transcription/source terms.',
    'Reserved for future Christian classics/library planning.'
  )
on conflict do nothing;

insert into public.dictionary_entries (
  headword,
  normalized_headword,
  definition,
  source_id
)
select
  seed.headword,
  seed.normalized_headword,
  seed.definition,
  resource_sources.id
from (
  values
    ('believe', 'believe', 'To credit upon the authority or testimony of another; to be persuaded of the truth of something. In Scripture use, to trust in Christ.'),
    ('begotten', 'begotten', 'Generated; procreated. Used of relation and sonship.'),
    ('perish', 'perish', 'To die; to be destroyed; to decay and come to nothing; to be lost.'),
    ('everlasting', 'everlasting', 'Lasting or enduring for ever; eternal; existing without end.'),
    ('condemned', 'condemned', 'Judged or pronounced to be wrong, guilty, or worthy of punishment; sentenced; disapproved.'),
    ('saved', 'saved', 'Preserved from danger or destruction; delivered from the power and consequences of sin.'),
    ('grace', 'grace', 'Favor; good will; kindness; in theology, the free unmerited love and favor of God.'),
    ('faith', 'faith', 'Belief; assent of the mind to the truth of what is declared by another; evangelical trust in Christ.'),
    ('repentance', 'repentance', 'Sorrow for any thing done or said; in theology, sorrow for sin with a sincere turning from it unto God.'),
    ('charity', 'charity', 'Love; benevolence; good will. In Scripture, supreme love to God and good will to men.')
) as seed(headword, normalized_headword, definition)
left join public.resource_sources
  on resource_sources.title = 'American Dictionary of the English Language'
on conflict (normalized_headword, definition) do update
set headword = excluded.headword,
    source_id = excluded.source_id;

insert into public.cross_references (
  verse_ref,
  target_ref,
  label,
  source,
  source_id
)
select
  seed.verse_ref,
  seed.target_ref,
  seed.label,
  seed.source,
  resource_sources.id
from (
  values
    ('John 3:14', 'Numbers 21:8', 'The serpent lifted up in the wilderness.', 'TSK'),
    ('John 3:14', 'Numbers 21:9', 'Looking to the lifted serpent and living.', 'TSK'),
    ('John 3:14', 'John 8:28', 'The Son of man lifted up.', 'TSK'),
    ('John 3:15', 'John 3:16', 'Believing in Him and everlasting life.', 'TSK'),
    ('John 3:15', 'John 6:40', 'Believing on the Son and having everlasting life.', 'TSK'),
    ('John 3:16', 'Genesis 22:2', 'Only son language and sacrifice pattern.', 'TSK'),
    ('John 3:16', 'Romans 5:8', 'God''s love commended toward sinners.', 'TSK'),
    ('John 3:16', '1 John 4:9', 'The love of God manifested by sending His only begotten Son.', 'TSK'),
    ('John 3:16', 'John 3:36', 'Believing on the Son and everlasting life.', 'TSK'),
    ('John 3:16', 'Romans 8:32', 'God spared not His own Son.', 'TSK'),
    ('John 3:17', 'Luke 9:56', 'The Son of man came not to destroy, but to save.', 'TSK'),
    ('John 3:17', 'John 12:47', 'Christ came not to judge the world, but to save.', 'TSK'),
    ('John 3:17', '1 John 4:14', 'The Father sent the Son to be the Saviour of the world.', 'TSK'),
    ('John 3:18', 'John 5:24', 'The believer is passed from death unto life.', 'TSK'),
    ('John 3:18', 'Romans 8:1', 'No condemnation to them which are in Christ Jesus.', 'TSK'),
    ('John 3:18', 'Mark 16:16', 'Belief and unbelief set in sharp contrast.', 'TSK')
) as seed(verse_ref, target_ref, label, source)
left join public.resource_sources
  on resource_sources.title = 'Treasury of Scripture Knowledge'
on conflict (verse_ref, target_ref, source) do update
set label = excluded.label,
    source_id = excluded.source_id;

insert into public.commentary_entries (
  source_id,
  book,
  chapter,
  verse_start,
  verse_end,
  author,
  resource_title,
  source_title,
  entry_text,
  public_domain_status,
  rights_basis,
  recommended_use,
  source_url
)
select
  resource_sources.id,
  sample.book,
  sample.chapter,
  sample.verse_start,
  sample.verse_end,
  'Matthew Henry',
  'Matthew Henry''s Commentary on the Whole Bible',
  'Matthew Henry''s Commentary on the Whole Bible',
  sample.entry_text,
  sample.public_domain_status,
  'Public-domain original work verified through Wikisource and CCEL source listings; avoid modern edited editions until reviewed.',
  'Use after reading the KJV passage, checking Webster''s 1828, TSK, and curated people/place/type connections.',
  'https://www.ccel.org/ccel/henry/mhc.html'
from public.resource_sources
cross join (
  values
    (
      'John',
      3,
      1,
      36,
      'Henry treats John 3 as a plain declaration of the new birth, the lifting up of the Son of man, God''s love in giving His only begotten Son, and the difference between believing and rejecting.',
      'Public domain. Original work published 1706-1721; Matthew Henry died in 1714.'
    ),
    (
      'Romans',
      5,
      1,
      21,
      'Henry treats Romans 5 as the fruit of justification: peace, hope, joy in tribulation, assurance grounded in Christ''s death for sinners, and the contrast between Adam and Christ.',
      'Public domain. Original work published 1706-1721; Matthew Henry died in 1714.'
    ),
    (
      'Luke',
      24,
      1,
      53,
      'Henry follows Luke 24 from the empty sepulchre to the Emmaus road, the opened Scriptures, repentance and remission of sins, witness, worship, and Christ''s ascension.',
      'Public domain. Original work published 1706-1721; Matthew Henry died in 1714.'
    )
) as sample(book, chapter, verse_start, verse_end, entry_text, public_domain_status)
where resource_sources.title = 'Matthew Henry''s Commentary on the Whole Bible'
on conflict (book, chapter, verse_start, verse_end, author, resource_title) do update
set entry_text = excluded.entry_text,
    public_domain_status = excluded.public_domain_status,
    rights_basis = excluded.rights_basis,
    recommended_use = excluded.recommended_use,
    source_id = excluded.source_id;

insert into public.commentary_entries (
  source_id,
  book,
  chapter,
  verse_start,
  verse_end,
  author,
  resource_title,
  source_title,
  entry_text,
  public_domain_status,
  rights_basis,
  recommended_use,
  source_url
)
select
  resource_sources.id,
  sample.book,
  sample.chapter,
  sample.verse_start,
  sample.verse_end,
  'H. A. Ironside',
  'H. A. Ironside Commentary Samples',
  sample.source_title,
  sample.entry_text,
  sample.public_domain_status,
  sample.rights_basis,
  sample.recommended_use,
  sample.source_url
from public.resource_sources
cross join (
  values
    (
      'John',
      3,
      1,
      36,
      'Addresses on the Gospel of John',
      'Ironside''s John 3 emphasis is especially useful for a clear gospel lesson: Nicodemus had religion and standing, yet still needed the new birth. The chapter should be taught around Christ''s own words, the brazen serpent connection, the necessity of believing, and the open contrast between receiving light and remaining under condemnation.',
      'Source page verified. Phase 2 uses curated summary only; full-text import requires renewal and edition audit before commercial use.',
      'Plymouth Brethren Archive source page verifies title, author, and availability. Do not import full text until copyright-renewal and source terms are fully documented.',
      'Use as a second teacher-friendly voice after the KJV text, Webster''s 1828, TSK, and Matthew Henry. Helpful for emphasizing the new birth, faith, and Christ lifted up.',
      'https://www.brethrenarchive.org/people/harry-a-ironside/pamphlets/addresses-on-the-gospel-of-john/'
    ),
    (
      'Romans',
      5,
      1,
      21,
      'Lectures on the Epistle to the Romans',
      'Ironside frames Romans 5 as the transition from sins to indwelling sin and from guilt to standing in grace. For teaching, the chapter can be organized around peace with God, joy under trial, God''s love shown in Christ''s death for sinners, and the contrast between Adam''s ruin and Christ''s abounding grace.',
      'Public domain in the United States for the 1928 first edition. Avoid modern edition additions and scan formatting unless separately reviewed.',
      'Verified source PDF identifies H. A. Ironside as author and Loizeaux Brothers first edition, 1928.',
      'Use after Scripture to help teachers explain justification''s fruit, assurance, and the Adam/Christ contrast without letting commentary replace the Bible text.',
      'https://www.brethrenarchive.org/media/364659/ironside-h-a-_-epistles-to-the-romans.pdf'
    ),
    (
      'Luke',
      24,
      1,
      53,
      'Addresses on the Gospel of Luke',
      'Ironside''s Luke 24 sample helps keep the resurrection, the opened Scriptures, and gospel witness together. The chapter is valuable for showing that Christ''s sufferings and resurrection were not a surprise to Scripture, that understanding is opened by the Lord, and that repentance and remission of sins are to be preached in His name.',
      'Source page verified. Phase 2 uses curated summary only; full-text import requires renewal and edition audit before commercial use.',
      'Plymouth Brethren Archive source page verifies title, author, and 1947 source year. Do not import full text until copyright-renewal and source terms are fully documented.',
      'Use for Sunday school and preaching preparation after the KJV text and reviewed cross references, especially for resurrection, opened Scriptures, and witness.',
      'https://www.brethrenarchive.org/people/harry-a-ironside/pamphlets/addresses-on-the-gospel-of-luke/'
    )
) as sample(book, chapter, verse_start, verse_end, source_title, entry_text, public_domain_status, rights_basis, recommended_use, source_url)
where resource_sources.title = 'H. A. Ironside Commentary Samples'
on conflict (book, chapter, verse_start, verse_end, author, resource_title) do update
set source_title = excluded.source_title,
    entry_text = excluded.entry_text,
    public_domain_status = excluded.public_domain_status,
    rights_basis = excluded.rights_basis,
    recommended_use = excluded.recommended_use,
    source_url = excluded.source_url,
    source_id = excluded.source_id;
