import { Mock, vi } from 'vitest';

/** The stubbed NotificationService shape: spies the spec asserts the surfaced toasts against. */
export interface NotificationMock {
  error: Mock;
  info: Mock;
}

export function notificationMock(): NotificationMock {
  return {
    error: vi.fn(),
    info: vi.fn(),
  };
}
