/** [label, fresh auto note, stored note, merged note]: auto tokens refresh, manual tokens survive. */
export const MERGE_AUTO_NOTE_CASES: readonly (readonly [string, string, string, string])[] = [
  ['both empty', '', '', ''],
  ['auto only', 'Первое участие', '', 'Первое участие'],
  ['manual only survives an empty auto note', '', 'DNF', 'DNF'],
  ['manual text is kept after the fresh auto note', 'Первое участие', 'Дети', 'Первое участие; Дети'],
  ['stale auto tokens are replaced', 'ЛР (было 24:40)', 'ЛР (было 25:00); Лучший результат 2025 г.', 'ЛР (было 24:40)'],
  [
    'the course record token is manual and survives',
    'Лучший результат 2026 г.',
    'ЛР (было 23:49); Рекорд трассы',
    'Лучший результат 2026 г.; Рекорд трассы',
  ],
  ['re-merging is idempotent', 'Первое участие', 'Первое участие; Дети', 'Первое участие; Дети'],
  ['a stale first participation is dropped entirely', '', 'Первое участие', ''],
  ['the legacy record spelling is superseded by the canonical note', 'ЛР (было 18:43)', 'Личный рекорд', 'ЛР (было 18:43)'],
];
