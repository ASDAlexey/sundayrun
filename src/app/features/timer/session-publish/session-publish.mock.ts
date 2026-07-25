import { Gender } from '../../../core/models/gender.enum';
import { TimerSession } from '../../../core/timer/timer-session.interface';
import { TIMER_SESSION_FINISHED } from '../../../core/timer/timer-session.mock';

/** A measurement ready to go: every gender confirmed, no time left waiting for a name. */
export const TIMER_SESSION_READY: TimerSession = {
  ...TIMER_SESSION_FINISHED,
  runners: TIMER_SESSION_FINISHED.runners.map((runner) => ({ ...runner, gender: runner.gender ?? Gender.female })),
  splits: TIMER_SESSION_FINISHED.splits.filter((split) => split.runnerId !== null),
};

/** The two sentences the card says out loud about `TIMER_SESSION_FINISHED` before it would publish. */
export const TIMER_PUBLISH_UNNAMED_TEXT = '2 времени без имени';
export const TIMER_PUBLISH_GENDER_TEXT = 'уточните пол: 1 человек';

/** The protocol link a published measurement offers. */
export const TIMER_PUBLISH_RACE_HREF = '/races/2026-07-26';

/** The `?return=` the guest's «Я организатор» link carries. */
export const TIMER_PUBLISH_ADMIN_HREF = '/admin?return=%2Ftimer';

/** A stopped clock over an empty roster — the test run that must never reach the archive. */
export const TIMER_SESSION_EMPTY: TimerSession = { ...TIMER_SESSION_FINISHED, runners: [], splits: [] };

/** What the card says instead of a gender warning when nobody ran at all. */
export const TIMER_PUBLISH_EMPTY_TEXT = 'в составе никого — сохранять нечего';

/** What «Удалить замер?» says about `TIMER_SESSION_READY` on the finish screen. */
export const TIMER_PUBLISH_REMOVE_NOTE = 'Забег 26 июля 2026 г.: 7 участников · 9 отсечек. Восстановить его будет нельзя.';
