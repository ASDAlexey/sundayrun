import { WritableSignal, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { SEARCH_QUERY_PARAM } from './search-query-param.constant';

/**
 * Mirrors a search box into `?q=`, so a reload or a shared link restores the typed query.
 * An emptied box drops the param; leaving the page loses it with the rest of the query string.
 * Must run in an injection context (a component constructor).
 */
export function bindSearchQueryParam(query: WritableSignal<string>): void {
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  const initial = route.snapshot.queryParamMap.get(SEARCH_QUERY_PARAM) ?? '';

  if (initial !== '') {
    query.set(initial);
  }

  effect(() => {
    const value = query();

    // The guard also keeps prerender still: the baked query string always matches the signal.
    if (value === (route.snapshot.queryParamMap.get(SEARCH_QUERY_PARAM) ?? '')) {
      return;
    }

    // `replaceUrl` keeps typing out of the history: «Назад» leaves the page, not the letters.
    void router.navigate([], {
      queryParams: { [SEARCH_QUERY_PARAM]: value === '' ? null : value },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });
}
