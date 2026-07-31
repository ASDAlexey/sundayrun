import { vi } from 'vitest';

/** Stands in for Swiper's `register()`: the real one defines global custom elements. */
export const SWIPER_REGISTER_MOCK = vi.fn();
