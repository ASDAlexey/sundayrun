import { parseVersionSha } from './version-file';
import {
  MALFORMED_VERSION_RESPONSE_TEXT,
  NON_OBJECT_VERSION_RESPONSE_TEXT,
  NUMERIC_SHA_VERSION_RESPONSE_TEXT,
  SHALESS_VERSION_RESPONSE_TEXT,
  SHORT_SHA_VERSION_RESPONSE_TEXT,
  VERSION_POINTER_RESPONSE_TEXT,
  VERSION_POINTER_SHA_MOCK,
} from './version-file.mock';

describe('parseVersionSha', () => {
  it('extracts a plausible sha and rejects every malformed or implausible body', () => {
    expect(parseVersionSha(VERSION_POINTER_RESPONSE_TEXT)).toBe(VERSION_POINTER_SHA_MOCK);
    expect(parseVersionSha(MALFORMED_VERSION_RESPONSE_TEXT), 'malformed json').toBeNull();
    expect(parseVersionSha(NON_OBJECT_VERSION_RESPONSE_TEXT), 'not an object').toBeNull();
    expect(parseVersionSha(SHALESS_VERSION_RESPONSE_TEXT), 'no sha field').toBeNull();
    expect(parseVersionSha(NUMERIC_SHA_VERSION_RESPONSE_TEXT), 'sha is not a string').toBeNull();
    expect(parseVersionSha(SHORT_SHA_VERSION_RESPONSE_TEXT), 'sha too short to be a commit').toBeNull();
  });
});
