import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { settle } from '../../features/spec-utils/settle';
import { InstallApp } from './install-app';
import { INSTALL_SETTLE_MS } from './install-app.constant';
import { InstallOffer } from './install-app.enum';
import { appInstalledEvent, foreignPromptEvent, installPromptEvent, stubStandalone } from './install-app.mock';
import { InstallPromptService } from './install-prompt.service';

describe('InstallPromptService', () => {
  beforeEach(() => {
    // jsdom's own `matchMedia` answers «false» to everything; stubbing it keeps the browser-tab case
    // explicit and lets the installed-app case below swap the answer.
    stubStandalone(false);
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('parks the browser dialog until it is asked for, then has nothing left to hand over', async () => {
    const service = TestBed.inject(InstallPromptService);
    const view = TestBed.inject(DOCUMENT).defaultView;

    expect(service.offer(), 'nothing is offered while the browser may still speak').toBe(InstallOffer.none);

    view?.dispatchEvent(foreignPromptEvent());

    expect(service.offer(), 'an event without the Chromium member is not one').toBe(InstallOffer.none);

    const event = installPromptEvent();

    view?.dispatchEvent(event);

    expect(event.defaultPrevented, 'the browser mini-infobar is suppressed in favour of our own button').toBe(true);
    expect(service.offer()).toBe(InstallOffer.prompt);

    await service.install();

    expect(event.prompt).toHaveBeenCalledOnce();
    expect(service.offer(), 'the event is spent, so only the by-hand route is left').toBe(InstallOffer.manual);

    await service.install();

    expect(event.prompt, 'Chromium refuses a second call, so none is made').toHaveBeenCalledOnce();
  });

  it('falls back to the by-hand instruction when no dialog ever arrives', async () => {
    vi.useFakeTimers();

    const service = TestBed.inject(InstallPromptService);

    expect(service.offer(), 'the instruction must not flash over Chromium').toBe(InstallOffer.none);

    await vi.advanceTimersByTimeAsync(INSTALL_SETTLE_MS);

    expect(service.offer(), 'iOS fires no event, so this is the only way in').toBe(InstallOffer.manual);
  });

  it('goes quiet the moment the app lands on the home screen', () => {
    const service = TestBed.inject(InstallPromptService);
    const view = TestBed.inject(DOCUMENT).defaultView;

    view?.dispatchEvent(installPromptEvent());

    expect(service.offer()).toBe(InstallOffer.prompt);

    view?.dispatchEvent(appInstalledEvent());

    expect(service.offer(), 'installed — there is nothing left to offer').toBe(InstallOffer.none);
  });

  it('says nothing at all inside an installed app', () => {
    stubStandalone(true);

    const service = TestBed.inject(InstallPromptService);

    TestBed.inject(DOCUMENT).defaultView?.dispatchEvent(installPromptEvent());

    expect(service.offer()).toBe(InstallOffer.none);
  });

  it('treats a browser without matchMedia as a plain tab rather than falling over', async () => {
    vi.stubGlobal('matchMedia', undefined);
    vi.useFakeTimers();

    const service = TestBed.inject(InstallPromptService);

    await vi.advanceTimersByTimeAsync(INSTALL_SETTLE_MS);

    expect(service.offer()).toBe(InstallOffer.manual);
  });

  it('lets go of the window when the app is torn down', async () => {
    vi.useFakeTimers();

    const service = TestBed.inject(InstallPromptService);
    const view = TestBed.inject(DOCUMENT).defaultView;

    TestBed.resetTestingModule();
    view?.dispatchEvent(installPromptEvent());
    await vi.advanceTimersByTimeAsync(INSTALL_SETTLE_MS);

    expect(service.offer(), 'the listeners and the wait are gone with the injector').toBe(InstallOffer.none);
  });

  it('survives a prerender, where there is no window to listen to', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: { defaultView: null } }] });

    expect(TestBed.inject(InstallPromptService).offer()).toBe(InstallOffer.none);
  });
});

describe('InstallApp', () => {
  beforeEach(() => {
    stubStandalone(false);
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('opens the browser dialog with one tap where the browser handed one over', async () => {
    const fixture = TestBed.createComponent(InstallApp);
    const element: HTMLElement = fixture.nativeElement;
    const view = TestBed.inject(DOCUMENT).defaultView;

    await fixture.whenStable();

    expect(element.querySelector('.install'), 'the panel keeps its own shape until there is an offer').toBeNull();

    const event = installPromptEvent();

    view?.dispatchEvent(event);
    fixture.detectChanges();

    const button = element.querySelector<HTMLButtonElement>('.install__action');

    expect(button?.textContent).toContain('Установить приложение');
    expect(button?.getAttribute('aria-expanded'), 'this button opens a dialog, not a disclosure').toBeNull();

    button?.click();
    await settle();
    fixture.detectChanges();

    expect(event.prompt).toHaveBeenCalledOnce();
    expect(element.querySelector('.install__steps'), 'the dialog is the answer; no instruction is unfolded').toBeNull();
  });

  it('unfolds the by-hand steps where no dialog is coming', async () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(InstallApp);
    const element: HTMLElement = fixture.nativeElement;

    fixture.detectChanges();

    expect(element.querySelector('.install'), 'the instruction must not flash over Chromium').toBeNull();

    await vi.advanceTimersByTimeAsync(INSTALL_SETTLE_MS);
    fixture.detectChanges();

    const button = element.querySelector<HTMLButtonElement>('.install__action');

    expect(button?.getAttribute('aria-expanded'), 'here the button is a disclosure').toBe('false');
    expect(element.querySelector('.install__steps')).toBeNull();

    button?.click();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(element.querySelectorAll('.install__step'), 'iOS, Android and the desktop each get their line').toHaveLength(3);
    expect(element.querySelector('.install__action')?.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('.install__step')?.textContent, 'iOS installs from the share sheet').toContain('На экран');

    element.querySelector<HTMLButtonElement>('.install__action')?.click();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(element.querySelector('.install__steps'), 'a second tap folds them away').toBeNull();
  });

  it('shows nothing inside an installed app', async () => {
    stubStandalone(true);

    const fixture = TestBed.createComponent(InstallApp);

    TestBed.inject(DOCUMENT).defaultView?.dispatchEvent(installPromptEvent());
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.install')).toBeNull();
  });
});
