import { formatRaceTime } from '../../../core/time/duration';
import { TimerTapeMode, TimerTapeModeType } from './tape-controls.enum';

/** What the open sheet is about, said in its own heading — the keys behind it are covered up. */
export function tapeHeadingText(mode: TimerTapeModeType): string {
  return mode === TimerTapeMode.lap
    ? $localize`:@@timer.tapeHeadingLap:Разобрать круг`
    : $localize`:@@timer.tapeHeadingFinish:Разобрать финиш`;
}

/**
 * What a row of the handout says about a runner. Handing out laps it says nothing: everybody in that
 * list is in the same state, and «плитка молчит» goes for a list of surnames too. Handing out finishes
 * it shows the lap he already has — the one fact that tells two similar names apart.
 */
export function tapeRunnerMetaText(mode: TimerTapeModeType, lapMs: number | undefined): string {
  if (mode === TimerTapeMode.lap || lapMs === undefined) {
    return '';
  }

  return $localize`:@@timer.tapeRunnerLap:круг ${formatRaceTime(lapMs)}:lap:`;
}

/** The queue is empty — everything recorded has a name on it now. */
export function tapeQueueDoneText(): string {
  return $localize`:@@timer.tapeQueueDone:Очередь разобрана.`;
}

/** The queue is not empty, but this half of it has nobody left to give a time to. */
export function tapeNobodyWaitingText(mode: TimerTapeModeType): string {
  return mode === TimerTapeMode.lap
    ? $localize`:@@timer.tapeNobodyLap:Круг прошли все — время уходит в финиш.`
    : $localize`:@@timer.tapeNobodyFinish:Финишировали все — время уходит в круг.`;
}
