import { EventResult } from '../history/athletes-rollup.interface';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../history/distance.constant';
import { Gender } from '../models/gender.enum';
import { DNF_DISTANCE_KM, RESULTS_FILE_SCHEMA_VERSION } from './results-file.constant';
import { PROTOCOL_ROWS, RACE_EVENT } from './spec-utils/race-fixtures';

/** Mapped from `PROTOCOL_ROWS`; the DNF row is kept with a null time and the stub distance. */
export const EXPECTED_EVENT_RESULTS: EventResult[] = [
  { fullName: 'Мария Иванова', gender: Gender.female, timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
  { fullName: 'Олег Петров', gender: Gender.male, timeMs: 900000, distanceKm: TWO_THREE_KM_DISTANCE_KM },
  { fullName: 'Пётр Сидоров', gender: null, timeMs: null, distanceKm: DNF_DISTANCE_KM },
];

/** `buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS)` serialized, as published to the repository. */
export const VALID_RESULTS_TEXT = JSON.stringify({ schemaVersion: RESULTS_FILE_SCHEMA_VERSION, event: RACE_EVENT, rows: PROTOCOL_ROWS });

/** One results file text whose single row carries the given broken fields. */
function brokenRowText(patch: Record<string, unknown>): string {
  return JSON.stringify({ schemaVersion: RESULTS_FILE_SCHEMA_VERSION, event: RACE_EVENT, rows: [{ ...PROTOCOL_ROWS[0], ...patch }] });
}

/**
 * Failing each guard branch: non-object, null, wrong schemaVersion, missing/non-object event,
 * missing/non-array rows, and rows broken field by field (a battle-guard against a
 * hand-edited or corrupted published file).
 */
export const INVALID_RESULTS_TEXTS: (string | null)[] = [
  null,
  'not json',
  '"string"',
  '5',
  'null',
  '{}',
  '{"schemaVersion":2,"event":{},"rows":[]}',
  '{"schemaVersion":1,"rows":[]}',
  '{"schemaVersion":1,"event":null,"rows":[]}',
  '{"schemaVersion":1,"event":"x","rows":[]}',
  '{"schemaVersion":1,"event":{}}',
  '{"schemaVersion":1,"event":{},"rows":{}}',
  '{"schemaVersion":1,"event":{},"rows":[null]}',
  '{"schemaVersion":1,"event":{},"rows":["x"]}',
  '{"schemaVersion":1,"event":{},"rows":[{}]}',
  brokenRowText({ index: '1' }),
  brokenRowText({ fullName: 42 }),
  brokenRowText({ time23: null }),
  brokenRowText({ time5: null }),
  brokenRowText({ gender: 'X' }),
  brokenRowText({ placeM: '1' }),
  brokenRowText({ placeF: '1' }),
  brokenRowText({ club: null }),
  brokenRowText({ note: 42 }),
];
