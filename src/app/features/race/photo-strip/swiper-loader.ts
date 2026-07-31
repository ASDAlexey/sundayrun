/**
 * Registers Swiper's custom elements the first time a viewer is opened, never at page load.
 *
 * `/races/:slug` is an eager route, and its initial bundle already sits close to the warning
 * budget, so Swiper is pulled in by a dynamic import: the chunk is fetched only once a visitor
 * actually taps a photograph. `register()` defines `swiper-container` / `swiper-slide` globally,
 * hence the module-level latch — calling it twice would throw on the already-defined element.
 */
let registration: Promise<void> | null = null;

export function loadSwiper(): Promise<void> {
  registration ??= import('swiper/element/bundle').then(({ register }) => {
    register();
  });

  return registration;
}
