import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DbFreshness } from '../../github/db-freshness.enum';
import { DbFreshnessService } from '../../github/db-freshness.service';
import { dbFreshnessServiceMock } from '../../github/db-freshness.service.mock';
import { DbFreshnessBanner } from './db-freshness-banner';

describe('DbFreshnessBanner', () => {
  const freshness = dbFreshnessServiceMock();

  beforeEach(() => {
    freshness.check.mockClear();
    freshness.state.set(DbFreshness.Fresh);
    TestBed.configureTestingModule({
      providers: [{ provide: DbFreshnessService, useValue: freshness }],
    });
  });

  it('kicks off the check and walks the empty → updating → updated flow', async () => {
    const fixture = TestBed.createComponent(DbFreshnessBanner);

    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(freshness.check, 'mounting the shell starts the freshness watch').toHaveBeenCalledOnce();
    expect(element.querySelector('.db-freshness-banner'), 'fresh data needs no banner').toBeNull();

    freshness.state.set(DbFreshness.Updating);
    fixture.detectChanges();

    expect(element.querySelector('.db-freshness-banner__spinner'), 'the deploy-in-flight strip shows').not.toBeNull();
    expect(element.querySelector('.db-freshness-banner__reload')).toBeNull();

    freshness.state.set(DbFreshness.Updated);
    fixture.detectChanges();

    const reloadSpy = vi.spyOn(fixture.componentInstance, 'reload').mockImplementation(() => undefined);
    const reloadButton = element.querySelector<HTMLButtonElement>('.db-freshness-banner__reload');

    expect(element.querySelector('.db-freshness-banner__spinner'), 'the landed deploy stops the spinner').toBeNull();

    reloadButton?.click();

    expect(reloadSpy, 'the button offers the one-click reload').toHaveBeenCalledOnce();
  });
});

describe('DbFreshnessBanner reload', () => {
  const freshness = dbFreshnessServiceMock();
  const reload = vi.fn();
  const documentMock: { defaultView: { location: { reload: () => void } } | null } = { defaultView: { location: { reload } } };

  beforeEach(() => {
    reload.mockReset();
    documentMock.defaultView = { location: { reload } };
    TestBed.configureTestingModule({
      providers: [
        { provide: DbFreshnessService, useValue: freshness },
        { provide: DOCUMENT, useValue: documentMock },
      ],
    });
  });

  it('reloads through the document window and stays inert without one, so a prerender never throws', () => {
    const banner = TestBed.runInInjectionContext(() => new DbFreshnessBanner());

    banner.reload();

    expect(reload).toHaveBeenCalledOnce();

    documentMock.defaultView = null;

    expect(() => banner.reload()).not.toThrow();
    expect(reload).toHaveBeenCalledOnce();
  });
});
