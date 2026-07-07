import { CdnRefService } from './cdn-ref.service';

/** Stands in for the pointer sha the real service reads from the CDN. */
export const CDN_REF_SHA_MOCK = 'cdn-ref-head-sha';

export const VERSION_POINTER_ERROR_STATUS = 404;

export const CDN_REF_NETWORK_ERROR_MESSAGE = 'cdn unreachable';

/** Drop-in `CdnRefService`: no network, `pin` re-points `resolve` like the real one. */
export function cdnRefServiceMock(initialRef: string = CDN_REF_SHA_MOCK): Pick<CdnRefService, 'pin' | 'resolve'> {
  let ref = initialRef;

  return {
    resolve: () => Promise.resolve(ref),
    pin: (commitSha: string) => {
      ref = commitSha;
    },
  };
}
