import { EventResult } from '../history/athletes-rollup.interface';
import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';
import { DNF_DISTANCE_KM, RESULTS_FILE_SCHEMA_VERSION } from './results-file.constant';
import { EventResultsFile } from './results-file.interface';

export function buildEventResultsFile(event: RaceEvent, rows: ProtocolRow[]): EventResultsFile {
  return { schemaVersion: RESULTS_FILE_SCHEMA_VERSION, event, rows };
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
