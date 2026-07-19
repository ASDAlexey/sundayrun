import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, PendingTasks, TransferState, inject, makeStateKey } from '@angular/core';

import { TransferLoadOptions } from './transfer-load.interface';

/** A captured transfer loader: call it as often as needed (e.g. per route param) after construction. */
export type TransferLoad = <T>(options: TransferLoadOptions<T>) => void;

/**
 * Captures the transfer plumbing (platform, `TransferState`, `PendingTasks`) in an injection context
 * and returns a loader callable later and repeatedly — for a component whose payload is keyed by a
 * route param (a race slug, a review year), each navigation running its own keyed load. The one-shot
 * `loadWithTransfer` wraps this for the common constructor-time case. See `runTransferLoad` for the
 * prerender-bakes / browser-trusts semantics.
 */
export function createTransferLoader(): TransferLoad {
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  const transferState = inject(TransferState);
  const pendingTasks = inject(PendingTasks);

  return (options) => runTransferLoad(options, isBrowser, transferState, pendingTasks);
}

/**
 * Fetches page data during prerender and bakes the result into `TransferState`, so the static
 * HTML carries the real content and hydration causes no layout shift. The browser applies the
 * baked value synchronously before hydration and then still refreshes from the network — unless
 * `trustBaked` says the baked value is already current for this deploy (see the interface). A
 * prerender failure silently keeps the loading state in the HTML; a browser failure reaches
 * `onError` only when there is nothing baked to keep showing. Must be called from an injection
 * context (a component constructor).
 */
export function loadWithTransfer<T>(options: TransferLoadOptions<T>): void {
  createTransferLoader()(options);
}

function runTransferLoad<T>(
  options: TransferLoadOptions<T>,
  isBrowser: boolean,
  transferState: TransferState,
  pendingTasks: PendingTasks,
): void {
  const stateKey = makeStateKey<{ data: T } | null>(options.key);

  if (isBrowser) {
    refresh(options, transferState.get(stateKey, null));

    return;
  }

  // The pending task keeps prerender waiting until the fetch lands in the HTML.
  void pendingTasks.run(async () => {
    try {
      const data = await options.load();

      transferState.set(stateKey, { data });
      options.apply(data);
    } catch {
      // The baked loading state stays in the HTML; the browser retry decides the real status.
    }
  });
}

function refresh<T>(options: TransferLoadOptions<T>, baked: { data: T } | null): void {
  if (baked !== null) {
    options.apply(baked.data);

    // A prerendered value is already current for this deploy (db and HTML ship together), so a
    // page opting into `trustBaked` skips the redundant refetch — the bulk of a page's db range
    // requests. A missing baked value still loads, so a prerender miss or CSR entry stays correct.
    if (options.trustBaked) {
      return;
    }
  }

  void options
    .load()
    .then(options.apply)
    .catch(() => {
      if (baked === null) {
        options.onError();
      }
    });
}
