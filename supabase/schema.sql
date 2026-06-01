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
  source_id uuid references public.resource_sources(id),
  created_at timestamptz not null default now(),
  unique (verse_ref, target_ref, source)
);

create index if not exists cross_references_verse_ref_idx on public.cross_references (verse_ref);
create index if not exists cross_references_source_id_idx on public.cross_references (source_id);

create table if not exists public.commentary_entries (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.resource_sources(id),
  book text not null,
  chapter integer not null check (chapter > 0),
  verse_start integer not null check (verse_start > 0),
  verse_end integer not null check (verse_end >= verse_start),
  author text not null,
  resource_title text not null,
  entry_text text not null,
  public_domain_status text not null,
  source_url text,
  created_at timestamptz not null default now(),
  unique (book, chapter, verse_start, verse_end, author, resource_title)
);

create index if not exists commentary_entries_lookup_idx
  on public.commentary_entries (book, chapter, verse_start, verse_end);
create index if not exists commentary_entries_source_id_idx on public.commentary_entries (source_id);

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
  entry_text,
  public_domain_status,
  source_url
)
select
  resource_sources.id,
  'John',
  3,
  16,
  16,
  'H. A. Ironside',
  'John Commentary Placeholder',
  'Placeholder only. This row reserves the commentary structure for a future verified public-domain import.',
  'Placeholder; verify source before importing full text.',
  null
from public.resource_sources
where resource_sources.title = 'H. A. Ironside placeholder'
on conflict (book, chapter, verse_start, verse_end, author, resource_title) do update
set entry_text = excluded.entry_text,
    public_domain_status = excluded.public_domain_status,
    source_id = excluded.source_id;
