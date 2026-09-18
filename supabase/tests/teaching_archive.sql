-- Run in a transaction AFTER the migration; this file ends with ROLLBACK.
-- Synthetic users and records only. All test data is rolled back.
insert into auth.users(id) values ('ba000000-0000-4000-8000-000000000001'),('ba000000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub','ba000000-0000-4000-8000-000000000001',true);
select public.record_teaching_archive_event('{"schemaVersion":1,"id":"ba100000-0000-4000-8000-000000000001","messageId":"ba200000-0000-4000-8000-000000000001","sourceEventId":null,"recordedAt":"2026-09-18T00:00:00.000Z","delivery":{"date":"2026-09-13","location":"Test church","audience":"Adults","deliveredNotes":"Spontaneous story","reflection":"Review"},"snapshot":{"id":"local-draft","title":"Test archive","kind":"Lesson","passage":"2 Corinthians 2","theme":"Forgiveness","illustrations":"Original story","quotes":"Original quote","createdAt":"2026-09-01","updatedAt":"2026-09-13","slides":[]}}');
-- Retry the exact record, including JSONB key reordering.
select public.record_teaching_archive_event(prepared_snapshot) from public.preaching_events where id='ba100000-0000-4000-8000-000000000001';
do $$ begin
 if (select count(*) from public.preaching_events where id='ba100000-0000-4000-8000-000000000001') <> 1 then raise exception 'FAIL retry'; end if;
 begin
   perform public.record_teaching_archive_event(jsonb_set((select prepared_snapshot from public.preaching_events where id='ba100000-0000-4000-8000-000000000001'),'{snapshot,quotes}','"Rewritten"'));
   raise exception 'FAIL overwrite accepted';
 exception when check_violation then null; end;
 begin
   update public.preaching_events set prepared_snapshot='{}' where id='ba100000-0000-4000-8000-000000000001';
   raise exception 'FAIL update allowed';
 exception when insufficient_privilege then null; end;
 begin
   delete from public.preaching_events where id='ba100000-0000-4000-8000-000000000001';
   raise exception 'FAIL delete allowed';
 exception when insufficient_privilege then null; end;
end $$;
select public.append_teaching_delivery_note('{"id":"ba300000-0000-4000-8000-000000000001","eventId":"ba100000-0000-4000-8000-000000000001","createdAt":"2026-09-18T01:00:00.000Z","body":"Later delivery note"}');
select public.append_teaching_delivery_note('{"id":"ba300000-0000-4000-8000-000000000001","eventId":"ba100000-0000-4000-8000-000000000001","createdAt":"2026-09-18T01:00:00.000Z","body":"Later delivery note"}');
select set_config('request.jwt.claim.sub','ba000000-0000-4000-8000-000000000002',true);
do $$ begin
 if exists(select 1 from public.preaching_events where id='ba100000-0000-4000-8000-000000000001') then raise exception 'FAIL cross-owner read'; end if;
 if exists(select 1 from public.preaching_event_addenda where id='ba300000-0000-4000-8000-000000000001') then raise exception 'FAIL cross-owner note read'; end if;
 begin
  perform public.append_teaching_delivery_note('{"id":"ba300000-0000-4000-8000-000000000002","eventId":"ba100000-0000-4000-8000-000000000001","createdAt":"2026-09-18T01:00:00.000Z","body":"Foreign note"}');
  raise exception 'FAIL cross-owner note insert';
 exception when foreign_key_violation then null; end;
 begin
  insert into public.preaching_events(user_id,message_id,preached_at) values(auth.uid(),'ba200000-0000-4000-8000-000000000001',now());
  raise exception 'FAIL cross-owner message reference';
 exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
 begin
  perform * from public.preaching_events;
  raise exception 'FAIL anon read';
 exception when insufficient_privilege then null; end;
 begin
  perform public.record_teaching_archive_event('{}');
  raise exception 'FAIL anon RPC';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 begin
  update public.preaching_events set prepared_snapshot='{}' where id='ba100000-0000-4000-8000-000000000001';
  raise exception 'FAIL privileged overwrite';
 exception when check_violation then null; end;
 begin
  delete from public.preaching_messages where id='ba200000-0000-4000-8000-000000000001';
  raise exception 'FAIL cascade deleted history';
 exception when check_violation then null; end;
end $$;
select 'PASS: RPC retry, conflict rejection, event immutability, delivery-note append, cross-owner isolation, anon denial and cascade protection' as archive_test_result;
rollback;
