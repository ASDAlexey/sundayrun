/** A finish drawn to hundredths — the shape every result on the site arrives in. */
export const RACE_TIME_WITH_FRACTION = '23:04,18';

/** An hour-long time: the split must fall on the fraction, not on the first colon. */
export const RACE_TIME_OVER_AN_HOUR = '1:02:03,02';

/** A cell that is not a time at all; it has to survive whole. */
export const RACE_TIME_WITHOUT_FRACTION = 'DNF';

/** An auto-note: the time sits inside the sentence, and the text around it must not be touched. */
export const RACE_TIME_IN_SENTENCE = 'ЛР (было 23:05,00)';

/** A season's medians side by side — two fractions in one value, both of them junior. */
export const RACE_TIME_PAIR = '23:05,00 → 22:50,10';
