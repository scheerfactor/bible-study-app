alter table public.user_study_playlists
  add column if not exists last_item_progress numeric not null default 0
    check (last_item_progress >= 0 and last_item_progress <= 100),
  add column if not exists last_played_at timestamptz;

create or replace function public.keep_newest_study_playlist_update()
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

revoke all on function public.keep_newest_study_playlist_update() from public;

drop trigger if exists keep_newest_study_playlist_update on public.user_study_playlists;
create trigger keep_newest_study_playlist_update
  before update on public.user_study_playlists
  for each row execute function public.keep_newest_study_playlist_update();
