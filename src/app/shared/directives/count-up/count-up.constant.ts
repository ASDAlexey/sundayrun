/** Mirrors `--time-count-up` in `_tokens.scss` — a big total takes just over a second to arrive. */
export const COUNT_UP_DURATION_MS = 1200;

/**
 * Start counting only once the number is properly on screen. A threshold of 0 would fire
 * while the figure is still a sliver at the fold, so the run-up would be over by the time
 * anyone could read it.
 */
export const COUNT_UP_OBSERVER_OPTIONS: IntersectionObserverInit = {
  threshold: 0.4,
};

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
