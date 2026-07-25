/**
 * The journal of the fixture session as the history lists it: «номер · время · кому принадлежит», in
 * tap order — the whole lap pack first, then the finishes, then the two times without a name.
 */
export const HISTORY_EXPECTED_LINES = [
  '1 9:26 Троилин Антон',
  '2 11:08 Попов Игорь',
  '3 11:20 Романенко Елена',
  '4 11:41 Попов Алексей',
  '5 12:00 Соколова Анна',
  '6 12:34 Иванов Дмитрий',
  '7 23:26 Троилин Антон',
  '8 26:20 Попов Алексей',
  '9 27:00 Соколова Анна',
  '10 27:35 —',
  '11 28:10 —',
];

/** What an entry with no owner renders as in the projection above. */
export const HISTORY_NOBODY = '—';

/** The question the first row asks — the position, the time and whose it is. */
export const HISTORY_REMOVE_NOTE = 'Запись 1 — 9:26, Троилин Антон. Журнал — первоисточник: вернуть строку будет нельзя.';

/** And the same question about a time nobody has claimed yet. */
export const HISTORY_REMOVE_ORPHAN_NOTE = 'Запись 11 — 28:10, без имени. Журнал — первоисточник: вернуть строку будет нельзя.';
