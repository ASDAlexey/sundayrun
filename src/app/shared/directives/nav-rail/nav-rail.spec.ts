import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

import { NavRail } from './nav-rail';
import { NAV_RAIL_CENTRED_LEFT, navRailRouterMock, stubNavRailGeometry } from './nav-rail.mock';

@Component({
  selector: 'app-rail-host',
  imports: [NavRail],
  template: `
    <nav appNavRail class="rail">
      <a class="first" href="#">Забеги</a>

      <a class="last" href="#">Секундомер</a>
    </nav>
  `,
})
class RailHost {}

describe('NavRail', () => {
  let fixture: ComponentFixture<RailHost>;
  let router: ReturnType<typeof navRailRouterMock>;
  let rail: HTMLElement;
  let scrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    router = navRailRouterMock();
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: router }] });

    fixture = TestBed.createComponent(RailHost);
    fixture.detectChanges();

    rail = fixture.nativeElement.querySelector('.rail');
    scrollTo = vi.fn();
    // jsdom leaves `scrollTo` off elements, and its overloaded type refuses a plain spy.
    Object.defineProperty(rail, 'scrollTo', { configurable: true, value: scrollTo });
  });

  afterEach(() => {
    router.events.complete();
    fixture.destroy();
  });

  it('centres the current section once navigation settles, ignoring the events before it', async () => {
    const active: HTMLElement = fixture.nativeElement.querySelector('.last');

    active.setAttribute('aria-current', 'page');
    stubNavRailGeometry(rail, active);

    router.events.next(new NavigationStart(1, '/timer'));
    await fixture.whenStable();

    expect(scrollTo, 'the active link is only marked once navigation ends').not.toHaveBeenCalled();

    router.events.next(new NavigationEnd(1, '/timer', '/timer'));
    await fixture.whenStable();

    expect(scrollTo).toHaveBeenCalledWith({ left: NAV_RAIL_CENTRED_LEFT, behavior: 'smooth' });
  });

  it('leaves the rail alone without a current section and on a screen that fits it whole', async () => {
    stubNavRailGeometry(rail, null);

    router.events.next(new NavigationEnd(1, '/nowhere', '/nowhere'));
    await fixture.whenStable();

    expect(scrollTo, 'no section of the rail matches the route').not.toHaveBeenCalled();

    const active: HTMLElement = fixture.nativeElement.querySelector('.last');

    active.setAttribute('aria-current', 'page');
    stubNavRailGeometry(rail, active, false);

    router.events.next(new NavigationEnd(2, '/timer', '/timer'));
    await fixture.whenStable();

    expect(scrollTo, 'a rail that shows everything has nothing to scroll').not.toHaveBeenCalled();
  });
});
