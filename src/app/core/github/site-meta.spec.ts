import { buildSiteMeta, parseSiteMeta } from './site-meta';
import { EMPTY_SITE_META } from './site-meta.constant';
import {
  BUILT_SITE_META,
  EXISTING_SITE_META,
  MALFORMED_SITE_META_TEXT,
  RAW_START_TIME_INPUT,
  VALID_SITE_META_TEXT,
  WRONG_SHAPE_SITE_META_TEXT,
} from './site-meta.mock';

describe('site-meta', () => {
  it('parses a valid file and falls back to the empty meta for null, malformed or misshapen input', () => {
    expect(parseSiteMeta(VALID_SITE_META_TEXT)).toEqual(EXISTING_SITE_META);
    expect(parseSiteMeta(null)).toEqual(EMPTY_SITE_META);
    expect(parseSiteMeta(MALFORMED_SITE_META_TEXT)).toEqual(EMPTY_SITE_META);
    expect(parseSiteMeta(WRONG_SHAPE_SITE_META_TEXT), 'a non-string startTime is rejected').toEqual(EMPTY_SITE_META);
    expect(parseSiteMeta(null), 'the shared empty constant is never handed out by reference').not.toBe(EMPTY_SITE_META);
  });

  it('builds the committed file from trimmed form input', () => {
    expect(buildSiteMeta(RAW_START_TIME_INPUT)).toEqual(BUILT_SITE_META);
  });
});
