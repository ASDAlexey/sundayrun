import { TestBed } from '@angular/core/testing';

import { SELF_ATHLETE_STORAGE_KEY } from './self-athlete.constant';
import { SelfAthleteService } from './self-athlete.service';
import {
  FIELDLESS_SELF_ATHLETE_JSON,
  MALFORMED_SELF_ATHLETE_JSON,
  NON_OBJECT_SELF_ATHLETE_JSON,
  SAVED_SELF_ATHLETE,
  STORED_SELF_ATHLETE,
  STORED_SELF_ATHLETE_JSON,
  WRONG_SHAPE_SELF_ATHLETE_JSON,
} from './self-athlete.service.mock';

describe('SelfAthleteService', () => {
  const getItem = vi.fn((): string | null => null);
  const setItem = vi.fn();
  const removeItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getItem.mockReturnValue(null);
    vi.stubGlobal('localStorage', { getItem, setItem, removeItem });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('initializes from localStorage, clears and saves the pick', () => {
    getItem.mockReturnValue(STORED_SELF_ATHLETE_JSON);

    const service = TestBed.inject(SelfAthleteService);

    expect(getItem).toHaveBeenCalledWith(SELF_ATHLETE_STORAGE_KEY);
    expect(service.self()).toEqual(STORED_SELF_ATHLETE);

    service.clear();

    expect(removeItem).toHaveBeenCalledWith(SELF_ATHLETE_STORAGE_KEY);
    expect(service.self()).toBeNull();

    service.save(SAVED_SELF_ATHLETE);

    expect(setItem).toHaveBeenCalledWith(SELF_ATHLETE_STORAGE_KEY, JSON.stringify(SAVED_SELF_ATHLETE));
    expect(service.self()).toEqual(SAVED_SELF_ATHLETE);
  });

  it('degrades a malformed stored value to «no pick» instead of breaking the shell', () => {
    getItem.mockReturnValue(MALFORMED_SELF_ATHLETE_JSON);

    expect(TestBed.inject(SelfAthleteService).self()).toBeNull();
  });

  it('rejects valid JSON of the wrong shape', () => {
    getItem.mockReturnValue(WRONG_SHAPE_SELF_ATHLETE_JSON);

    expect(TestBed.inject(SelfAthleteService).self()).toBeNull();
  });

  it('rejects a stored value that is not an object at all', () => {
    getItem.mockReturnValue(NON_OBJECT_SELF_ATHLETE_JSON);

    expect(TestBed.inject(SelfAthleteService).self()).toBeNull();
  });

  it('rejects an object with both pick fields missing', () => {
    getItem.mockReturnValue(FIELDLESS_SELF_ATHLETE_JSON);

    expect(TestBed.inject(SelfAthleteService).self()).toBeNull();
  });

  it('falls back to a noop storage during prerender where localStorage is absent', () => {
    vi.stubGlobal('localStorage', undefined);

    const service = TestBed.inject(SelfAthleteService);

    expect(service.self()).toBeNull();

    service.save(SAVED_SELF_ATHLETE);

    expect(service.self()).toEqual(SAVED_SELF_ATHLETE);

    service.clear();

    expect(service.self()).toBeNull();
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });
});
