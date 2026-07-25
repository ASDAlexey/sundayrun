import { MAX_SPLITS_PER_RUNNER } from '../../../core/timer/timer-session.constant';

/**
 * Why a key of the panel is dead, said out loud right above it. A grey «ОТСЕЧКА» before the start
 * and a grey «+ ещё один» over an empty journal are both correct and both look broken in silence —
 * so the line either names the missing precondition or explains what the second key is even for.
 */
export function tapeKeysHintText(canCut: boolean, canRepeat: boolean): string | null {
  if (!canCut) {
    return $localize`:@@timer.tapeHintIdle:Нажмите «Старт» — до старта отсечки не пишутся`;
  }

  if (canRepeat) {
    return null;
  }

  return $localize`:@@timer.tapeHintRepeat:«+ ещё один» вешает вторую отсечку на то же время — для тех, кто финишировал грудь в грудь`;
}

/** «Выбросить время?» spells out which time — a queue of four looks the same from a metre away. */
export function tapeDiscardNoteText(timeText: string): string {
  return $localize`:@@timer.tapeDiscardNote:Отсечка ${timeText}:time: так и осталась без имени. Вернуть её будет нельзя — время придётся засекать заново.`;
}

/**
 * What the handout row says about a runner. A row the core would refuse says so in words rather than
 * only by going grey — «плитка молчит», but the queue has to explain itself (docs/TIMER.md §4).
 */
export function tapeRunnerMetaText(splitCount: number): string {
  if (splitCount >= MAX_SPLITS_PER_RUNNER) {
    return $localize`:@@timer.tapeRunnerFull:круг и финиш записаны`;
  }

  return splitCount === 0 ? $localize`:@@timer.tapeRunnerEmpty:ждёт круг` : $localize`:@@timer.tapeRunnerLap:круг записан, ждёт финиш`;
}
