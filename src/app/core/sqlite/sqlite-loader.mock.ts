import { vi } from 'vitest';

export const SQLITE3_INIT_MOCK = vi.fn();

/** Shape-only stand-in for the initialized namespace; the loader passes it through untouched. */
export const SQLITE3_STATIC_MOCK = { version: { libVersion: '3.53.0' } };
