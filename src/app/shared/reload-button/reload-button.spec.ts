import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ReloadButton } from './reload-button';

describe('ReloadButton', () => {
  const reload = vi.fn();
  const documentMock: { defaultView: { location: { reload: () => void } } | null } = { defaultView: { location: { reload } } };

  beforeEach(() => {
    reload.mockReset();
    documentMock.defaultView = { location: { reload } };
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: documentMock }],
    });
  });

  it('reloads the page through the document window', () => {
    TestBed.runInInjectionContext(() => new ReloadButton()).reload();

    expect(reload).toHaveBeenCalledOnce();
  });

  it('does nothing when there is no window, so a prerender never throws', () => {
    documentMock.defaultView = null;

    expect(() => TestBed.runInInjectionContext(() => new ReloadButton()).reload()).not.toThrow();
    expect(reload).not.toHaveBeenCalled();
  });
});
