import { RouterEvent } from '@angular/router';
import { Subject } from 'rxjs';

/** The Router stripped to the one thing the rail listens to — its event stream. */
export function navRailRouterMock(): { events: Subject<RouterEvent> } {
  return { events: new Subject<RouterEvent>() };
}

/** A 300px rail holding 460px of sections, the active one starting just past its right edge. */
export const NAV_RAIL_GEOMETRY = {
  railWidth: 300,
  railHeight: 40,
  scrollWidth: 460,
  activeLeft: 380,
  activeWidth: 80,
} as const;

/** Where {@link NAV_RAIL_GEOMETRY} has to land for the active section to sit centred. */
export const NAV_RAIL_CENTRED_LEFT = 270;

/**
 * jsdom lays nothing out, so the rail and its active section are handed the sizes above.
 * `overflows: false` makes the rail as wide as its content — the case where it must stand down.
 */
export function stubNavRailGeometry(rail: HTMLElement, active: HTMLElement | null, overflows = true): void {
  const { railWidth, railHeight, scrollWidth, activeLeft, activeWidth } = NAV_RAIL_GEOMETRY;

  Object.defineProperty(rail, 'clientWidth', { configurable: true, value: railWidth });
  Object.defineProperty(rail, 'scrollWidth', { configurable: true, value: overflows ? scrollWidth : railWidth });
  rail.getBoundingClientRect = (): DOMRect => new DOMRect(0, 0, railWidth, railHeight);

  if (active !== null) {
    active.getBoundingClientRect = (): DOMRect => new DOMRect(activeLeft, 0, activeWidth, railHeight);
  }
}
