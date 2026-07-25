import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { sessionToParticipants } from '../core/timer/session-to-participants';
import { TimerPublishState } from '../core/timer/timer-session.enum';
import { TIMER_SESSION_DATE_ISO, TIMER_SESSION_FINISHED, TIMER_SESSION_ID } from '../core/timer/timer-session.mock';
import { CdnRefService } from '../github/cdn-ref.service';
import { cdnRefServiceMock } from '../github/cdn-ref.service.mock';
import { DbFreshness } from '../github/db-freshness.enum';
import { DbFreshnessService } from '../github/db-freshness.service';
import { dbFreshnessServiceMock } from '../github/db-freshness.service.mock';
import { PublishState, PublishStateType } from '../github/github-storage.enum';
import { GithubStorageService } from '../github/github-storage.service';
import { HistoryService } from '../github/history.service';
import { PendingArchiveService } from '../github/pending-archive.service';
import { pendingArchiveMock } from '../github/pending-archive.service.mock';
import { PublishDurationService } from '../github/publish-duration.service';
import { publishDurationServiceMock } from '../github/publish-duration.service.mock';
import { ProtocolStateService } from './protocol-state.service';
import { BATCH_FIRST_DATE_ISO, IMPORT_HISTORY } from './protocol-state.service.mock';
import {
  TIMER_PUBLISH_ARCHIVE_ERROR,
  TIMER_PUBLISH_AUTH_ERROR,
  TIMER_PUBLISH_COMMIT_ERROR,
  TIMER_PUBLISH_EMPTY_ERROR,
} from './timer-publish.constant';
import { TimerPublishStep } from './timer-publish.enum';
import { TimerPublishService } from './timer-publish.service';
import {
  TIMER_PUBLISH_DEPLOY_MS,
  TIMER_PUBLISH_HISTORY_ERROR,
  TIMER_PUBLISH_INPUTS,
  TIMER_PUBLISH_REF,
  TIMER_PUBLISH_STARTED_AT_MS,
} from './timer-publish.service.mock';
import { TimerSessionService } from './timer-session.service';
import { TimerSessionServiceMock, timerSessionServiceMock } from './timer-session.service.mock';

