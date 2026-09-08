-- Route every shared presentation mutation through one atomic, authenticated RPC.
-- The presenter device is bound to its Supabase auth session. Controller entries
-- are likewise bound to their auth sessions before the database accepts actions.

alter table public.presentation_sessions
  add column if not exists presenter_auth_session_id text;

drop policy if exists "Users can start their presentation sessions" on public.presentation_sessions;
drop policy if exists "Users can update their presentation sessions" on public.presentation_sessions;
drop policy if exists "Users can create their presentation events" on public.presentation_session_events;

revoke insert, update on public.presentation_sessions from authenticated;
revoke insert on public.presentation_session_events from authenticated;
grant select on public.presentation_sessions to authenticated;
grant select on public.presentation_session_events to authenticated;

create or replace function public.apply_presentation_session_action(
  p_session_id text,
  p_event_type text,
  p_state jsonb default '{}'::jsonb,
  p_controller_id text default null,
  p_target_controller_id text default null
)
returns public.presentation_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_auth_session_id text := nullif((select auth.jwt() ->> 'session_id'), '');
  v_session public.presentation_sessions%rowtype;
  v_controller jsonb;
  v_controller_status text;
  v_now timestamptz := now();
  v_is_presenter_session boolean := false;
  v_slide_count integer;
  v_requested_slide integer;
