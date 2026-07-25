import { runnerCountText, splitCountText } from './session-list/session-list.text';

/** «вкл» / «выкл» next to a switch in the «⋮» menu — the state is read, not deduced from a shade. */
export function toggleStateText(on: boolean): string {
  return on ? $localize`:@@timer.toggleOn:вкл` : $localize`:@@timer.toggleOff:выкл`;
}

/**
 * The difference that has to be readable before the tap: «Сброс» wipes the times and keeps the
 * people, «Удалить замер» takes the whole thing. Both numbers are the real ones of this race.
 */
export function resetNoteText(runnerCount: number, splitCount: number): string {
  const splits = splitCountText(splitCount);
  const runners = runnerCountText(runnerCount);

  return $localize`:@@timer.resetNote:Времена сотрутся — ${splits}:splits:. Состав останется: ${runners}:runners:, можно бежать заново.`;
}
