/** The two nameless times of the fixture session, formatted the way the chips show them. */
export const TAPE_QUEUE_TIME_TEXTS = ['27:35', '28:10'];

/** Whom the lap half of the fixture roster can hand a time to: the one man nobody has tapped. */
export const TAPE_LAP_ROW_NAMES = ['Кузнецов Пётр'];

/** A list of equals explains nothing about its rows — the lap half shows no meta at all. */
export const TAPE_LAP_ROW_META = [''];

/** And whom the finish half can: the one man with a lap and no finish. The two retired ones are out. */
export const TAPE_FINISH_ROW_NAMES = ['Попов Игорь'];

/** The lap he already has, so a surname in a hurry can be checked against something. */
export const TAPE_FINISH_ROW_META = ['круг 11:08'];

/** The counter tail of the first id the tape issues; the second one ends with `-000002`. */
export const TAPE_FIRST_SPLIT_ID_TAIL = '-000001';

/** The tail of the second id — proof the counter, not a clock, keeps the ids apart. */
export const TAPE_SECOND_SPLIT_ID_TAIL = '-000002';

/** «Разобрать» asked for once from the publish card; the panel has to be open at that. */
export const TAPE_ONE_OPEN_REQUEST = 1;

/** What the panel says while the race has not started — the reason «ОТСЕЧКА» is dead. */
export const TAPE_IDLE_HINT = 'Нажмите «Старт» — до старта отсечки не пишутся';
