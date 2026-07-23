import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { activatedRouteQueryStub } from '../../features/spec-utils/activated-route-stub';
import { bindSearchQueryParam } from './search-query-param';
import { SEARCH_QUERY_PARAM } from './search-query-param.constant';
import { INITIAL_QUERY, TYPED_QUERY } from './search-query-param.mock';

describe('bindSearchQueryParam with a query in the URL', () => {
  const navigate = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    navigate.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useFactory: () => activatedRouteQueryStub({ [SEARCH_QUERY_PARAM]: INITIAL_QUERY }) },
      ],
    });
  });

  it('restores the query without an echo navigation, then mirrors edits and drops the emptied param', () => {
    const query = signal('');

    TestBed.runInInjectionContext(() => bindSearchQueryParam(query));

    expect(query()).toBe(INITIAL_QUERY);

    TestBed.tick();

    expect(navigate).not.toHaveBeenCalled();

    query.set(TYPED_QUERY);
    TestBed.tick();

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { [SEARCH_QUERY_PARAM]: TYPED_QUERY },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    query.set('');
    TestBed.tick();

    expect(navigate).toHaveBeenLastCalledWith([], {
      queryParams: { [SEARCH_QUERY_PARAM]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });
});

describe('bindSearchQueryParam without a query in the URL', () => {
  const navigate = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    navigate.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate } },
        { provide: ActivatedRoute, useFactory: () => activatedRouteQueryStub({}) },
      ],
    });
  });

  it('leaves the box empty and stays off the router', () => {
    const query = signal('');

    TestBed.runInInjectionContext(() => bindSearchQueryParam(query));

    expect(query()).toBe('');

    TestBed.tick();

    expect(navigate).not.toHaveBeenCalled();
  });
});
