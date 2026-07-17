/**
 * IntersectionObserver options for scroll-reveal — fires as soon as any part of
 * the element crosses into view, nudged by a negative bottom margin so the
 * reveal starts a touch before the element reaches the fold.
 */
export const REVEAL_OBSERVER_OPTIONS: IntersectionObserverInit = {
  threshold: 0,
  rootMargin: '0px 0px -10% 0px',
};
