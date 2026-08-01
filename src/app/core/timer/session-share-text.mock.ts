import { SessionShareTextLabels } from './session-share-text.interface';

/** The four headings the builder is handed; kept blunt so the assertions read as the message does. */
export const SHARE_LABELS: SessionShareTextLabels = {
  title: 'Воскресный пробег · 26 июля 2026',
  fiveKm: '5 км',
  twoThreeKm: '2,3 км',
  didNotFinish: 'Не финишировали',
};

/** The published protocol's address, appended under the message when there is one. */
export const SHARE_RACE_URL = 'https://asdalexey.github.io/sundayrun/races/2026-07-26';

/**
 * The whole message of `TIMER_SESSION_FINISHED`: three 5 km finishers by time with their places, the
 * one runner who stopped after the lap without a place, and the rest of the roster as DNF.
 */
export const SHARE_EXPECTED_TEXT = [
  'Воскресный пробег · 26 июля 2026',
  '',
  '5 км',
  '1. Троилин Антон — 23:26,00',
  '2. Попов Алексей — 26:20,00',
  '3. Соколова Анна — 27:00,00',
  '',
  '2,3 км',
  'Романенко Елена — 11:20',
  '',
  'Не финишировали',
  'Попов Игорь',
  'Иванов Дмитрий',
  'Кузнецов Пётр',
].join('\n');
