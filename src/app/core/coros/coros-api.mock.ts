import { CorosActivity, CorosActivityRow } from './coros-api.interface';

export const COROS_TOKEN_MOCK = 'token-mock';

export const COROS_EMAIL_MOCK = 'runner@example.com';

export const COROS_PASSWORD_MOCK = 'correct horse battery staple';

/** MD5 of `COROS_PASSWORD_MOCK` — what the login body must carry instead of the password. */
export const COROS_PASSWORD_MD5_MOCK = '9cc2ae8a1ba7a93da39b46fc1019c481';

export const COROS_RACE_DATE_ISO_MOCK = '2026-07-26';

export const COROS_LABEL_ID_MOCK = '479170300641050727';

export const COROS_FILE_URL_MOCK = 'https://s3eu.coros.com/gpx/445823834382155776/479170300641050727.gpx';

export const COROS_GPX_MOCK = '<?xml version="1.0" encoding="UTF-8"?><gpx><trk><trkseg /></trk></gpx>';

/** The 5 km race of that Sunday, as the query endpoint reports it. */
export const COROS_RACE_ROW_MOCK: CorosActivityRow = {
  labelId: COROS_LABEL_ID_MOCK,
  date: 20260726,
  distance: 5042.93,
  totalTime: 1400,
  sportType: 100,
  name: 'Taganrog Run',
};

export const COROS_RACE_ACTIVITY_MOCK: CorosActivity = {
  labelId: COROS_LABEL_ID_MOCK,
  dateIso: COROS_RACE_DATE_ISO_MOCK,
  distanceM: 5042.93,
  totalTimeS: 1400,
  sportType: 100,
  name: 'Taganrog Run',
};

/** A warm-up from the same morning: valid, but far too short to be the race. */
export const COROS_WARMUP_ROW_MOCK: CorosActivityRow = {
  labelId: '479170300641050728',
  date: 20260726,
  distance: 1117.74,
  totalTime: 486,
  sportType: 100,
  name: 'Taganrog Run',
};

/** Rows Coros can technically return but nothing can be matched on. */
export const COROS_BROKEN_ROWS_MOCK: CorosActivityRow[] = [
  { ...COROS_RACE_ROW_MOCK, labelId: undefined },
  { ...COROS_RACE_ROW_MOCK, date: undefined },
  { ...COROS_RACE_ROW_MOCK, date: 202607 },
  { ...COROS_RACE_ROW_MOCK, distance: undefined },
  { ...COROS_RACE_ROW_MOCK, totalTime: undefined },
  { ...COROS_RACE_ROW_MOCK, sportType: undefined },
];

export const COROS_FAILURE_BODY_MOCK = { result: '1001', message: 'token expired' };
