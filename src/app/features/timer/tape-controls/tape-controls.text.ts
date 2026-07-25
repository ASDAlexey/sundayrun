import { formatDuration } from '../../../core/time/duration';
import { TimerTapeMode, TimerTapeModeType } from './tape-controls.enum';

/**
 * Why the key is dead, said out loud right above it. A grey «ОТСЕЧКА» before the start is correct
 * and looks broken in silence — so the line names the precondition that is missing.
 */
export function tapeKeysHintText(canCut: boolean): string | null {
  return canCut ? null : $localize`:@@timer.tapeHintIdle:Нажмите «Старт» — до старта отсечки не пишутся`;
}

/** «Выбросить время?» spells out which time — a queue of four looks the same from a metre away. */
export function tapeDiscardNoteText(timeText: string): string {
  return $localize`:@@timer.tapeDiscardNote:Отсечка ${timeText}:time: так и осталась без имени. Вернуть её будет нельзя — время придётся засекать заново.`;
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

  return $localize`:@@timer.tapeRunnerLap:круг ${formatDuration(lapMs)}:lap:`;
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
