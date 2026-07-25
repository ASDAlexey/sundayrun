import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../history/distance.constant';
import { compareExpectedMs, expectedLapMsFor } from './runner-order';
import { runnerSplitTimesMs, runnerStage } from './session-splits';
import { LAP_SPLIT_INDEX } from './timer-session.constant';
import { TimerRunnerStage } from './timer-session.enum';
import { TimerSession } from './timer-session.interface';

/** Even-pace forecast of the 5 km finish from a recorded 2.3 km split, in whole milliseconds. */
export function forecastFinishMs(lapMs: number): number {
  return Math.round((lapMs * FIVE_KM_DISTANCE_KM) / TWO_THREE_KM_DISTANCE_KM);
}

/**
 * Runner ids in the order they are expected to arrive next — the «на подходе» shelf (docs/TIMER.md
 * §4). Before the lap the only thing we know is the athlete's own median 2.3 km from the archive;
 * after it the forecast is redone from the lap he actually ran. Both estimates are elapsed times
 * from the mass start, so they queue up together. Whoever finished or retired is not coming, and
 * a runner without any history waits at the end of the queue.
 */
export function expectedNextRunnerIds(session: TimerSession, expected: ReadonlyMap<string, number>): string[] {
  const arrivals: { runnerId: string; estimateMs: number | null }[] = [];

  for (const runner of session.runners) {
    const stage = runnerStage(session, runner.id);

    if (stage === TimerRunnerStage.waitingLap) {
      arrivals.push({ runnerId: runner.id, estimateMs: expectedLapMsFor(runner, expected) });
    }

    if (stage === TimerRunnerStage.waitingFinish) {
      arrivals.push({ runnerId: runner.id, estimateMs: forecastFinishMs(runnerSplitTimesMs(session, runner.id)[LAP_SPLIT_INDEX]) });
    }
  }

  return arrivals.sort((left, right) => compareExpectedMs(left.estimateMs, right.estimateMs)).map((arrival) => arrival.runnerId);
}
