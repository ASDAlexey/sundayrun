import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HUNDREDTHS_HIDDEN_CLASS, HUNDREDTHS_HIDDEN_VALUE, HUNDREDTHS_STORAGE_KEY } from './hundredths.constant';
import { HundredthsService } from './hundredths.service';

describe('HundredthsService', () => {
  const getItem = vi.fn((): string | null => null);
  const setItem = vi.fn();
  const removeItem = vi.fn();

  function hidden(): boolean {
    return TestBed.inject(DOCUMENT).documentElement.classList.contains(HUNDREDTHS_HIDDEN_CLASS);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    getItem.mockReturnValue(null);
    vi.stubGlobal('localStorage', { getItem, setItem, removeItem });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.inject(DOCUMENT).documentElement.classList.remove(HUNDREDTHS_HIDDEN_CLASS);
  });

  it('starts with the hundredths on, folds them away on the first toggle and brings them back on the next', () => {
    const service = TestBed.inject(HundredthsService);

    expect(getItem).toHaveBeenCalledWith(HUNDREDTHS_STORAGE_KEY);
    expect(service.shown(), 'an untouched device draws every result to hundredths').toBe(true);

    service.toggle();

    expect(setItem).toHaveBeenCalledWith(HUNDREDTHS_STORAGE_KEY, HUNDREDTHS_HIDDEN_VALUE);
    expect(service.shown()).toBe(false);
    expect(hidden(), 'the class on <html> is what actually folds the fraction away').toBe(true);

    service.toggle();

    expect(removeItem, 'back to the default means the key goes away, not that it stores «on»').toHaveBeenCalledWith(HUNDREDTHS_STORAGE_KEY);
    expect(service.shown()).toBe(true);
    expect(hidden()).toBe(false);
  });

  it('starts folded on a device that already switched the fraction off', () => {
    getItem.mockReturnValue(HUNDREDTHS_HIDDEN_VALUE);

    expect(TestBed.inject(HundredthsService).shown()).toBe(false);
  });

  it('falls back to a noop storage during prerender where localStorage is absent', () => {
    vi.stubGlobal('localStorage', undefined);

    const service = TestBed.inject(HundredthsService);

    expect(service.shown()).toBe(true);

    service.toggle();

    expect(service.shown()).toBe(false);
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });
});
