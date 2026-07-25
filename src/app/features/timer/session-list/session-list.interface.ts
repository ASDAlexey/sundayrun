import { TimerPublishStateType } from '../../../core/timer/timer-session.enum';
import { TimerSession } from '../../../core/timer/timer-session.interface';

/**
 * One line of «Мои замеры». The measurement itself rides along, so every action of the row menu
 * works from what is already on screen instead of looking the id up again.
 */
export interface TimerSessionRow {
  session: TimerSession;
  /** «26 июля 2026 г.» */
  dateText: string;
  /** «15 участников · 30 отсечек · 2 без имени» */
  metaText: string;
  status: TimerPublishStateType;
  /** Name the export is saved under, e.g. `sundayrun-2026-07-26.xlsx`. */
  fileName: string;
}

/** The «Удалить замер?» question in flight: which measurement it is about and how it words the loss. */
export interface TimerSessionRemove {
  id: string;
  note: string;
}
