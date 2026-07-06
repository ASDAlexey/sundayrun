import { PROTOCOLS_REPO_BRANCH } from '../core/github/protocols-repo.constant';
import { CDN_IMMUTABLE_FETCH_OPTIONS, CDN_REVALIDATE_FETCH_OPTIONS } from './cdn-fetch.constant';

/** A sha-pinned url is immutable and safe to cache; the branch fallback must revalidate. */
export function cdnFetchOptions(ref: string): RequestInit {
  return ref === PROTOCOLS_REPO_BRANCH ? CDN_REVALIDATE_FETCH_OPTIONS : CDN_IMMUTABLE_FETCH_OPTIONS;
}
