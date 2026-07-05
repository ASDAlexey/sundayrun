import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, PendingTasks, TransferState, inject, makeStateKey } from '@angular/core';

import { TransferLoadOptions } from './transfer-load.interface';

/**
 * Fetches page data during prerender and bakes the result into `TransferState`, so the static
 * HTML carries the real content and hydration causes no layout shift. The browser applies the
 * baked value synchronously before hydration and then still refreshes from the network — data
 * is published between deploys. A prerender failure silently keeps the loading state in the
 * HTML; a browser failure reaches `onError` only when there is nothing baked to keep showing.
 * Must be called from an injection context (a component constructor).
 */
export function loadWithTransfer<T>(options: TransferLoadOptions<T>): void {
  // The wrapper object distinguishes "never baked" from any legitimate falsy payload.
  const stateKey = makeStateKey<{ data: T } | null>(options.key);
  const transferState = inject(TransferState);

  if (isPlatformBrowser(inject(PLATFORM_ID))) {
    refresh(options, transferState.get(stateKey, null));

    return;
  }

  // The pending task keeps prerender waiting until the fetch lands in the HTML.
  void inject(PendingTasks).run(async () => {
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
