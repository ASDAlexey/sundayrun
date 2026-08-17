import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DELTA_BASE_CLASSES, DELTA_BASE_STORAGE_KEY } from './delta-base.constant';
import { DeltaBase } from './delta-base.enum';
import { DeltaBaseService } from './delta-base.service';

describe('DeltaBaseService', () => {
  const getItem = vi.fn((): string | null => null);
  const setItem = vi.fn();
  const removeItem = vi.fn();

  function classes(): string[] {
    return [...TestBed.inject(DOCUMENT).documentElement.classList].filter((name) => name.startsWith('delta-base-'));
  }

  beforeEach(() => {
    vi.clearAllMocks();
    getItem.mockReturnValue(null);
    vi.stubGlobal('localStorage', { getItem, setItem, removeItem });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.inject(DOCUMENT).documentElement.className = '';
  });

  it('starts on the form, marks <html> for every other base and unmarks it on the way back', () => {
    const service = TestBed.inject(DeltaBaseService);

    expect(getItem).toHaveBeenCalledWith(DELTA_BASE_STORAGE_KEY);
    expect(service.base(), 'an untouched device measures against the runner’s own form').toBe(DeltaBase.form);

    service.select(DeltaBase.record);

    expect(setItem).toHaveBeenCalledWith(DELTA_BASE_STORAGE_KEY, DeltaBase.record);
    expect(service.base()).toBe(DeltaBase.record);
    expect(classes(), 'the class on <html> is what actually swaps the column').toEqual([DELTA_BASE_CLASSES[DeltaBase.record]]);

    service.select(DeltaBase.off);

    expect(classes(), 'one base at a time — the previous mark has to go').toEqual([DELTA_BASE_CLASSES[DeltaBase.off]]);

    service.select(DeltaBase.form);

    expect(removeItem, 'back to the default means the key goes away, not that it stores «form»').toHaveBeenCalledWith(
      DELTA_BASE_STORAGE_KEY,
    );
    expect(service.base()).toBe(DeltaBase.form);
    expect(classes(), 'the default carries no class of its own').toEqual([]);
  });

  it('starts on the stored base, and shrugs off a value it does not know', () => {
    getItem.mockReturnValue(DeltaBase.year);

    expect(TestBed.inject(DeltaBaseService).base()).toBe(DeltaBase.year);

    TestBed.resetTestingModule();
    getItem.mockReturnValue('лучшее за все время');

    expect(TestBed.inject(DeltaBaseService).base(), 'a hand-edited key must not blank the column').toBe(DeltaBase.form);
  });

  it('falls back to a noop storage during prerender where localStorage is absent', () => {
    vi.stubGlobal('localStorage', undefined);

    const service = TestBed.inject(DeltaBaseService);

    expect(service.base()).toBe(DeltaBase.form);

    service.select(DeltaBase.year);

    expect(service.base()).toBe(DeltaBase.year);
    expect(setItem, 'the stub swallowed the write instead of throwing').not.toHaveBeenCalled();
  });
});
