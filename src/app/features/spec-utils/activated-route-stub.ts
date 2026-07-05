import { ParamMap, Params, convertToParamMap } from '@angular/router';
import { Observable, Subject, concat, defer, of } from 'rxjs';

export interface ActivatedRouteStub {
  readonly paramMap: Observable<ParamMap>;
  setParams(next: Params): void;
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
    setParams(next: Params): void {
      changes.next(convertToParamMap(next));
    },
  };
}
