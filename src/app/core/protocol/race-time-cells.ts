import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../history/distance.constant';
import { ProtocolRow } from '../models/protocol-row.interface';
import { formatDuration, formatRaceTime, parseDuration } from '../time/duration';
import { MS_IN_SECOND } from '../time/duration.constant';

/**
 * Whether the 2.3 km column of a protocol draws its hundredths, decided for the column as a whole.
 *
 * An event was either measured on the stopwatch — every split down to the millisecond — or typed up
 * from a sheet, where nothing is ever finer than a second. Drawing ',00' down a column that has
 * nothing else it could ever say is noise, so the column follows whichever reading in it has
 * something to show; that keeps the column one shape either way.
 *
 * The 5 km column makes no such bargain: it always carries the fraction. Its times come from
 * `total_ms`, which has held the milliseconds all along, and reading a finish to the hundredth is
 * the point of the whole thing.
 */
export function lapsCarryHundredths(lapsMs: readonly (number | null)[]): boolean {
  return lapsMs.some((ms) => ms !== null && ms % MS_IN_SECOND !== 0);
}

/** The 2.3 km cell in the form its column settled on. */
export function lapTimeText(ms: number, withHundredths: boolean): string {
  return withHundredths ? formatRaceTime(ms) : formatDuration(ms);
}

/**
 * One lap reading standing on its own — a card, a row of the athlete's table, a standing record.
 * The same rule with a sample of one: the reading shows hundredths only if it has any of its own.
 */
export function lapTimeTextOf(ms: number): string {
  return lapTimeText(ms, lapsCarryHundredths([ms]));
}

/**
 * Redraws a stored protocol's time cells.
 *
 * The archive keeps them as the text the protocol was published with, and every protocol published
 * before the site drew the fraction wrote whole seconds — even for the events the stopwatch timed to
 * the millisecond, whose `total_ms` still holds every one of them. So the 5 km cell is rebuilt from
 * `total_ms`, recovering the hundredths that were only ever rounded away at display time, while the
 * 2.3 km cell is reparsed from its text and follows `lapsCarryHundredths` for its column.
 *
 * Text that is not a time — an empty cell, the archive's 'DNF' — is left exactly as it is.
 */
export function withRaceTimeCells(rows: ProtocolRow[]): ProtocolRow[] {
  const withHundredths = lapsCarryHundredths(rows.map(lapMsOf));

  return rows.map((row) => ({
    ...row,
    time23: lapCell(row.time23, lapMsOf(row), withHundredths),
    time5: finishCell(row.time5, row.distanceKm === FIVE_KM_DISTANCE_KM ? row.totalMs : null),
  }));
}

/** A 2.3 km runner's own total IS their lap; a 5 km row keeps its split in the cell's text. */
function lapMsOf(row: ProtocolRow): number | null {
  return row.distanceKm === TWO_THREE_KM_DISTANCE_KM ? row.totalMs : parseDuration(row.time23);
}

function lapCell(text: string, ms: number | null, withHundredths: boolean): string {
  return ms === null ? text : lapTimeText(ms, withHundredths);
}

function finishCell(text: string, ms: number | null): string {
  const value = ms ?? parseDuration(text);

  return value === null ? text : formatRaceTime(value);
}
