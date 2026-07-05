import { AthleteRecord, AthleteRun } from '../models/athlete-history.interface';
import { AthletesHistory } from '../models/athletes-history.type';
import { normalizeAthleteKey } from './athlete-key';
import { EventRef, EventResult } from './athletes-rollup.interface';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { isoYear } from './iso-year';

/**
 * Applies one event's results to the athletes history and returns a NEW history object
 * (touched records are copied, the input is never mutated). Creates records for new keys
 * (displayName = first-seen trimmed full name), registers the event in `participationSlugs`
 * (DNF included), appends runs where `timeMs` is not null, keeps an already known gender,
 * and recomputes `bestMs`/`bestMsByYear` over 5 km runs only.
 */
export function applyEventToHistory(history: AthletesHistory, event: EventRef, results: EventResult[]): AthletesHistory {
  const nextHistory: AthletesHistory = { ...history };

  for (const result of results) {
    const key = normalizeAthleteKey(result.fullName);
    const record = copyOrCreateRecord(nextHistory[key], key, result);

    if (!record.participationSlugs.includes(event.slug)) {
      record.participationSlugs.push(event.slug);
    }

    if (result.timeMs !== null) {
      record.runs.push({
        dateIso: event.dateIso,
        slug: event.slug,
        timeMs: result.timeMs,
        distanceKm: result.distanceKm,
      });
    }

    recomputeBests(record);
    nextHistory[key] = record;
  }

  return nextHistory;
}

/**
 * Removes the whole contribution of the event `slug` — its runs AND its DNF participations —
 * from all athletes and returns a NEW history object (untouched records are shared, the input
 * is never mutated). Touched records get their `bestMs`/`bestMsByYear` recomputed; athletes
 * left without any participation are dropped from the history.
 */
export function removeEventFromHistory(history: AthletesHistory, slug: string): AthletesHistory {
  return filterHistory(
    history,
    (participation) => participation !== slug,
    (run) => run.slug !== slug,
  );
}

/**
 * Keeps only the contribution of events STRICTLY older than `dateIso` — runs by `run.dateIso`,
 * participations by slug (published slugs are ISO dates, so the lexicographic compare is
 * chronological) — and returns a NEW history object (untouched records are shared, the input is
 * never mutated). Touched records get their `bestMs`/`bestMsByYear` recomputed; athletes left
 * without any participation are dropped. Gives auto-notes the history "as of before the event":
 * the event's own previous publication and any later results are excluded.
 */
export function historyBeforeDate(history: AthletesHistory, dateIso: string): AthletesHistory {
  return filterHistory(
    history,
    (participation) => participation < dateIso,
    (run) => run.dateIso < dateIso,
  );
}

/**
 * Shared filtering core: keeps participations/runs matching the predicates, shares untouched
 * records, recomputes bests on touched ones and drops athletes left without participations.
 */
function filterHistory(
  history: AthletesHistory,
  keepParticipation: (slug: string) => boolean,
  keepRun: (run: AthleteRun) => boolean,
): AthletesHistory {
  const nextHistory: AthletesHistory = {};

  for (const record of Object.values(history)) {
    const participationSlugs = record.participationSlugs.filter(keepParticipation);

    if (participationSlugs.length === record.participationSlugs.length) {
      nextHistory[record.key] = record;
      continue;
    }

    if (participationSlugs.length === 0) {
      continue;
    }

    const nextRecord: AthleteRecord = { ...record, participationSlugs, runs: record.runs.filter(keepRun) };

    recomputeBests(nextRecord);
    nextHistory[record.key] = nextRecord;
  }

  return nextHistory;
}

function copyOrCreateRecord(existing: AthleteRecord | undefined, key: string, result: EventResult): AthleteRecord {
  if (existing === undefined) {
    return {
      key,
      displayName: result.fullName.trim(),
      gender: result.gender,
      participationSlugs: [],
      runs: [],
      bestMs: null,
      bestMsByYear: {},
    };
  }

  return {
    ...existing,
    gender: existing.gender ?? result.gender,
    participationSlugs: [...existing.participationSlugs],
    runs: [...existing.runs],
  };
}

/** Recomputes `bestMs` and `bestMsByYear` from scratch over the record's 5 km runs. */
function recomputeBests(record: AthleteRecord): void {
  record.bestMs = null;
  record.bestMsByYear = {};

  for (const run of record.runs) {
    if (run.distanceKm !== FIVE_KM_DISTANCE_KM) {
      continue;
    }

    if (record.bestMs === null || run.timeMs < record.bestMs) {
      record.bestMs = run.timeMs;
    }

    const year = isoYear(run.dateIso);
    const yearBestMs: number | undefined = record.bestMsByYear[year];

    if (yearBestMs === undefined || run.timeMs < yearBestMs) {
      record.bestMsByYear[year] = run.timeMs;
    }
  }
}
