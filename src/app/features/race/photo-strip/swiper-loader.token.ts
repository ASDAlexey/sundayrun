import { InjectionToken } from '@angular/core';

import { loadSwiper } from './swiper-loader';

/**
 * How the viewer gets Swiper's custom elements defined. The default fetches the chunk on demand
 * (see `swiper-loader`); specs bind a resolved stub instead, because Swiper registers globals and
 * expects a real layout engine, neither of which belongs in a component test.
 */
export const SWIPER_LOADER = new InjectionToken<() => Promise<void>>('SWIPER_LOADER', {
  providedIn: 'root',
  factory: () => loadSwiper,
});
