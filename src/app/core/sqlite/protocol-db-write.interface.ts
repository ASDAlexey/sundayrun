import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';

/**
 * Publication payload: the event's metadata and its protocol rows. The write reads the previous
 * archive and athletes rollup back out of the db it is updating, so the caller no longer supplies
 * the derived index/history — `protocol.db` is the single source of truth.
 */
export interface ProtocolDbEventUpdate {
  event: RaceEvent;
  rows: ProtocolRow[];
}

/** Deletion payload: just the slug to drop; the rest of the state is read from the db. */
export interface ProtocolDbEventRemoval {
  slug: string;
}

/** `events.club_name`/`events.chairman` of one row — data that only per-event results files carry. */
export interface ProtocolDbEventMeta {
  clubName: string;
  chairman: string;
}
