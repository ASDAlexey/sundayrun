import { CdnRefService } from './cdn-ref.service';

/** Stands in for the branch head sha the real service reads from the GitHub API. */
export const CDN_REF_SHA_MOCK = 'cdn-ref-head-sha';

/** Drop-in `CdnRefService`: no network, `pin` re-points `resolve` like the real one. */
export function cdnRefServiceMock(initialRef: string = CDN_REF_SHA_MOCK): Pick<CdnRefService, 'resolve' | 'pin'> {
  let ref = initialRef;

  return {
    resolve: () => Promise.resolve(ref),
    pin: (commitSha: string) => {
      ref = commitSha;
    },
  };
}
