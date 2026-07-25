import { Mock, vi } from 'vitest';

/** The stand-in the page and the route guard get: one spy that answers «можно уходить». */
export interface RaceGuardServiceMock {
  confirmLeave: Mock;
}

export function raceGuardServiceMock(): RaceGuardServiceMock {
  return { confirmLeave: vi.fn(() => true) };
}
