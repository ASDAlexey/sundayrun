import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AthletesService } from '../github/athletes.service';
import { EMPTY_COURSE_RECORD_LAP_MS, TIMER_ROSTER_SSR_NOW_MS, TIMER_ROSTER_STORAGE_KEY } from './timer-roster.constant';
import { TimerRosterStatus } from './timer-roster.enum';
import { TimerRosterService } from './timer-roster.service';
import { ROSTER_LOAD_ERROR_MESSAGE, timerRosterServiceMock } from './timer-roster.service.mock';
import { serializeTimerRosterCache } from './timer-roster.storage';
import {
  CACHED_ROSTER_RECORDS,
  ROSTER_APPEARANCE_ENTRIES,
  ROSTER_BEST_LAP_ENTRIES,
  ROSTER_COURSE_RECORD_LAP_MS,
  ROSTER_EXPECTED_LAP_ENTRIES,
  ROSTER_PACING_ROWS,
  ROSTER_RECORDS,
  ROSTER_SAVED_AT_MS,
  STORED_ROSTER_JSON,
} from './timer-roster.storage.mock';
import { SSR_DOCUMENT_MOCK, TimerViewMock, VIEW_NOW_MS, timerViewMock } from './timer-view.mock';

describe('TimerRosterService', () => {
  const getItem = vi.fn((): string | null => null);
  const setItem = vi.fn();
  const loadRecords = vi.fn();
  const loadPacingRows = vi.fn();
  let view: TimerViewMock;

  beforeEach(() => {
    vi.clearAllMocks();
    getItem.mockReturnValue(null);
    loadRecords.mockResolvedValue(ROSTER_RECORDS);
    loadPacingRows.mockResolvedValue(ROSTER_PACING_ROWS);
    view = timerViewMock();
    vi.stubGlobal('localStorage', { getItem, setItem });
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: { defaultView: view } },
        { provide: AthletesService, useValue: { loadRecords, loadPacingRows } },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the directory, boils the archived splits down to expected laps and caches both', async () => {
    const service = TestBed.inject(TimerRosterService);

    expect(getItem).toHaveBeenCalledWith(TIMER_ROSTER_STORAGE_KEY);
    expect(service.status()).toBe(TimerRosterStatus.idle);
    expect(service.records()).toEqual([]);
    expect(service.cachedAtMs()).toBeNull();

    const first = service.load();

    expect(service.status()).toBe(TimerRosterStatus.loading);

    await Promise.all([first, service.load()]);

    expect(loadRecords, 'a second call while one is in flight joins the first').toHaveBeenCalledOnce();
    expect(service.status()).toBe(TimerRosterStatus.ready);
    expect(service.records()).toEqual(ROSTER_RECORDS);
    expect([...service.expectedLapMs()]).toEqual(ROSTER_EXPECTED_LAP_ENTRIES);
    expect([...service.bestLapMs()]).toEqual(ROSTER_BEST_LAP_ENTRIES);
    expect([...service.appearanceCount()]).toEqual(ROSTER_APPEARANCE_ENTRIES);
    expect(service.courseRecordLapMs()).toEqual(ROSTER_COURSE_RECORD_LAP_MS);
    expect(service.cachedAtMs()).toBe(VIEW_NOW_MS);
    expect(setItem).toHaveBeenCalledWith(
      TIMER_ROSTER_STORAGE_KEY,
      serializeTimerRosterCache({
        records: ROSTER_RECORDS,
        expectedLapMs: service.expectedLapMs(),
        bestLapMs: service.bestLapMs(),
        appearanceCount: service.appearanceCount(),
        courseRecordLapMs: service.courseRecordLapMs(),
        savedAtMs: VIEW_NOW_MS,
      }),
    );

    await service.load();

    expect(loadRecords, 'a later call refreshes the directory again').toHaveBeenCalledTimes(2);
  });

  it('starts from the offline cache and keeps it when the network read fails', async () => {
    getItem.mockReturnValue(STORED_ROSTER_JSON);
    loadRecords.mockRejectedValue(new Error(ROSTER_LOAD_ERROR_MESSAGE));

    const service = TestBed.inject(TimerRosterService);

    expect(service.status(), 'a cached directory is ready before any request').toBe(TimerRosterStatus.ready);
    expect(service.records()).toEqual(CACHED_ROSTER_RECORDS);
    expect([...service.expectedLapMs()]).toEqual(ROSTER_EXPECTED_LAP_ENTRIES);
    expect([...service.bestLapMs()], 'the «Круг» table knows the personal bests offline too').toEqual(ROSTER_BEST_LAP_ENTRIES);
    expect([...service.appearanceCount()]).toEqual(ROSTER_APPEARANCE_ENTRIES);
    expect(service.courseRecordLapMs()).toEqual(ROSTER_COURSE_RECORD_LAP_MS);

    await expect(service.load(), 'a park with no signal is not an exception').resolves.toBeUndefined();

    expect(service.status()).toBe(TimerRosterStatus.error);
    expect(service.records(), 'the cached names stay on screen').toEqual(CACHED_ROSTER_RECORDS);
    expect(service.cachedAtMs()).toBe(ROSTER_SAVED_AT_MS);
    expect(setItem, 'and nothing overwrites the cache that still works').not.toHaveBeenCalled();
  });

  it('exposes a stand-in of the same surface for the components that will consume it', async () => {
    const mock = timerRosterServiceMock();

    expect(mock.status()).toBe(TimerRosterStatus.idle);
    expect(mock.records()).toEqual([]);
    expect([...mock.expectedLapMs()]).toEqual([]);
    expect([...mock.bestLapMs()]).toEqual([]);
    expect([...mock.appearanceCount()]).toEqual([]);
    expect(mock.courseRecordLapMs()).toEqual(EMPTY_COURSE_RECORD_LAP_MS);
    expect(mock.cachedAtMs()).toBeNull();
    await expect(mock.load()).resolves.toBeUndefined();

    mock.records.set(CACHED_ROSTER_RECORDS);
    mock.expectedLapMs.set(new Map(ROSTER_EXPECTED_LAP_ENTRIES));
    mock.bestLapMs.set(new Map(ROSTER_BEST_LAP_ENTRIES));
    mock.appearanceCount.set(new Map(ROSTER_APPEARANCE_ENTRIES));
    mock.courseRecordLapMs.set(ROSTER_COURSE_RECORD_LAP_MS);
    mock.status.set(TimerRosterStatus.ready);
    mock.cachedAtMs.set(ROSTER_SAVED_AT_MS);

    expect(mock.records()).toEqual(CACHED_ROSTER_RECORDS);
    expect(mock.courseRecordLapMs()).toEqual(ROSTER_COURSE_RECORD_LAP_MS);
  });
});

describe('TimerRosterService without a window', () => {
  const loadRecords = vi.fn();
  const loadPacingRows = vi.fn();

  beforeEach(() => {
    loadRecords.mockResolvedValue(ROSTER_RECORDS);
    loadPacingRows.mockResolvedValue(ROSTER_PACING_ROWS);
    vi.stubGlobal('localStorage', undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: SSR_DOCUMENT_MOCK },
        { provide: AthletesService, useValue: { loadRecords, loadPacingRows } },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('runs on stubs during prerender, with nothing cached and no clock to date it by', async () => {
    const service = TestBed.inject(TimerRosterService);

    expect(service.records()).toEqual([]);

    await service.load();

    expect(service.status()).toBe(TimerRosterStatus.ready);
    expect(service.cachedAtMs()).toBe(TIMER_ROSTER_SSR_NOW_MS);
  });
});
