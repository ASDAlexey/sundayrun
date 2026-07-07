import { PROTOCOLS_REPO_BRANCH } from '../core/github/protocols-repo.constant';
import { cdnFetchOptions } from './cdn-fetch';
import { CDN_IMMUTABLE_FETCH_OPTIONS, CDN_REVALIDATE_FETCH_OPTIONS } from './cdn-fetch.constant';
import { CDN_REF_SHA_MOCK } from './cdn-ref.service.mock';

describe('cdnFetchOptions', () => {
  it('revalidates the branch ref and lets a sha-pinned url use the default caching', () => {
    expect(cdnFetchOptions(PROTOCOLS_REPO_BRANCH)).toBe(CDN_REVALIDATE_FETCH_OPTIONS);
    expect(cdnFetchOptions(CDN_REF_SHA_MOCK)).toBe(CDN_IMMUTABLE_FETCH_OPTIONS);
  });
});
