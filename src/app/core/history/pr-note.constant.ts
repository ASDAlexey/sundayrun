/** Splits a stored note around its «ЛР (было X)» token: the text before the time, the time, the text after. */
export const PR_NOTE_SPLIT_PATTERN = /^(.*ЛР \(было )([\d,.:]+)(\).*)$/;

/** Joins the previous time and its date inside the record note: 'ЛР (было 20:52 · 12 янв 2025)'. */
export const PR_NOTE_DATE_SEPARATOR = ' · ';