begin
  if v_user_id is null or v_auth_session_id is null then
    raise exception 'An authenticated user session is required.' using errcode = '42501';
  end if;
  if p_session_id !~ '^[A-Z0-9]{3}-[A-Z0-9]{3}$' then
    raise exception 'Invalid presentation session ID.' using errcode = '22023';
  end if;
  if p_event_type not in ('start', 'join', 'display_join', 'display_heartbeat', 'next', 'previous', 'jump', 'first', 'last', 'blank', 'unblank', 'end', 'refresh', 'approve_controller', 'lock_controller', 'unlock_controller', 'restart_timer', 'expire') then
    raise exception 'Unsupported presentation action.' using errcode = '22023';
  end if;

  select * into v_session
  from public.presentation_sessions
  where session_id = p_session_id
  for update;

  if p_event_type = 'start' and not found then
    insert into public.presentation_sessions (
      session_id, presentation_id, current_slide_index, is_blank, is_active,
      presenter_user_id, presenter_auth_session_id, control_mode, controller_lock,
      controllers, last_controller_id, display_last_seen_at, expires_at, title,
      theme_id, slides, target_minutes, notes, created_at, updated_at
    ) values (
      p_session_id,
      nullif(p_state ->> 'presentation_id', ''),
      greatest(0, coalesce((p_state ->> 'current_slide_index')::integer, 0)),
      coalesce((p_state ->> 'is_blank')::boolean, false),
      true,
      v_user_id,
      v_auth_session_id,
      case when p_state ->> 'control_mode' = 'approval' then 'approval' else 'open' end,
      false,
      jsonb_build_array(jsonb_build_object(
        'id', 'owner-' || v_user_id::text,
        'name', 'Presenter',
        'status', 'owner',
        'authSessionId', v_auth_session_id,
        'joinedAt', v_now,
        'approvedAt', v_now,
        'lastSeenAt', v_now
      )),
      null,
      nullif(p_state ->> 'display_last_seen_at', '')::timestamptz,
      coalesce(nullif(p_state ->> 'expires_at', '')::timestamptz, v_now + interval '4 hours'),
      coalesce(nullif(p_state ->> 'title', ''), 'Presentation'),
      coalesce(nullif(p_state ->> 'theme_id', ''), 'warm-bible-study'),
      coalesce(p_state -> 'slides', '[]'::jsonb),
      greatest(1, coalesce((p_state ->> 'target_minutes')::integer, 30)),
      coalesce(p_state ->> 'notes', ''),
      v_now,
      v_now
    ) returning * into v_session;
  elsif not found then
    raise exception 'Presentation session not found.' using errcode = 'P0002';
  else
    if v_session.presenter_user_id is distinct from v_user_id then
      raise exception 'Presentation session does not belong to this account.' using errcode = '42501';
    end if;
    v_is_presenter_session := v_session.presenter_auth_session_id = v_auth_session_id;

    if p_event_type = 'start' then
      if v_session.presenter_auth_session_id is not null and not v_is_presenter_session then
        raise exception 'Only the presenter device can restart this session.' using errcode = '42501';
      end if;
      update public.presentation_sessions set
        presentation_id = nullif(p_state ->> 'presentation_id', ''),
        current_slide_index = greatest(0, coalesce((p_state ->> 'current_slide_index')::integer, 0)),
        is_blank = coalesce((p_state ->> 'is_blank')::boolean, false),
        is_active = true,
        presenter_auth_session_id = v_auth_session_id,
        control_mode = case when p_state ->> 'control_mode' = 'approval' then 'approval' else 'open' end,
        controller_lock = false,
        controllers = jsonb_build_array(jsonb_build_object(
          'id', 'owner-' || v_user_id::text,
          'name', 'Presenter',
          'status', 'owner',
          'authSessionId', v_auth_session_id,
          'joinedAt', v_now,
          'approvedAt', v_now,
          'lastSeenAt', v_now
        )),
        last_controller_id = null,
        display_last_seen_at = nullif(p_state ->> 'display_last_seen_at', '')::timestamptz,
        expires_at = coalesce(nullif(p_state ->> 'expires_at', '')::timestamptz, v_now + interval '4 hours'),
        title = coalesce(nullif(p_state ->> 'title', ''), 'Presentation'),
        theme_id = coalesce(nullif(p_state ->> 'theme_id', ''), 'warm-bible-study'),
        slides = coalesce(p_state -> 'slides', '[]'::jsonb),
        target_minutes = greatest(1, coalesce((p_state ->> 'target_minutes')::integer, 30)),
        notes = coalesce(p_state ->> 'notes', ''),
        updated_at = v_now
      where session_id = p_session_id
      returning * into v_session;
    end if;
  end if;

  if p_event_type <> 'start' then
    v_is_presenter_session := v_session.presenter_auth_session_id = v_auth_session_id;
    if not v_session.is_active or v_session.expires_at < v_now then
      raise exception 'Presentation session has ended or expired.' using errcode = '55000';
    end if;

    if p_event_type = 'join' then
      if p_controller_id is null or p_controller_id !~ '^controller-[a-z0-9-]{8,80}$' then
        raise exception 'A valid controller ID is required.' using errcode = '22023';
      end if;
      select item into v_controller
      from jsonb_array_elements(v_session.controllers) item
      where item ->> 'id' = p_controller_id
      limit 1;
      if v_controller is not null and coalesce(v_controller ->> 'authSessionId', '') <> v_auth_session_id then
        raise exception 'Controller ID is already registered to another authenticated session.' using errcode = '42501';
      end if;
      v_controller_status := case
        when v_is_presenter_session then 'owner'
        when v_controller ->> 'status' = 'blocked' then 'blocked'
        when v_controller ->> 'status' = 'approved' then 'approved'
        when v_session.control_mode = 'approval' then 'waiting'
        else 'approved'
      end;
      select coalesce(jsonb_agg(item), '[]'::jsonb) into v_session.controllers
      from (
        select item from jsonb_array_elements(v_session.controllers) item where item ->> 'id' <> p_controller_id
        union all
        select jsonb_build_object(
          'id', p_controller_id,
          'name', 'Controller',
          'status', v_controller_status,
          'authSessionId', v_auth_session_id,
          'joinedAt', coalesce(v_controller ->> 'joinedAt', v_now::text),
          'approvedAt', case when v_controller_status in ('approved', 'owner') then coalesce(nullif(v_controller ->> 'approvedAt', ''), v_now::text) else coalesce(v_controller ->> 'approvedAt', '') end,
          'lastSeenAt', v_now
        ) item
      ) joined_controllers;
      update public.presentation_sessions set controllers = v_session.controllers, updated_at = v_now
      where session_id = p_session_id returning * into v_session;
    elsif p_event_type in ('display_join', 'display_heartbeat') then
      update public.presentation_sessions set display_last_seen_at = v_now, updated_at = v_now
      where session_id = p_session_id returning * into v_session;
    elsif p_event_type in ('approve_controller', 'lock_controller', 'unlock_controller', 'refresh', 'end', 'expire') then
      if not v_is_presenter_session then
        raise exception 'Only the presenter device can perform this action.' using errcode = '42501';
      end if;
      if p_event_type = 'approve_controller' then
        if p_target_controller_id is null then raise exception 'Controller target is required.' using errcode = '22023'; end if;
        select coalesce(jsonb_agg(case when item ->> 'id' = p_target_controller_id then item || jsonb_build_object('status', 'approved', 'approvedAt', v_now, 'lastSeenAt', v_now) else item end), '[]'::jsonb)
        into v_session.controllers from jsonb_array_elements(v_session.controllers) item;
        update public.presentation_sessions set controllers = v_session.controllers, updated_at = v_now where session_id = p_session_id returning * into v_session;
      elsif p_event_type = 'lock_controller' and p_target_controller_id is not null then
        select coalesce(jsonb_agg(case when item ->> 'id' = p_target_controller_id then item || jsonb_build_object('status', 'blocked', 'lastSeenAt', v_now) else item end), '[]'::jsonb)
        into v_session.controllers from jsonb_array_elements(v_session.controllers) item;
        update public.presentation_sessions set controllers = v_session.controllers, updated_at = v_now where session_id = p_session_id returning * into v_session;
      elsif p_event_type = 'lock_controller' then
        update public.presentation_sessions set controller_lock = true, updated_at = v_now where session_id = p_session_id returning * into v_session;
      elsif p_event_type = 'unlock_controller' then
        update public.presentation_sessions set controller_lock = false, updated_at = v_now where session_id = p_session_id returning * into v_session;
      elsif p_event_type = 'refresh' then
        update public.presentation_sessions set
          title = coalesce(nullif(p_state ->> 'title', ''), title),
          theme_id = coalesce(nullif(p_state ->> 'theme_id', ''), theme_id),
          slides = coalesce(p_state -> 'slides', slides),
          target_minutes = greatest(1, coalesce((p_state ->> 'target_minutes')::integer, target_minutes)),
          notes = coalesce(p_state ->> 'notes', notes),
          control_mode = case when p_state ->> 'control_mode' = 'approval' then 'approval' else 'open' end,
          expires_at = coalesce(nullif(p_state ->> 'expires_at', '')::timestamptz, expires_at),
          updated_at = v_now
        where session_id = p_session_id returning * into v_session;
      else
        update public.presentation_sessions set is_active = false, is_blank = false, updated_at = v_now
        where session_id = p_session_id returning * into v_session;
      end if;
    else
      if not v_is_presenter_session then
        if p_controller_id is null then raise exception 'Controller identity is required.' using errcode = '42501'; end if;
        select item into v_controller from jsonb_array_elements(v_session.controllers) item
        where item ->> 'id' = p_controller_id and item ->> 'authSessionId' = v_auth_session_id limit 1;
        if v_controller is null or v_controller ->> 'status' not in ('approved', 'owner') or v_session.controller_lock then
          raise exception 'Controller is not approved or is locked.' using errcode = '42501';
        end if;
      end if;
      v_slide_count := jsonb_array_length(v_session.slides);
      v_requested_slide := greatest(0, least(coalesce((p_state ->> 'current_slide_index')::integer, v_session.current_slide_index), greatest(0, v_slide_count - 1)));
      update public.presentation_sessions set
        current_slide_index = case
          when p_event_type = 'next' then least(current_slide_index + 1, greatest(0, v_slide_count - 1))
          when p_event_type = 'previous' then greatest(current_slide_index - 1, 0)
          when p_event_type = 'first' then 0
          when p_event_type = 'last' then greatest(0, v_slide_count - 1)
          when p_event_type = 'jump' then v_requested_slide
          else current_slide_index
        end,
        is_blank = case when p_event_type = 'blank' then true when p_event_type = 'unblank' then false when p_event_type in ('next', 'previous', 'first', 'last', 'jump') then false else is_blank end,
        last_controller_id = case when v_is_presenter_session then last_controller_id else p_controller_id end,
        updated_at = v_now
      where session_id = p_session_id returning * into v_session;
    end if;
  end if;

  if p_event_type <> 'display_heartbeat' then
    insert into public.presentation_session_events (session_id, event_type, slide_index, is_blank, created_by, payload)
    values (p_session_id, p_event_type, v_session.current_slide_index, v_session.is_blank, v_user_id,
      jsonb_build_object('controller_id', p_controller_id, 'target_controller_id', p_target_controller_id, 'is_active', v_session.is_active));
  end if;
  return v_session;
end;
$$;

revoke execute on function public.apply_presentation_session_action(text, text, jsonb, text, text) from public, anon;
grant execute on function public.apply_presentation_session_action(text, text, jsonb, text, text) to authenticated;
