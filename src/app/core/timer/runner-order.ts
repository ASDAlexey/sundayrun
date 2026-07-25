import { medianMs } from '../history/median';
import { ExpectedLapSample } from './runner-order.interface';
import { TimerRunner } from './timer-session.interface';

/** Median first-lap time per athlete key. */
export function expectedLapMsByAthlete(samples: readonly ExpectedLapSample[]): Map<string, number> {
  const lapsByKey = new Map<string, number[]>();

  for (const sample of samples) {
    const laps = lapsByKey.get(sample.key);

    if (laps === undefined) {
      lapsByKey.set(sample.key, [sample.lapMs]);
      continue;
    }

    laps.push(sample.lapMs);
  }

  return new Map([...lapsByKey].map(([key, laps]): [string, number] => [key, medianMs(laps)]));
}

/**
 * Tiles ordered once before the start: known athletes fastest-lap-first, newcomers last in add
 * order (docs/TIMER.md §4). The pack then arrives roughly top-down and the finger walks the grid
 * instead of hunting it. Nothing re-sorts during the race — muscle memory beats tidiness.
 */
export function orderRunnersByExpectedLap(runners: readonly TimerRunner[], expected: ReadonlyMap<string, number>): TimerRunner[] {
  return runners
    .map((runner) => ({ runner, lapMs: expectedLapMsFor(runner, expected) }))
    .sort((left, right) => compareExpectedMs(left.lapMs, right.lapMs))
    .map((entry) => entry.runner);
}

/** The runner's expected lap from the archive, or null for a newcomer and for anyone unseen. */
export function expectedLapMsFor(runner: TimerRunner, expected: ReadonlyMap<string, number>): number | null {
  return runner.athleteKey === null ? null : (expected.get(runner.athleteKey) ?? null);
}

/** Ascending estimate; whoever has no estimate at all waits at the end, in the order given. */
export function compareExpectedMs(left: number | null, right: number | null): number {
  if (left === null || right === null) {
    return Number(left === null) - Number(right === null);
  }

  return left - right;
}
