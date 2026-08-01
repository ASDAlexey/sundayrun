import { CorosRegion } from '../core/coros/coros-region.enum';
import { TrackSource } from './track-source.enum';
import { WatchAccount } from './watch-account.interface';

export const WATCH_EMAIL_MOCK = 'runner@example.com';

export const WATCH_PASSWORD_MOCK = 'correct horse battery staple';

export const WATCH_TOKEN_MOCK = 'token-mock';

export const STORED_WATCH_ACCOUNT: WatchAccount = {
  source: TrackSource.Coros,
  email: WATCH_EMAIL_MOCK,
  region: CorosRegion.Eu,
  token: WATCH_TOKEN_MOCK,
};

export const STORED_WATCH_ACCOUNT_JSON = JSON.stringify(STORED_WATCH_ACCOUNT);

/** Everything a hand-edited or half-written value can look like; all degrade to «not linked». */
export const UNUSABLE_WATCH_ACCOUNT_JSONS = [
  '{not json',
  'null',
  '"a string"',
  JSON.stringify({ ...STORED_WATCH_ACCOUNT, token: '' }),
  JSON.stringify({ ...STORED_WATCH_ACCOUNT, token: 7 }),
  JSON.stringify({ email: WATCH_EMAIL_MOCK }),
  JSON.stringify({ token: WATCH_TOKEN_MOCK }),
  JSON.stringify({ token: WATCH_TOKEN_MOCK, email: WATCH_EMAIL_MOCK }),
  // A region that is a string but not one of the three hosts: `COROS_REGION_API_URLS` answers
  // `undefined` for it, and the api templates would then send the session token to our own origin.
  JSON.stringify({ ...STORED_WATCH_ACCOUNT, region: 'moon' }),
];