describe('TimerPublishService', () => {
  const importSession = vi.fn();
  const setPublishedEventDates = vi.fn();
  const applyAutoNotes = vi.fn();
  const buildPublishInputs = vi.fn(() => TIMER_PUBLISH_INPUTS);
  const loadHistory = vi.fn();
  const githubState = signal<PublishStateType>(PublishState.idle);
  const publish = vi.fn(() => Promise.resolve());
  const githubReset = vi.fn();

  let sessions: TimerSessionServiceMock;
  let pendingArchive: ReturnType<typeof pendingArchiveMock>;
  let freshness: ReturnType<typeof dbFreshnessServiceMock>;
  let publishDuration: ReturnType<typeof publishDurationServiceMock>;
  let service: TimerPublishService;

  /** The status the flow wrote onto the measurement, replayed through the recorded change callback. */
  const writtenStatus = (): unknown => sessions.update.mock.lastCall?.[1](TIMER_SESSION_FINISHED).publish;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(TIMER_PUBLISH_STARTED_AT_MS);
    githubState.set(PublishState.idle);
    loadHistory.mockResolvedValue(IMPORT_HISTORY);
    publish.mockImplementation(() => {
      githubState.set(PublishState.success);

      return Promise.resolve();
    });
    buildPublishInputs.mockReturnValue(TIMER_PUBLISH_INPUTS);
    sessions = timerSessionServiceMock();
    pendingArchive = pendingArchiveMock();
    freshness = dbFreshnessServiceMock();
    publishDuration = publishDurationServiceMock();
    TestBed.configureTestingModule({
      providers: [
        { provide: TimerSessionService, useValue: sessions },
        { provide: ProtocolStateService, useValue: { importSession, setPublishedEventDates, applyAutoNotes, buildPublishInputs } },
        { provide: HistoryService, useValue: { loadHistory } },
        { provide: GithubStorageService, useValue: { state: githubState, publish, reset: githubReset } },
        { provide: PendingArchiveService, useValue: pendingArchive },
        { provide: DbFreshnessService, useValue: freshness },
        { provide: CdnRefService, useValue: cdnRefServiceMock(TIMER_PUBLISH_REF) },
        { provide: PublishDurationService, useValue: publishDuration },
      ],
    });
    service = TestBed.inject(TimerPublishService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('walks the whole pipeline, marks the measurement published and finishes a deploy that is already live', async () => {
    await service.publish(TIMER_SESSION_FINISHED);

    expect(importSession).toHaveBeenCalledExactlyOnceWith(sessionToParticipants(TIMER_SESSION_FINISHED), TIMER_SESSION_DATE_ISO);
    expect(setPublishedEventDates).toHaveBeenCalledExactlyOnceWith([BATCH_FIRST_DATE_ISO]);
    expect(applyAutoNotes).toHaveBeenCalledExactlyOnceWith(IMPORT_HISTORY);
    expect(githubReset, 'a stale success of an earlier batch must not be mistaken for this one').toHaveBeenCalledOnce();
    expect(publish).toHaveBeenCalledExactlyOnceWith(TIMER_PUBLISH_INPUTS);
    expect(pendingArchive.addUpload).toHaveBeenCalledExactlyOnceWith({
      slug: TIMER_SESSION_DATE_ISO,
      number: TIMER_PUBLISH_INPUTS[0].event.number,
      dateIso: TIMER_SESSION_DATE_ISO,
      participantCount: 0,
      atIso: new Date(TIMER_PUBLISH_STARTED_AT_MS).toISOString(),
    });
    expect(sessions.update.mock.calls[0][0]).toBe(TIMER_SESSION_ID);
    expect(writtenStatus()).toEqual({ state: TimerPublishState.published, error: null, sha: TIMER_PUBLISH_REF });
    expect(service.publishedSlug()).toBe(TIMER_SESSION_DATE_ISO);
    expect(service.step()).toBe(TimerPublishStep.done);
    expect(service.state()).toBe(TimerPublishState.published);
    expect(publishDuration.record).toHaveBeenCalledExactlyOnceWith(0);
  });

  it('waits the deploy out, measures it when the banner reports it and reports success when the poll gives up', async () => {
    freshness.pinnedDbAvailable.mockResolvedValue(false);
    await service.publish(TIMER_SESSION_FINISHED);

    expect(service.step()).toBe(TimerPublishStep.deploying);
    expect(service.state(), 'everything up to the landed deploy is one pending').toBe(TimerPublishState.pending);

    TestBed.tick();

    expect(service.step(), 'a banner that never noticed the deploy ends nothing').toBe(TimerPublishStep.deploying);

    freshness.state.set(DbFreshness.Updating);
    TestBed.tick();
    vi.setSystemTime(TIMER_PUBLISH_STARTED_AT_MS + TIMER_PUBLISH_DEPLOY_MS);
    freshness.state.set(DbFreshness.Updated);
    TestBed.tick();

    expect(service.step()).toBe(TimerPublishStep.done);
    expect(publishDuration.record).toHaveBeenCalledExactlyOnceWith(TIMER_PUBLISH_DEPLOY_MS);

    service.reset();
    freshness.state.set(DbFreshness.Fresh);
    TestBed.tick();

    expect(service.step(), 'a settled flow ignores the banner').toBe(TimerPublishStep.idle);
    expect(githubReset).toHaveBeenCalledTimes(2);

    await service.publish(TIMER_SESSION_FINISHED);
    freshness.state.set(DbFreshness.Updating);
    TestBed.tick();
    freshness.state.set(DbFreshness.Fresh);
    TestBed.tick();

    expect(service.step(), 'the commit landed even when the poll stopped watching').toBe(TimerPublishStep.done);
    expect(publishDuration.record, 'an unmeasured wait records nothing').toHaveBeenCalledOnce();
  });

  it('keeps the measurement intact when the archive cannot be read, and refuses a second press meanwhile', async () => {
    loadHistory.mockRejectedValue(TIMER_PUBLISH_HISTORY_ERROR);

    const pending = service.publish(TIMER_SESSION_FINISHED);

    await service.publish(TIMER_SESSION_FINISHED);
    await pending;

    expect(loadHistory, 'the press in flight swallows the second one').toHaveBeenCalledOnce();
    expect(publish).not.toHaveBeenCalled();
    expect(service.step()).toBe(TimerPublishStep.failed);
    expect(service.error()).toBe(TIMER_PUBLISH_ARCHIVE_ERROR);
    expect(service.state()).toBe(TimerPublishState.failed);
    expect(writtenStatus()).toEqual({ state: TimerPublishState.failed, error: TIMER_PUBLISH_ARCHIVE_ERROR, sha: null });

    await service.publish(TIMER_SESSION_FINISHED);

    expect(loadHistory, 'a failed publication may be retried').toHaveBeenCalledTimes(2);
  });

  it('names the reason when the commit is refused, and when there is nothing to commit at all', async () => {
    publish.mockImplementation(() => {
      githubState.set(PublishState.authError);

      return Promise.resolve();
    });
    await service.publish(TIMER_SESSION_FINISHED);

    expect(service.error()).toBe(TIMER_PUBLISH_AUTH_ERROR);
    expect(pendingArchive.addUpload).not.toHaveBeenCalled();

    publish.mockImplementation(() => {
      githubState.set(PublishState.error);

      return Promise.resolve();
    });
    await service.publish(TIMER_SESSION_FINISHED);

    expect(service.error()).toBe(TIMER_PUBLISH_COMMIT_ERROR);

    buildPublishInputs.mockReturnValue([]);
    await service.publish(TIMER_SESSION_FINISHED);

    expect(service.error()).toBe(TIMER_PUBLISH_EMPTY_ERROR);
    expect(publish, 'an empty batch never reaches GitHub').toHaveBeenCalledTimes(2);
  });
});
