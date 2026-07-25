import { WritableSignal, signal } from '@angular/core';
import { Mock, vi } from 'vitest';

import { GenderType } from '../core/models/gender.enum';
import { AthleteRecord } from '../core/models/athlete-history.interface';
import { EMPTY_COURSE_RECORD_LAP_MS } from './timer-roster.constant';
import { TimerRosterStatus, TimerRosterStatusType } from './timer-roster.enum';

/** The shape the `timerRosterServiceMock` factory returns: signals the spec drives, one spy it asserts on. */
export interface TimerRosterServiceMock {
  records: WritableSignal<AthleteRecord[]>;
  expectedLapMs: WritableSignal<ReadonlyMap<string, number>>;
  bestLapMs: WritableSignal<ReadonlyMap<string, number>>;
  appearanceCount: WritableSignal<ReadonlyMap<string, number>>;
  courseRecordLapMs: WritableSignal<Readonly<Record<GenderType, number | null>>>;
  status: WritableSignal<TimerRosterStatusType>;
  cachedAtMs: WritableSignal<number | null>;
  load: Mock;
}

/** A stubbed directory: the sheet gets whatever the spec puts in, and `load` is a bare spy. */
export function timerRosterServiceMock(): TimerRosterServiceMock {
  return {
    records: signal<AthleteRecord[]>([]),
    expectedLapMs: signal<ReadonlyMap<string, number>>(new Map()),
    bestLapMs: signal<ReadonlyMap<string, number>>(new Map()),
    appearanceCount: signal<ReadonlyMap<string, number>>(new Map()),
    courseRecordLapMs: signal<Readonly<Record<GenderType, number | null>>>(EMPTY_COURSE_RECORD_LAP_MS),
    status: signal<TimerRosterStatusType>(TimerRosterStatus.idle),
    cachedAtMs: signal<number | null>(null),
    load: vi.fn(() => Promise.resolve()),
  };
}

/** What a failed directory read rejects with. */
export const ROSTER_LOAD_ERROR_MESSAGE = 'нет сети';
