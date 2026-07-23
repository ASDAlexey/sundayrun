import { AthleteRun } from '../models/athlete-history.interface';
import { Gender, GenderType } from '../models/gender.enum';
import { parseDuration } from '../time/duration';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { AthleteFirstLap } from './first-lap.interface';
import { isoYear } from './iso-year';
import { medianRatio } from './median';
import {
  PACING_EVEN_MAX_INDEX,
  PACING_EVEN_MIN_INDEX,
  PACING_INDEX_MAX,
  PACING_INDEX_MIN,
  PACING_MIN_RUNS,
  SECOND_LAP_DISTANCE_KM,
} from './pacing.constant';
import { PacingProfile, PacingProfileType } from './pacing.enum';
import {
  AthletePacing,
  BestSplitRun,
  EvenestRunner,
  EvenestTally,
  LapDeltaRow,
  MeetingSplits,
  PacingBoards,
  PacingRow,
  SecondHalfFinisher,
  SecondHalfTally,
  SplitLeadMeeting,
} from './pacing.interface';

/**
 * «Раскладка»: how a finish splits between the 2,3 км and the 2,7 км laps. The laps differ in
 * length, so raw lap times never compare directly — the pacing index normalizes them to paces:
 * lap 2 pace over lap 1 pace. 1 is perfectly even, below 1 is the rare negative split, above 1 the
 * runner faded. Everything here computes on the fly from the protocol splits; nothing is stored.
 */

/**
 * The pacing index of one finish, or null when the splits are implausible: a non-positive lap or
 * an index outside the noise corridor (the timers hand-press the lap button, and a protocol
 * occasionally stores a physically impossible split).
 */
export function pacingIndex(lapMs: number, totalMs: number): number | null {
  const secondLapMs = totalMs - lapMs;

  if (lapMs <= 0 || secondLapMs <= 0) {
    return null;
  }

  const index = secondLapMs / SECOND_LAP_DISTANCE_KM / (lapMs / TWO_THREE_KM_DISTANCE_KM);

  return index < PACING_INDEX_MIN || index > PACING_INDEX_MAX ? null : index;
}

/** The second lap ran at a faster pace than the first — the real rarity worth a protocol mark. */
export function isNegativeSplit(index: number): boolean {
  return index < 1;
}

/**
 * The athlete's typical pacing over every 5 km finish with a plausible recorded split, joined by
 * the event slug. Null below PACING_MIN_RUNS valid splits — the card hides rather than guesses.
 * On equal indexes the earlier run keeps `bestSplit`, per the site convention.
 */
export function athletePacing(runs: AthleteRun[], laps: AthleteFirstLap[]): AthletePacing | null {
  const lapMsBySlug = new Map(laps.map((lap) => [lap.slug, lap.lapMs]));
  const splitRuns = runs.flatMap<BestSplitRun>((run) => {
    const lapMs = run.distanceKm === FIVE_KM_DISTANCE_KM ? lapMsBySlug.get(run.slug) : undefined;
    const index = lapMs === undefined ? null : pacingIndex(lapMs, run.timeMs);

    return index === null ? [] : [{ slug: run.slug, dateIso: run.dateIso, index }];
  });

  if (splitRuns.length < PACING_MIN_RUNS) {
    return null;
  }

  let bestSplit = splitRuns[0];

  for (const run of splitRuns) {
    if (run.index < bestSplit.index || (run.index === bestSplit.index && run.dateIso < bestSplit.dateIso)) {
      bestSplit = run;
    }
  }

  const medianIndex = medianRatio(splitRuns.map((run) => run.index));

  return {
    profile: profileOf(medianIndex),
    medianIndex,
    validCount: splitRuns.length,
    negativeSplitCount: splitRuns.filter((run) => isNegativeSplit(run.index)).length,
    bestSplit,
  };
}

/**
 * Row index → places gained on lap 2 («+3 места на втором круге»): the row's rank by the first-lap
 * split minus its rank by the finish time, both among the 5 km finishers whose splits pass the
 * plausibility corridor. One-lap runners, DNF, split-less and noisy rows stay null. Rank ties
 * break by the other time, then by the row order, so a dead heat never invents an overtake.
 */
export function lapPlaceDeltas(rows: readonly LapDeltaRow[]): (number | null)[] {
  return lapDeltas(
    rows.map((row) => ({
      lapMs: row.distanceKm === FIVE_KM_DISTANCE_KM ? parseDuration(row.time23) : null,
      totalMs: row.totalMs,
    })),
  );
}

/**
 * The two season nominations of one scope (`year` = 'YYYY', null = all time), decided per gender:
 * «самый ровный бегун» by the smallest median deviation from the even index, and «лучший финишёр
 * второй половины» by the most on-course places gained on lap 2. Both need PACING_MIN_RUNS valid
 * splits; the second also demands a positive total — nobody wins it by losing the fewest places.
 */
export function pacingBoards(rows: PacingRow[], year: string | null): PacingBoards {
  const scoped = rows.filter((row) => year === null || isoYear(row.slug) === year);

  return { evenest: evenestOf(scoped), secondHalf: secondHalfOf(scoped) };
}

/**
 * Aligned with the meetings: both duellists' first-lap splits of the shared race, or null when
 * either side lacks a recorded split or fails the plausibility corridor.
 */
