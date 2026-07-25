import { WritableSignal, signal } from '@angular/core';
import { Mock, vi } from 'vitest';

import { DOCUMENT_VISIBLE } from './wake-lock.constant';

/** The stand-in the race screen gets: one flag the spec drives, two bare spies it asserts on. */
export interface WakeLockServiceMock {
  unsupported: WritableSignal<boolean>;
  request: Mock;
  release: Mock;
}

export function wakeLockServiceMock(): WakeLockServiceMock {
  return { unsupported: signal(false), request: vi.fn(), release: vi.fn() };
}

/** The sentinel a granted request hands back; giving it up is the only thing anyone asks of it. */
export interface WakeLockSentinelMock {
  release: Mock;
}

export function wakeLockSentinelMock(): WakeLockSentinelMock {
  return { release: vi.fn(() => Promise.resolve()) };
}

/** The slice of `DOCUMENT` the service touches: the visibility flag and the two listener spies. */
export interface WakeLockDocumentMock {
  addEventListener: Mock;
  defaultView: { navigator: { wakeLock?: { request: Mock } } } | null;
  removeEventListener: Mock;
  visibilityState: string;
}

export function wakeLockDocumentMock(request: Mock): WakeLockDocumentMock {
  return {
    addEventListener: vi.fn(),
    defaultView: { navigator: { wakeLock: { request } } },
    removeEventListener: vi.fn(),
    visibilityState: DOCUMENT_VISIBLE,
  };
}

/** The tab is in the background — the system has taken the lock away and will not give it back. */
export const DOCUMENT_HIDDEN = 'hidden';

/** What a refusal looks like: the browser rejects the request instead of throwing synchronously. */
export const WAKE_LOCK_REFUSED_MESSAGE = 'NotAllowedError';
