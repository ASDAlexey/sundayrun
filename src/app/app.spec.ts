import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { MAIN_CONTENT_ID } from './app.constant';
import { AthletesService } from './github/athletes.service';
import { DbFreshnessService } from './github/db-freshness.service';
import { dbFreshnessServiceMock } from './github/db-freshness.service.mock';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      // The shell mounts the freshness banner, whose real service would probe the network,
      // and the self picker, whose real directory service would open the protocol db.
      providers: [
        provideRouter([]),
        { provide: DbFreshnessService, useValue: dbFreshnessServiceMock() },
        { provide: AthletesService, useValue: {} },
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(DOCUMENT).getElementById(MAIN_CONTENT_ID)?.remove();
  });

  it('should create the app and render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();

    await fixture.whenStable();
    const compiled: HTMLElement = fixture.nativeElement;

    expect(compiled.querySelector('router-outlet')).not.toBeNull();

    const skipLink = compiled.querySelector('.skip-link');

    expect(skipLink, 'keyboard users can jump straight to the page content').not.toBeNull();
    expect(skipLink?.getAttribute('href')).toBe('#main');
  });

  it('should prevent navigation and focus the main landmark when the skip link is clicked', async () => {
    const fixture = TestBed.createComponent(App);
    const pageDocument = TestBed.inject(DOCUMENT);

    await fixture.whenStable();

    const skipLink: HTMLAnchorElement | null = fixture.nativeElement.querySelector('.skip-link');
    const clickWithoutMain = new MouseEvent('click', { cancelable: true });

    skipLink?.dispatchEvent(clickWithoutMain);

    expect(clickWithoutMain.defaultPrevented, 'the click is neutralized even when the landmark is absent').toBe(true);

    const main = pageDocument.createElement('main');

    main.id = MAIN_CONTENT_ID;
    main.tabIndex = -1;
    pageDocument.body.appendChild(main);

    const clickEvent = new MouseEvent('click', { cancelable: true });

    skipLink?.dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented, 'the click must not resolve #main against <base href> and reload').toBe(true);
    expect(pageDocument.activeElement).toBe(main);
  });
});
