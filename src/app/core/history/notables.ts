import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import {
  ISO_DATE_LENGTH,
  NOTABLE_MIN_CAREER_RUNS,
  NOTABLE_MIN_WINDOW_RUNS,
  NOTABLE_TOP_RANK_LIMIT,
  NOTABLE_WINDOW_MONTHS,
} from './notables.constant';
import { NotableKind } from './notables.enum';
import { Notable, ParticipantRun } from './notables.interface';

/**
 * Smashrun-style notables for one event, keyed by athlete: «2-й результат за всё время»,
 * «лучший результат за 6 месяцев». Computed against each finisher's 5 km runs up to the event
 * date, so an old protocol keeps the facts as they stood on race day. Rank 1 stays silent — the
 * stored «ЛР» auto note already marks it — and so do short histories and thin windows, where
 * every run would trivially be a top result.
 */
export function buildEventNotables(participantRuns: ParticipantRun[], slug: string, dateIso: string): Record<string, Notable> {
  const runsByAthlete = new Map<string, ParticipantRun[]>();

  for (const run of participantRuns) {
    // One-lap runs never rank, and runs after the event must not rewrite its history.
    if (run.distanceKm !== FIVE_KM_DISTANCE_KM || run.dateIso > dateIso) {
      continue;
    }

    const athleteRuns = runsByAthlete.get(run.athleteKey) ?? [];

    athleteRuns.push(run);
    runsByAthlete.set(run.athleteKey, athleteRuns);
  }

  const notables: Record<string, Notable> = {};

  for (const [athleteKey, athleteRuns] of runsByAthlete) {
    const notable = athleteNotable(athleteRuns, slug, dateIso);

    if (notable !== null) {
      notables[athleteKey] = notable;
    }
  }

  return notables;
}

function athleteNotable(athleteRuns: ParticipantRun[], slug: string, dateIso: string): Notable | null {
  const current = athleteRuns.find((run) => run.slug === slug);

  // The athlete ran the short course at this event (DNF rows never reach `runs` at all).
  if (current === undefined) {
    return null;
  }

  const others = athleteRuns.filter((run) => run !== current);
  const rank = 1 + others.filter((run) => run.timeMs < current.timeMs).length;

  if (rank === 1) {
    return null;
  }

  if (rank <= NOTABLE_TOP_RANK_LIMIT && athleteRuns.length >= NOTABLE_MIN_CAREER_RUNS) {
    return { kind: NotableKind.allTimeRank, rank };
  }

  const windowStartIso = monthsBefore(dateIso, NOTABLE_WINDOW_MONTHS);
  const windowRuns = others.filter((run) => run.dateIso >= windowStartIso);

  if (windowRuns.length >= NOTABLE_MIN_WINDOW_RUNS && windowRuns.every((run) => current.timeMs < run.timeMs)) {
    return { kind: NotableKind.windowBest, rank: null };
  }

  return null;
}

/** ISO date `months` calendar months back; the overflow of a short month rolls forward like `setMonth`. */
function monthsBefore(dateIso: string, months: number): string {
  const date = new Date(dateIso);

  date.setUTCMonth(date.getUTCMonth() - months);

  return date.toISOString().slice(0, ISO_DATE_LENGTH);
}