export function meetingSplitLeads(
  meetings: readonly SplitLeadMeeting[],
  leftLaps: AthleteFirstLap[],
  rightLaps: AthleteFirstLap[],
): (MeetingSplits | null)[] {
  const leftBySlug = new Map(leftLaps.map((lap) => [lap.slug, lap.lapMs]));
  const rightBySlug = new Map(rightLaps.map((lap) => [lap.slug, lap.lapMs]));

  return meetings.map((meeting) => {
    const leftLapMs = leftBySlug.get(meeting.slug);
    const rightLapMs = rightBySlug.get(meeting.slug);

    if (leftLapMs === undefined || rightLapMs === undefined) {
      return null;
    }

    const bothPlausible = pacingIndex(leftLapMs, meeting.leftMs) !== null && pacingIndex(rightLapMs, meeting.rightMs) !== null;

    return bothPlausible ? { leftLapMs, rightLapMs } : null;
  });
}

function profileOf(medianIndex: number): PacingProfileType {
  if (medianIndex < PACING_EVEN_MIN_INDEX) {
    return PacingProfile.negative;
  }

  return medianIndex > PACING_EVEN_MAX_INDEX ? PacingProfile.fade : PacingProfile.even;
}

/** The shared rank scan behind the protocol column and the season aggregate. */
function lapDeltas(entries: readonly { lapMs: number | null; totalMs: number | null }[]): (number | null)[] {
  const candidates = entries.flatMap((entry, rowIndex) =>
    entry.lapMs === null || entry.totalMs === null || pacingIndex(entry.lapMs, entry.totalMs) === null
      ? []
      : [{ rowIndex, lapMs: entry.lapMs, totalMs: entry.totalMs, finishRank: 0 }],
  );

  [...candidates]
    .sort((left, right) => left.totalMs - right.totalMs || left.rowIndex - right.rowIndex)
    .forEach((candidate, rank) => {
      candidate.finishRank = rank;
    });

  const deltas = entries.map<number | null>(() => null);

  [...candidates]
    .sort((left, right) => left.lapMs - right.lapMs || left.totalMs - right.totalMs || left.rowIndex - right.rowIndex)
    .forEach((candidate, lapRank) => {
      deltas[candidate.rowIndex] = lapRank - candidate.finishRank;
    });

  return deltas;
}

function evenestOf(rows: PacingRow[]): Record<GenderType, EvenestRunner | null> {
  const tallies = new Map<string, EvenestTally>();

  for (const row of rows) {
    const index = pacingIndex(row.lapMs, row.totalMs);

    if (index === null || row.gender === null) {
      continue;
    }

    const tally = tallies.get(row.key) ?? { key: row.key, displayName: row.displayName, gender: row.gender, deviations: [] };

    tally.deviations.push(Math.abs(index - 1));
    tallies.set(row.key, tally);
  }

  const board: Record<GenderType, EvenestRunner | null> = { [Gender.male]: null, [Gender.female]: null };

  for (const tally of tallies.values()) {
    if (tally.deviations.length < PACING_MIN_RUNS) {
      continue;
    }

    const runner = {
      key: tally.key,
      displayName: tally.displayName,
      deviation: medianRatio(tally.deviations),
      count: tally.deviations.length,
    };
    const standing = board[tally.gender];

    if (standing === null || compareEvenest(runner, standing) < 0) {
      board[tally.gender] = runner;
    }
  }

  return board;
}

/** Smaller deviation wins; a tie goes to the larger sample, then to the name. */
function compareEvenest(left: EvenestRunner, right: EvenestRunner): number {
  return left.deviation - right.deviation || right.count - left.count || left.displayName.localeCompare(right.displayName);
}

function secondHalfOf(rows: PacingRow[]): Record<GenderType, SecondHalfFinisher | null> {
  const bySlug = new Map<string, PacingRow[]>();

  for (const row of rows) {
    const event = bySlug.get(row.slug) ?? [];

    event.push(row);
    bySlug.set(row.slug, event);
  }

  const tallies = new Map<string, SecondHalfTally>();

  for (const event of bySlug.values()) {
    const deltas = lapDeltas(event);

    event.forEach((row, index) => {
      const delta = deltas[index];

      if (delta === null || row.gender === null) {
        return;
      }

      const tally = tallies.get(row.key) ?? { key: row.key, displayName: row.displayName, gender: row.gender, gainedPlaces: 0, count: 0 };

      tally.gainedPlaces += delta;
      tally.count += 1;
      tallies.set(row.key, tally);
    });
  }

  const board: Record<GenderType, SecondHalfFinisher | null> = { [Gender.male]: null, [Gender.female]: null };

  for (const tally of tallies.values()) {
    if (tally.count < PACING_MIN_RUNS || tally.gainedPlaces <= 0) {
      continue;
    }

    const finisher = { key: tally.key, displayName: tally.displayName, gainedPlaces: tally.gainedPlaces, count: tally.count };
    const standing = board[tally.gender];

    if (standing === null || compareSecondHalf(finisher, standing) < 0) {
      board[tally.gender] = finisher;
    }
  }

  return board;
}

/** More gained places win; a tie goes to the smaller sample (denser gains), then to the name. */
function compareSecondHalf(left: SecondHalfFinisher, right: SecondHalfFinisher): number {
  return right.gainedPlaces - left.gainedPlaces || left.count - right.count || left.displayName.localeCompare(right.displayName);
}
