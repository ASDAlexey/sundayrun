import { EventResult } from '../history/athletes-rollup.interface';
import { Gender } from '../models/gender.enum';
import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';
import { DNF_DISTANCE_KM, RESULTS_FILE_SCHEMA_VERSION } from './results-file.constant';
import { EventResultsFile } from './results-file.interface';
import { safeJsonParse } from './safe-json-parse';

export function buildEventResultsFile(event: RaceEvent, rows: ProtocolRow[]): EventResultsFile {
  return { schemaVersion: RESULTS_FILE_SCHEMA_VERSION, event, rows };
}

/** Parses `results.json`; null, malformed JSON or an unexpected shape yields null. */
export function parseEventResultsFile(text: string | null): EventResultsFile | null {
  const parsed = safeJsonParse(text);

  return isEventResultsFile(parsed) ? parsed : null;
}

function isEventResultsFile(value: unknown): value is EventResultsFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    value.schemaVersion === RESULTS_FILE_SCHEMA_VERSION &&
    'event' in value &&
    typeof value.event === 'object' &&
    value.event !== null &&
    'rows' in value &&
    Array.isArray(value.rows) &&
    value.rows.every(isProtocolRow)
  );
}

/** Guards every field the online protocol renders; a single broken row invalidates the file. */
function isProtocolRow(value: unknown): value is ProtocolRow {
  return (
    typeof value === 'object' &&
    value !== null &&
    'index' in value &&
    typeof value.index === 'number' &&
    'fullName' in value &&
    typeof value.fullName === 'string' &&
    'time23' in value &&
    typeof value.time23 === 'string' &&
    'time5' in value &&
    typeof value.time5 === 'string' &&
    'gender' in value &&
    (value.gender === null || value.gender === Gender.male || value.gender === Gender.female) &&
    'placeM' in value &&
    (value.placeM === null || typeof value.placeM === 'number') &&
    'placeF' in value &&
    (value.placeF === null || typeof value.placeF === 'number') &&
    'club' in value &&
    typeof value.club === 'string' &&
    'note' in value &&
    typeof value.note === 'string'
  );
}

/**
 * Maps protocol rows to rollup results. DNF rows (null `totalMs`) are kept so that
 * `applyEventToHistory` still creates athlete records and registers the event in their
 * `participationSlugs` (a DNF counts as a participation), but they never become runs
 * because their `timeMs` stays null.
 */
export function toEventResults(rows: ProtocolRow[]): EventResult[] {
  return rows.map((row) => ({
    fullName: row.fullName,
    gender: row.gender,
    timeMs: row.totalMs,
    distanceKm: row.distanceKm ?? DNF_DISTANCE_KM,
  }));
}
