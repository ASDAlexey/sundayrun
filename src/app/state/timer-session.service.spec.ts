import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { NotificationService } from '../shared/notification/notification.service';
import { NotificationMock, notificationMock } from '../shared/notification/notification.service.mock';
import { PADDED_TIMER_ID, TIMER_ID } from '../core/timer/timer-id.mock';
import { TIMER_SESSION, TIMER_SESSION_ID } from '../core/timer/timer-session.mock';
import { TIMER_SESSION_STORAGE_KEY } from './timer-session.constant';
import { TimerSessionService } from './timer-session.service';
import {
  CREATED_TIMER_SESSION_ID,
  CREATE_TIMER_SESSION_INPUT,
  REFUSED_CHANGE_DATE_ISO,
  SECOND_CREATE_INPUT,
  SECOND_CREATE_NOW_MS_STEP,
  UNKNOWN_TIMER_SESSION_ID,
  timerSessionServiceMock,
} from './timer-session.service.mock';
import { serializeTimerSessionState } from './timer-session.storage';
import { OLDER_TIMER_SESSION_ID, STORED_TIMER_SESSIONS_JSON, STORED_TIMER_SESSION_STATE } from './timer-session.storage.mock';
import { SSR_DOCUMENT_MOCK, TimerViewMock, VIEW_NOW_MS, timerViewMock } from './timer-view.mock';

