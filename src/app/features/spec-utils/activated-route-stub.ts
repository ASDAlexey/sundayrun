import { ParamMap, Params, convertToParamMap } from '@angular/router';
import { Observable, Subject, concat, defer, of } from 'rxjs';

export interface ActivatedRouteStub {
  readonly paramMap: Observable<ParamMap>;
  readonly snapshot: { queryParamMap: ParamMap };
  setParams(next: Params): void;
}

/** ActivatedRoute stub for pages that read the query string once, from the snapshot. */
export interface ActivatedRouteQueryStub {
  readonly snapshot: { queryParamMap: ParamMap };
}

export function activatedRouteQueryStub(queryParams: Params): ActivatedRouteQueryStub {
  return { snapshot: { queryParamMap: convertToParamMap(queryParams) } };
}

/**
 * ActivatedRoute stub: the first emission re-reads `params` at subscribe time, so a test can
 * mutate them before creating the page; `setParams` emulates a same-route navigation.
 */
export function activatedRouteStub(params: Params): ActivatedRouteStub {
  const changes = new Subject<ParamMap>();

  return {
    paramMap: concat(
      defer(() => of(convertToParamMap(params))),
      changes,
    ),
    snapshot: { queryParamMap: convertToParamMap({}) },
    setParams(next: Params): void {
      changes.next(convertToParamMap(next));
    },
  };
}
