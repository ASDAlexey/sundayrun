import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';

import { TimerRosterService } from '../../../state/timer-roster.service';
import { timerRosterServiceMock } from '../../../state/timer-roster.service.mock';
import { settle } from '../../spec-utils/settle';
import { TimerInstall } from './install-prompt';
import { TIMER_INSTALL_SETTLE_MS, TIMER_INSTALL_STORAGE_KEY } from './install-prompt.constant';
import {
  ACTIVE_REGISTRATION,
  INSTALLING_REGISTRATION,
  INSTALL_OUTCOME,
  ROSTER_CACHED_AT_MS,
  ROSTER_CACHED_DATE_TEXT,
  foreignPromptEvent,
  installPromptEvent,
} from './install-prompt.mock';

describe('TimerInstall', () => {
  const roster = timerRosterServiceMock();
  const getItem = vi.fn((): string | null => null);
  const setItem = vi.fn();

  beforeEach(() => {
    roster.cachedAtMs.set(null);
    getItem.mockClear();
    setItem.mockClear();
    vi.stubGlobal('localStorage', { getItem, setItem, removeItem: vi.fn() });
    // jsdom's own `matchMedia` answers «false» to everything; stubbing it keeps the browser tab
    // case explicit and lets the installed-app case below swap the answer.
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    TestBed.configureTestingModule({
      providers: [
        { provide: TimerRosterService, useValue: roster },
        { provide: SwUpdate, useValue: { isEnabled: false } },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('waits for the browser dialog, offers it, and never asks again once it was answered', async () => {
    const fixture = TestBed.createComponent(TimerInstall);
    const view = TestBed.inject(DOCUMENT).defaultView;
    const element: HTMLElement = fixture.nativeElement;

    await fixture.whenStable();

    expect(element.querySelector('.timer-install__button'), 'nothing is offered before the browser speaks').toBeNull();
    expect(element.querySelector('.timer-install__hint')).toBeNull();
    expect(element.querySelector('.timer-install__state_ready'), 'no worker, no offline promise').toBeNull();
    expect(element.querySelector('.timer-install__roster')?.textContent).toContain('ещё не скачан');

    roster.cachedAtMs.set(ROSTER_CACHED_AT_MS);
    fixture.detectChanges();

    expect(element.querySelector('.timer-install__roster')?.textContent, 'the directory is dated').toContain(ROSTER_CACHED_DATE_TEXT);

    const foreign = foreignPromptEvent();

    view?.dispatchEvent(foreign);
    fixture.detectChanges();

    expect(element.querySelector('.timer-install__button'), 'an event without the Chromium members is not one').toBeNull();

    const event = installPromptEvent();

    view?.dispatchEvent(event);
    fixture.detectChanges();

    const button = element.querySelector<HTMLButtonElement>('.timer-install__button');

    expect(event.defaultPrevented, 'the browser mini-infobar is suppressed in favour of this block').toBe(true);
    expect(button, 'the real install dialog is one tap away').not.toBeNull();

    button?.click();
    await settle();
    fixture.detectChanges();

    expect(event.prompt).toHaveBeenCalledOnce();
    expect(setItem).toHaveBeenCalledWith(TIMER_INSTALL_STORAGE_KEY, INSTALL_OUTCOME);
    expect(element.querySelector('.timer-install__button'), 'answered once, the offer is gone').toBeNull();
    expect(element.querySelector('.timer-install__hint'), 'and it does not fall back to the iOS line').toBeNull();
  });

  it('falls back to the «На экран „Домой“» instruction when no dialog ever arrives', async () => {
    vi.useFakeTimers();

    const fixture = TestBed.createComponent(TimerInstall);
    const element: HTMLElement = fixture.nativeElement;

    fixture.detectChanges();

    expect(element.querySelector('.timer-install__hint'), 'the instruction must not flash over Chromium').toBeNull();

    await vi.advanceTimersByTimeAsync(TIMER_INSTALL_SETTLE_MS);
    fixture.detectChanges();

    expect(element.querySelector('.timer-install__hint'), 'iOS never fires the event, so this is the only way in').not.toBeNull();
    expect(element.querySelector('.timer-install__button')).toBeNull();
  });

  it('says nothing at all inside an installed app', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));

    const fixture = TestBed.createComponent(TimerInstall);
    const view = TestBed.inject(DOCUMENT).defaultView;
    const element: HTMLElement = fixture.nativeElement;

    await fixture.whenStable();
    view?.dispatchEvent(installPromptEvent());
    fixture.detectChanges();

    expect(element.querySelector('.timer-install__button'), 'there is nothing left to install').toBeNull();
    expect(element.querySelector('.timer-install__hint')).toBeNull();
  });

  it('stays silent for a visitor who answered the offer on an earlier visit', async () => {
    getItem.mockReturnValue(INSTALL_OUTCOME);

    const fixture = TestBed.createComponent(TimerInstall);
    const view = TestBed.inject(DOCUMENT).defaultView;

    await fixture.whenStable();
    view?.dispatchEvent(installPromptEvent());
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.timer-install__button')).toBeNull();
  });

  it('survives a prerender, where there is neither a window to listen to nor a storage to read', () => {
    vi.stubGlobal('localStorage', undefined);
    TestBed.overrideProvider(DOCUMENT, { useValue: { defaultView: null } });

    expect(() => TestBed.runInInjectionContext(() => new TimerInstall())).not.toThrow();
  });
});

describe('TimerInstall offline readiness', () => {
  const roster = timerRosterServiceMock();

  beforeEach(() => {
    roster.cachedAtMs.set(ROSTER_CACHED_AT_MS);
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    TestBed.configureTestingModule({
      providers: [
        { provide: TimerRosterService, useValue: roster },
        { provide: SwUpdate, useValue: { isEnabled: true } },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lights up only when the worker is active and the directory is in hand', async () => {
    vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve(ACTIVE_REGISTRATION) } });

    const fixture = TestBed.createComponent(TimerInstall);

    await settle();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.timer-install__state_ready'), 'shell cached, roster cached').not.toBeNull();
  });

  it('stays dark while the worker is still installing', async () => {
    vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve(INSTALLING_REGISTRATION) } });

    const fixture = TestBed.createComponent(TimerInstall);

    await settle();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.timer-install__state_ready')).toBeNull();
  });

  it('stays dark, and quiet, in a browser with no service worker at all', async () => {
    vi.stubGlobal('navigator', {});

    const fixture = TestBed.createComponent(TimerInstall);

    await settle();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.timer-install__state_ready')).toBeNull();
  });
});
