import type { TeachingEvent, DeliveryAddendum } from '../lib/teaching-archive';
/** RC1 projection of the existing preaching tables. The full lesson is in prepared_snapshot. */
export type PreachingArchiveEventRow = {
  id: string; user_id: string; message_id: string; preached_at: string;
  audience_label: string | null; service_type: string | null;
  prepared_snapshot: TeachingEvent; delivered_notes: string | null; change_next_time: string | null;
};
export type PreachingEventAddendumRow = {
  id: string; user_id: string; event_id: string; created_at: string; body: string;
};
export type RecordTeachingArchiveArgs = { record: TeachingEvent };
export type AppendTeachingDeliveryNoteArgs = { note: DeliveryAddendum };
