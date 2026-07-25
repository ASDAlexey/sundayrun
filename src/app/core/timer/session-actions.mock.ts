import { Gender } from '../models/gender.enum';
import { CreateSessionInput, NewTimerRunner } from './session-actions.interface';
import { INITIAL_PUBLISH_STATUS } from './timer-session.constant';
import { TimerPublishState, TimerRole, TimerRunnerOutcome, TimerStatus } from './timer-session.enum';
import { TimerPublishStatus, TimerRunner, TimerSession } from './timer-session.interface';
import { TIMER_SESSION_IDLE } from './timer-session.mock';

export const CREATE_SESSION_INPUT: CreateSessionInput = {
  id: 'session-new',
  dateIso: '2026-08-02',
  createdAtMs: 1785_600_000_000,
};

export const BACKUP_SESSION_INPUT: CreateSessionInput = { ...CREATE_SESSION_INPUT, role: TimerRole.backup };

export const EXPECTED_CREATED_SESSION: TimerSession = {
  id: CREATE_SESSION_INPUT.id,
  dateIso: CREATE_SESSION_INPUT.dateIso,
  createdAtMs: CREATE_SESSION_INPUT.createdAtMs,
  startedAtEpochMs: null,
  stoppedAtMs: null,
  status: TimerStatus.idle,
  role: TimerRole.main,
  runners: [],
  splits: [],
  publish: INITIAL_PUBLISH_STATUS,
};

export const NEW_RUNNER: NewTimerRunner = {
  id: 'runner-hahutsky',
  fullName: 'Хахуцкий Виктор',
  athleteKey: 'хахуцкий виктор',
  gender: Gender.male,
};

export const EXPECTED_ADDED_RUNNER: TimerRunner = { ...NEW_RUNNER, outcome: TimerRunnerOutcome.active };

/** The same id under another name — a second tap on «добавить» must not clone the tile. */
export const DUPLICATE_RUNNER: NewTimerRunner = { ...NEW_RUNNER, fullName: 'Хахуцкий Виктор Викторович', athleteKey: null };

export const CORRECTED_FULL_NAME = 'Троилин Антон Сергеевич';
export const CORRECTED_ATHLETE_KEY = 'троилин антон сергеевич';

export const START_EPOCH_MS = 1785_650_000_000;
export const STOP_ELAPSED_MS = 1_912_000;

export const RECORDED_SPLIT_ID = 'split-fresh';
export const RECORDED_SPLIT_AT_MS = 1_723_000;
export const UNKNOWN_SPLIT_ID = 'split-nobody';

/** Publish statuses that differ from the initial one in exactly one field each. */
export const FAILED_PUBLISH_STATUS: TimerPublishStatus = { state: TimerPublishState.failed, error: 'Нет сети', sha: null };
export const ERROR_ONLY_PUBLISH_STATUS: TimerPublishStatus = { ...INITIAL_PUBLISH_STATUS, error: 'Нет сети' };
export const SHA_ONLY_PUBLISH_STATUS: TimerPublishStatus = { ...INITIAL_PUBLISH_STATUS, sha: 'a1b2c3d' };
export const SAME_PUBLISH_STATUS: TimerPublishStatus = { ...INITIAL_PUBLISH_STATUS };

/** A measurement whose roster was never collected — the mass start has nobody to send off. */
export const EMPTY_ROSTER_SESSION: TimerSession = { ...TIMER_SESSION_IDLE, runners: [] };
