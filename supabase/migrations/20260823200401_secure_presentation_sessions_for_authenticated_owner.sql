-- Keep shared presentation content private to the signed-in presenter.
-- The September 11 workflow uses the same account on the presenter,
-- projector, and controller devices. Guest controllers need a later
-- server-authorized token flow and are intentionally not granted here.

drop policy if exists "Presentation sessions are joinable by code" on public.presentation_sessions;
drop policy if exists "Presentation sessions can be started" on public.presentation_sessions;
drop policy if exists "Presentation sessions can be controlled by code" on public.presentation_sessions;
drop policy if exists "Presentation events are readable" on public.presentation_session_events;
drop policy if exists "Presentation events can be created" on public.presentation_session_events;
drop policy if exists "Users can read their presentation sessions" on public.presentation_sessions;
drop policy if exists "Users can start their presentation sessions" on public.presentation_sessions;
drop policy if exists "Users can update their presentation sessions" on public.presentation_sessions;
drop policy if exists "Users can read their presentation events" on public.presentation_session_events;
drop policy if exists "Users can create their presentation events" on public.presentation_session_events;

revoke all on public.presentation_sessions from anon, authenticated;
revoke all on public.presentation_session_events from anon, authenticated;
grant select, insert, update on public.presentation_sessions to authenticated;
grant select, insert on public.presentation_session_events to authenticated;

create policy "Users can read their presentation sessions"
  on public.presentation_sessions for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = presenter_user_id
  );

create policy "Users can start their presentation sessions"
  on public.presentation_sessions for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = presenter_user_id
    and session_id ~ '^[A-Z0-9]{3}-[A-Z0-9]{3}$'
  );

create policy "Users can update their presentation sessions"
  on public.presentation_sessions for update
  to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = presenter_user_id
  )
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = presenter_user_id
    and session_id ~ '^[A-Z0-9]{3}-[A-Z0-9]{3}$'
  );

create policy "Users can read their presentation events"
  on public.presentation_session_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.presentation_sessions
      where presentation_sessions.session_id = presentation_session_events.session_id
        and presentation_sessions.presenter_user_id = (select auth.uid())
    )
  );

create policy "Users can create their presentation events"
  on public.presentation_session_events for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and created_by = (select auth.uid())
    and exists (
      select 1
      from public.presentation_sessions
      where presentation_sessions.session_id = presentation_session_events.session_id
        and presentation_sessions.presenter_user_id = (select auth.uid())
    )
  );
