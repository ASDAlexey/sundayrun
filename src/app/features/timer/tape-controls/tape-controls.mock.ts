/** The two nameless times of the fixture session, formatted the way the chips show them. */
export const TAPE_QUEUE_TIME_TEXTS = ['27:35', '28:10'];

/** What the handout list says about the seven runners of the fixture roster, in roster order. */
export const TAPE_RUNNER_META_TEXTS = [
  'круг и финиш записаны',
  'круг и финиш записаны',
  'круг записан, ждёт финиш',
  'круг записан, ждёт финиш',
  'круг и финиш записаны',
  'круг записан, ждёт финиш',
  'ждёт круг',
];

/** Which of those rows the core would refuse a third time — they are disabled instead. */
export const TAPE_RUNNER_TAKEN_FLAGS = [true, true, false, false, true, false, false];

/** The counter tail of the first id the tape issues; the second one ends with `-000002`. */
export const TAPE_FIRST_SPLIT_ID_TAIL = '-000001';

/** The tail of the second id — proof the counter, not a clock, keeps the ids apart. */
export const TAPE_SECOND_SPLIT_ID_TAIL = '-000002';

/** «Разобрать» asked for once from the publish card; the panel has to be open at that. */
export const TAPE_ONE_OPEN_REQUEST = 1;

/** What the panel says while the race has not started — the reason both keys are dead. */
export const TAPE_IDLE_HINT = 'Нажмите «Старт» — до старта отсечки не пишутся';

/** And what it says once the clock runs but nothing has been recorded yet. */
export const TAPE_REPEAT_HINT = '«+ ещё один» вешает вторую отсечку на то же время — для тех, кто финишировал грудь в грудь';
