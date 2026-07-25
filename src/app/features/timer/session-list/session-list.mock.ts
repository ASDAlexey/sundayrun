import { TimerPublishState } from '../../../core/timer/timer-session.enum';
import { TimerSession } from '../../../core/timer/timer-session.interface';
import { TIMER_SESSION_FINISHED } from '../../../core/timer/timer-session.mock';

/** The same race a week earlier, already in the archive. */
export const TIMER_SESSION_PUBLISHED: TimerSession = {
  ...TIMER_SESSION_FINISHED,
  id: 'session-2026-07-19',
  dateIso: '2026-07-19',
  publish: { state: TimerPublishState.published, error: null, sha: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' },
};

/** A race the commit never reached — the row that carries «Не отправлено». */
export const TIMER_SESSION_FAILED: TimerSession = {
  ...TIMER_SESSION_FINISHED,
  id: 'session-2026-07-12',
  dateIso: '2026-07-12',
  publish: { state: TimerPublishState.failed, error: 'Не удалось отправить забег.', sha: null },
};

/** A race whose commit is in flight — «Публикуется…». */
export const TIMER_SESSION_PENDING: TimerSession = {
  ...TIMER_SESSION_FINISHED,
  id: 'session-2026-07-05',
  dateIso: '2026-07-05',
  publish: { state: TimerPublishState.pending, error: null, sha: null },
};

/** A measurement where every time found its name — its meta line says nothing about unnamed ones. */
export const TIMER_SESSION_CLEAN: TimerSession = {
  ...TIMER_SESSION_FINISHED,
  id: 'session-2026-06-28',
  dateIso: '2026-06-28',
  splits: TIMER_SESSION_FINISHED.splits.filter((split) => split.runnerId !== null),
};

/** The five rows «Мои замеры» shows, newest first, as the store hands them over. */
export const TIMER_SESSION_LIST: TimerSession[] = [
  TIMER_SESSION_FINISHED,
  TIMER_SESSION_PUBLISHED,
  TIMER_SESSION_FAILED,
  TIMER_SESSION_PENDING,
  TIMER_SESSION_CLEAN,
];

/** What the newest row spells out: the long date, the counters and the export file name. */
export const TIMER_ROW_DATE_TEXT = '26 июля 2026 г.';
export const TIMER_ROW_META_TEXT = '7 участников · 11 отсечек · 2 без имени';
export const TIMER_ROW_FILE_NAME = 'sundayrun-2026-07-26.xlsx';

/** The fully sorted-out measurement's meta line — no unnamed tail at all. */
export const TIMER_ROW_CLEAN_META_TEXT = '7 участников · 9 отсечек';

/** The five status pills, in list order. */
export const TIMER_ROW_STATUS_TEXTS = [
  'Сохранено на устройстве',
  'Опубликовано',
  'Не отправлено',
  'Публикуется…',
  'Сохранено на устройстве',
];

/** The `?return=` the guest's «Опубликовать» link carries. */
export const TIMER_ROW_ADMIN_HREF = '/admin?return=%2Ftimer';

/** A transient object url, so the download never touches the real URL registry. */
export const TIMER_EXPORT_OBJECT_URL = 'blob:timer-export';

/** What «Удалить замер?» says about the newest row — the date, the counters and that it is final. */
export const TIMER_ROW_REMOVE_NOTE = 'Забег 26 июля 2026 г.: 7 участников · 11 отсечек · 2 без имени. Восстановить его будет нельзя.';