describe('TimerSessionService', () => {
  const getItem = vi.fn((): string | null => null);
  const setItem = vi.fn();
  let view: TimerViewMock;
  let notification: NotificationMock;

  beforeEach(() => {
    vi.clearAllMocks();
    getItem.mockReturnValue(null);
    setItem.mockImplementation(() => undefined);
    view = timerViewMock();
    notification = notificationMock();
    vi.stubGlobal('localStorage', { getItem, setItem });
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: { defaultView: view } },
        { provide: NotificationService, useValue: notification },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates measurements newest first, opens the new one and writes each change at once', () => {
    const service = TestBed.inject(TimerSessionService);

    expect(getItem).toHaveBeenCalledWith(TIMER_SESSION_STORAGE_KEY);
    expect(service.sessions()).toEqual([]);
    expect(service.activeId()).toBeNull();
    expect(service.active()).toBeNull();
    expect(service.hasActive()).toBe(false);

    const id = service.create(CREATE_TIMER_SESSION_INPUT);

    expect(id, 'the id is the sortable local one, built off the injected clock').toBe(TIMER_ID);
    expect(service.activeId()).toBe(id);
    expect(service.active()?.dateIso).toBe(CREATE_TIMER_SESSION_INPUT.dateIso);
    expect(service.hasActive()).toBe(true);
    expect(setItem).toHaveBeenCalledWith(
      TIMER_SESSION_STORAGE_KEY,
      serializeTimerSessionState({ sessions: service.sessions(), activeId: id }),
    );
    expect(view.navigator.storage?.persist, 'the browser is asked once to keep the data').toHaveBeenCalledOnce();

    view.Date.now.mockReturnValue(VIEW_NOW_MS + SECOND_CREATE_NOW_MS_STEP);

    const second = service.create(SECOND_CREATE_INPUT);

    expect(second).not.toBe(id);
    expect(
      service.sessions().map((session) => session.id),
      'the newest measurement heads the list',
    ).toEqual([second, id]);
    expect(view.navigator.storage?.persist, 'persistence is requested on the first write only').toHaveBeenCalledOnce();
  });

  it('opens, closes and deletes stored measurements, ignoring a request that changes nothing', () => {
    getItem.mockReturnValue(STORED_TIMER_SESSIONS_JSON);

    const service = TestBed.inject(TimerSessionService);

    expect(service.sessions()).toEqual(STORED_TIMER_SESSION_STATE.sessions);
    expect(service.active()).toEqual(TIMER_SESSION);

    service.remove(OLDER_TIMER_SESSION_ID);

    expect(service.sessions()).toEqual([TIMER_SESSION]);
    expect(service.activeId(), 'deleting another measurement leaves the open one open').toBe(TIMER_SESSION_ID);
    expect(setItem).toHaveBeenCalledOnce();

    service.remove(UNKNOWN_TIMER_SESSION_ID);
    service.open(TIMER_SESSION_ID);
    service.open(UNKNOWN_TIMER_SESSION_ID);

    expect(setItem, 'deleting a ghost, reopening the open one and opening a ghost all write nothing').toHaveBeenCalledOnce();

    service.closeActive();

    expect(service.activeId()).toBeNull();
    expect(service.sessions(), 'closing leaves the measurement untouched').toEqual([TIMER_SESSION]);

    service.closeActive();

    expect(setItem, 'closing what is already closed writes nothing').toHaveBeenCalledTimes(2);

    service.open(TIMER_SESSION_ID);
    service.remove(TIMER_SESSION_ID);

    expect(service.sessions()).toEqual([]);
    expect(service.activeId(), 'deleting the open measurement closes it').toBeNull();
  });

  it('applies a core transition to a measurement and refuses to serialise a change that was rejected', () => {
    getItem.mockReturnValue(STORED_TIMER_SESSIONS_JSON);

    const service = TestBed.inject(TimerSessionService);

    service.updateActive((session) => ({ ...session, dateIso: SECOND_CREATE_INPUT.dateIso }));

    expect(service.active()?.dateIso).toBe(SECOND_CREATE_INPUT.dateIso);
    expect(setItem).toHaveBeenCalledOnce();

    const refused = vi.fn((session: typeof TIMER_SESSION) => session);

    service.updateActive(refused);

    expect(refused, 'the core was asked').toHaveBeenCalledOnce();
    expect(setItem, 'and answered «nothing changed», so nothing is written').toHaveBeenCalledOnce();

    const never = vi.fn((session: typeof TIMER_SESSION) => ({ ...session, dateIso: REFUSED_CHANGE_DATE_ISO }));

    service.update(UNKNOWN_TIMER_SESSION_ID, never);
    service.closeActive();
    service.updateActive(never);

    expect(never, 'neither a ghost id nor a closed measurement reaches the callback').not.toHaveBeenCalled();
  });

  it('keeps the measurement when the browser refuses to make the storage persistent', async () => {
    view.navigator.storage?.persist.mockRejectedValue(new Error('refused'));

    const service = TestBed.inject(TimerSessionService);

    service.create(CREATE_TIMER_SESSION_INPUT);
    await Promise.resolve();

    expect(service.sessions()).toHaveLength(1);
    expect(setItem).toHaveBeenCalledOnce();
  });

  it('keeps the race running and says so once when the device refuses to store it', () => {
    setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const service = TestBed.inject(TimerSessionService);

    service.create(CREATE_TIMER_SESSION_INPUT);

    expect(service.sessions(), 'the signal is set before the device is asked, so the tap survives').toHaveLength(1);

    view.Date.now.mockReturnValue(VIEW_NOW_MS + SECOND_CREATE_NOW_MS_STEP);
    service.create(SECOND_CREATE_INPUT);

    expect(service.sessions(), 'and the next one lands too, instead of throwing again').toHaveLength(2);
    expect(notification.error, 'the organiser hears about it once, not on every tap').toHaveBeenCalledOnce();
  });

  it('writes the measurement on a browser with no Storage API at all', () => {
    view.navigator.storage = undefined;

    const service = TestBed.inject(TimerSessionService);

    service.create(CREATE_TIMER_SESSION_INPUT);

    expect(setItem).toHaveBeenCalledOnce();
  });

  it('exposes a stand-in of the same surface for the components that will consume it', () => {
    const mock = timerSessionServiceMock();

    expect(mock.create(CREATE_TIMER_SESSION_INPUT)).toBe(CREATED_TIMER_SESSION_ID);
    expect(mock.hasActive()).toBe(false);

    mock.active.set(TIMER_SESSION);
    mock.activeId.set(TIMER_SESSION_ID);
    mock.sessions.set([TIMER_SESSION]);

    expect(mock.hasActive()).toBe(true);

    mock.open(TIMER_SESSION_ID);
    mock.closeActive();
    mock.remove(TIMER_SESSION_ID);
    mock.update(TIMER_SESSION_ID, (session: typeof TIMER_SESSION) => session);
    mock.updateActive((session: typeof TIMER_SESSION) => session);

    expect(mock.open).toHaveBeenCalledWith(TIMER_SESSION_ID);
    expect(mock.closeActive).toHaveBeenCalledOnce();
    expect(mock.remove).toHaveBeenCalledWith(TIMER_SESSION_ID);
    expect(mock.update).toHaveBeenCalledOnce();
    expect(mock.updateActive).toHaveBeenCalledOnce();
  });
});

describe('TimerSessionService without a window', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', undefined);
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: SSR_DOCUMENT_MOCK }] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('runs on stubs during prerender, where nothing is stored and nothing is asked of the browser', () => {
    const service = TestBed.inject(TimerSessionService);

    expect(service.sessions()).toEqual([]);
    expect(service.create(CREATE_TIMER_SESSION_INPUT), 'the fallback clock and randomness spell the smallest id').toBe(PADDED_TIMER_ID);
    expect(service.sessions()).toHaveLength(1);
  });
});
