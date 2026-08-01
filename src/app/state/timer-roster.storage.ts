import { Gender, GenderType } from '../core/models/gender.enum';
import { AthleteRecord } from '../core/models/athlete-history.interface';
import {
  CACHED_ATHLETE_BEST_MS,
  EMPTY_COURSE_RECORD_LAP_MS,
  EMPTY_TIMER_ROSTER_CACHE,
  KEY_NUMBER_PAIR_KEY_INDEX,
  KEY_NUMBER_PAIR_LENGTH,
  KEY_NUMBER_PAIR_VALUE_INDEX,
  TIMER_ROSTER_SCHEMA_VERSION,
} from './timer-roster.constant';
import { CachedAthleteEntry, TimerRosterCache } from './timer-roster.interface';
import { isNonEmptyString, isNullableGender, isNullableNumber, isRecord } from './timer-storage';

/** One cached per-athlete number — a median lap, a best lap or a count — on its way through JSON. */
type KeyNumberPair = [string, number];

/**
 * Reads the cached athlete directory back. Only the three fields the roster sheet needs are stored,
 * so the records are rebuilt as minimal ones — empty runs, no personal best — which is all
 * `suggestAthletes` and the tile order ever look at. The archive read of the first laps rides along
 * as pairs, one per athlete rather than per race, so the whole park stays a few hundred kilobytes.
 * A broken payload, a foreign schema version or a single malformed entry costs the entry, not the
 * sheet: the worst case is a search that comes up empty until the network answers.
 */
export function readTimerRosterCache(raw: string | null): TimerRosterCache {
  if (raw === null) {
    return EMPTY_TIMER_ROSTER_CACHE;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (isRecord(parsed) && parsed['schemaVersion'] === TIMER_ROSTER_SCHEMA_VERSION && typeof parsed['savedAtMs'] === 'number') {
      return {
        records: toRecords(parsed['records']),
        expectedLapMs: toKeyNumberMap(parsed['expectedLapMs']),
        bestLapMs: toKeyNumberMap(parsed['bestLapMs']),
        appearanceCount: toKeyNumberMap(parsed['appearanceCount']),
        courseRecordLapMs: toCourseRecordLapMs(parsed['courseRecordLapMs']),
        savedAtMs: parsed['savedAtMs'],
      };
    }
  } catch {
    // Broken JSON degrades exactly like a wrong shape: the directory is simply not cached yet.
  }

  return EMPTY_TIMER_ROSTER_CACHE;
}

export function serializeTimerRosterCache(cache: TimerRosterCache): string {
  return JSON.stringify({
    schemaVersion: TIMER_ROSTER_SCHEMA_VERSION,
    savedAtMs: cache.savedAtMs,
    records: cache.records.map(toCachedEntry),
    expectedLapMs: [...cache.expectedLapMs],
    bestLapMs: [...cache.bestLapMs],
    appearanceCount: [...cache.appearanceCount],
    courseRecordLapMs: cache.courseRecordLapMs,
  });
}

function toCachedEntry(record: AthleteRecord): CachedAthleteEntry {
  return { key: record.key, displayName: record.displayName, gender: record.gender };
}

function toRecords(value: unknown): AthleteRecord[] {
  const entries = Array.isArray(value) ? value : [];

  return entries.flatMap((entry) => (isCachedAthleteEntry(entry) ? [toMinimalRecord(entry)] : []));
}

/**
 * Enough of an `AthleteRecord` for the search and the tile order; the history stays in the archive.
 * Exported because the materialised `meta` row stores the same three fields and has to rebuild the
 * same minimal records — a directory that differed by its source would make the sheet behave
 * differently offline than online.
 */
export function toMinimalRecord(entry: CachedAthleteEntry): AthleteRecord {
  return {
    key: entry.key,
    displayName: entry.displayName,
    gender: entry.gender,
    participationSlugs: [],
    runs: [],
    bestMs: CACHED_ATHLETE_BEST_MS,
    bestMsByYear: {},
  };
}

function toKeyNumberMap(value: unknown): ReadonlyMap<string, number> {
  const pairs = Array.isArray(value) ? value : [];

  return new Map(pairs.flatMap((pair) => (isKeyNumberPair(pair) ? [pair] : [])));
}

/** A hand-edited or absent record leaves the gender without a mark, exactly like an empty archive. */
function toCourseRecordLapMs(value: unknown): Readonly<Record<GenderType, number | null>> {
  if (!isRecord(value)) {
    return EMPTY_COURSE_RECORD_LAP_MS;
  }

  return { [Gender.male]: toRecordLapMs(value[Gender.male]), [Gender.female]: toRecordLapMs(value[Gender.female]) };
}

function toRecordLapMs(value: unknown): number | null {
  return isNullableNumber(value) ? value : null;
}

function isCachedAthleteEntry(value: unknown): value is CachedAthleteEntry {
  return isRecord(value) && isNonEmptyString(value['key']) && typeof value['displayName'] === 'string' && isNullableGender(value['gender']);
}

function isKeyNumberPair(value: unknown): value is KeyNumberPair {
  return (
    Array.isArray(value) &&
    value.length === KEY_NUMBER_PAIR_LENGTH &&
    isNonEmptyString(value[KEY_NUMBER_PAIR_KEY_INDEX]) &&
    typeof value[KEY_NUMBER_PAIR_VALUE_INDEX] === 'number'
  );
}
