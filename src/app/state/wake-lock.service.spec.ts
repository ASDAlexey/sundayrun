import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { settle } from '../features/spec-utils/settle';
import { DOCUMENT_VISIBLE, VISIBILITY_CHANGE_EVENT, WAKE_LOCK_SCREEN } from './wake-lock.constant';
import { WakeLockService } from './wake-lock.service';
import {
  DOCUMENT_HIDDEN,
  WAKE_LOCK_REFUSED_MESSAGE,
  WakeLockDocumentMock,
  WakeLockSentinelMock,
  wakeLockDocumentMock,
  wakeLockSentinelMock,
} from './wake-lock.service.mock';

describe('WakeLockService', () => {
  let sentinel: WakeLockSentinelMock;
  let doc: WakeLockDocumentMock;

  const request = vi.fn();

  /** Whatever the service subscribed to `visibilitychange` — the tab coming back to the front. */
  const returnToForeground = (): void => {
    doc.addEventListener.mock.calls[0][1]();
  };

  beforeEach(() => {
    sentinel = wakeLockSentinelMock();
    request.mockReset();
    request.mockResolvedValue(sentinel);
    doc = wakeLockDocumentMock(request);
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: doc }] });
  });

  it('takes the lock once, asks for it back when the tab returns, and gives it up on release', async () => {
    const service = TestBed.inject(WakeLockService);

    service.request();
    await settle();

    expect(request).toHaveBeenCalledExactlyOnceWith(WAKE_LOCK_SCREEN);
    expect(doc.addEventListener.mock.calls[0][0]).toBe(VISIBILITY_CHANGE_EVENT);
    expect(service.unsupported()).toBe(false);

    service.request();
    await settle();

    expect(request, 'the lock is already held; asking again would only race with itself').toHaveBeenCalledOnce();

    doc.visibilityState = DOCUMENT_HIDDEN;
    returnToForeground();
    await settle();

    expect(request, 'a tab going away is not a reason to ask').toHaveBeenCalledOnce();

    doc.visibilityState = DOCUMENT_VISIBLE;
    returnToForeground();
    await settle();

    expect(request, 'the system dropped the lock while we were away, so it is taken again').toHaveBeenCalledTimes(2);

    sentinel.release.mockRejectedValue(new Error(WAKE_LOCK_REFUSED_MESSAGE));
    service.release();
    await settle();

    expect(sentinel.release, 'a lock the system had already taken back refuses to be released twice').toHaveBeenCalledOnce();
    expect(doc.removeEventListener).toHaveBeenCalledOnce();

    service.release();

    expect(sentinel.release, 'releasing what is not held costs nothing').toHaveBeenCalledOnce();
  });

  it('gives back a lock that was granted after «Стоп» had already been pressed', async () => {
    const service = TestBed.inject(WakeLockService);

    service.request();
    service.release();
    await settle();

    expect(sentinel.release, 'the screen must not stay lit for the rest of the morning').toHaveBeenCalledOnce();
  });

  it('asks the organiser for a longer auto-lock where the platform has none to give', async () => {
    doc.defaultView = null;

    const service = TestBed.inject(WakeLockService);

    service.request();
    await settle();

    expect(service.unsupported(), 'a prerender and an old Safari look the same from here').toBe(true);
  });

  it('survives a refused request and lets go of the screen when the injector goes down', async () => {
    request.mockRejectedValue(new Error(WAKE_LOCK_REFUSED_MESSAGE));

    const service = TestBed.inject(WakeLockService);

    service.request();
    await settle();

    expect(service.unsupported()).toBe(true);

    service.ngOnDestroy();

    expect(doc.removeEventListener).toHaveBeenCalledOnce();
  });
});
