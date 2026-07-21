import { Mock, vi } from 'vitest';

import { CdnRefService } from './cdn-ref.service';

/** Stands in for the pointer sha the real service reads from the CDN. */
export const CDN_REF_SHA_MOCK = 'cdn-ref-head-sha';

/** A plausible remembered fresh sha — `resolve` only trusts full 40-char hex shas. */
export const STORED_FRESH_SHA_MOCK = 'cccccccccccccccccccccccccccccccccccccccc';

/** A stored fresh-sha payload as `noteFreshSha` writes it. */
export function storedFreshShaRaw(sha: string, atMs: number): string {
  return JSON.stringify({ sha, atMs });
}

/** Every malformed stored shape must degrade to the regular pointer read. */
export const MALFORMED_STORED_FRESH_RAWS: string[] = [
  '{not json',
  'null',
  '42',
  '{}',
  '{"sha":5}',
  `{"sha":"${STORED_FRESH_SHA_MOCK}"}`,
  `{"sha":"${STORED_FRESH_SHA_MOCK}","atMs":"later"}`,
];

export const VERSION_POINTER_ERROR_STATUS = 404;

export const CDN_REF_NETWORK_ERROR_MESSAGE = 'cdn unreachable';

/** The mocked surface: `noteFreshSha` stays a spy so specs can assert the remembered sha. */
export interface CdnRefServiceMock extends Pick<CdnRefService, 'pin' | 'resolve'> {
  noteFreshSha: Mock<(sha: string) => void>;
}

/** Drop-in `CdnRefService`: no network, `pin` re-points `resolve` like the real one. */
export function cdnRefServiceMock(initialRef: string = CDN_REF_SHA_MOCK): CdnRefServiceMock {
  let ref = initialRef;

  return {
    resolve: () => Promise.resolve(ref),
    pin: (commitSha: string) => {
      ref = commitSha;
    },
    noteFreshSha: vi.fn(),
  };
}
