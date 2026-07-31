import { DOCUMENT, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TimerPublishState } from '../../../core/timer/timer-session.enum';
import { TIMER_SESSION_FINISHED, TIMER_SESSION_ID } from '../../../core/timer/timer-session.mock';
import { AdminTokenService } from '../../../github/admin-token.service';
import { TimerPublishStep } from '../../../state/timer-publish.enum';
import { TimerPublishService } from '../../../state/timer-publish.service';
import { TIMER_PUBLISH_ERROR_TEXT, TIMER_PUBLISHED_SLUG, timerPublishServiceMock } from '../../../state/timer-publish.service.mock';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerSessionServiceMock, timerSessionServiceMock } from '../../../state/timer-session.service.mock';
import { TimerPublish } from './session-publish';
import {
  TIMER_PUBLISH_ADMIN_HREF,
  TIMER_PUBLISH_EMPTY_TEXT,
  TIMER_PUBLISH_GENDER_TEXT,
  TIMER_PUBLISH_RACE_HREF,
  TIMER_PUBLISH_REMOVE_NOTE,
  TIMER_PUBLISH_RESOLVE_FIRST_TEXT,
  TIMER_PUBLISH_UNNAMED_TEXT,
  TIMER_SESSION_EMPTY,
  TIMER_SESSION_READY,
  TIMER_SESSION_UNNAMED,
} from './session-publish.mock';

describe('TimerPublish', () => {
  const isAdmin = signal(true);

  let publish: ReturnType<typeof timerPublishServiceMock>;
  let sessions: TimerSessionServiceMock;
  let fixture: ComponentFixture<TimerPublish>;

  beforeEach(() => {
    vi.clearAllMocks();
    isAdmin.set(true);
    publish = timerPublishServiceMock();
    sessions = timerSessionServiceMock();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: TimerPublishService, useValue: publish },
        { provide: TimerSessionService, useValue: sessions },
        { provide: AdminTokenService, useValue: { isAdmin } },
      ],
    });
    fixture = TestBed.createComponent(TimerPublish);
    fixture.componentRef.setInput('session', TIMER_SESSION_READY);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('publishes on the single press, walks the steps and ends with the protocol link', async () => {
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;

    element.querySelector<HTMLButtonElement>('.timer-publish__save')?.click();
    TestBed.inject(DOCUMENT).defaultView?.dispatchEvent(new Event('online'));

    expect(publish.publish).toHaveBeenCalledExactlyOnceWith(TIMER_SESSION_READY);
    expect(element.querySelector('.timer-publish__preview-link')?.getAttribute('href')).toBe('/preview');

    publish.state.set(TimerPublishState.pending);
    publish.step.set(TimerPublishStep.committing);
    await fixture.whenStable();

    const steps = [...element.querySelectorAll('.timer-publish__step')];

    expect(steps.map((step) => step.className)).toEqual([
      'timer-publish__step timer-publish__step_done',
      'timer-publish__step timer-publish__step_active',
      'timer-publish__step',
    ]);
    expect(element.querySelector('.timer-publish__save'), 'the button is gone while it works').toBeNull();

    publish.state.set(TimerPublishState.published);
    publish.step.set(TimerPublishStep.done);
    await fixture.whenStable();

    expect(element.querySelector('.timer-publish__open'), 'no slug yet, no link to offer').toBeNull();

    publish.publishedSlug.set(TIMER_PUBLISHED_SLUG);
    await fixture.whenStable();

    expect(element.querySelector('.timer-publish__open')?.getAttribute('href')).toBe(TIMER_PUBLISH_RACE_HREF);
    expect(element.querySelector('.timer-publish__check-mark'), 'the tick is drawn as a stroke').not.toBeNull();
    expect(element.querySelector('.timer-publish')?.classList.contains('timer-publish_done')).toBe(true);
  });

  it('offers the retry after a failure, and again when the network comes back', async () => {
    publish.state.set(TimerPublishState.failed);
    publish.step.set(TimerPublishStep.failed);
    publish.error.set(TIMER_PUBLISH_ERROR_TEXT);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.timer-publish__error')?.textContent?.trim()).toBe(TIMER_PUBLISH_ERROR_TEXT);
    expect(element.querySelector('.timer-publish')?.classList.contains('timer-publish_failed')).toBe(true);
    expect(element.querySelector('.timer-publish__online'), 'nothing is offered while the network is down').toBeNull();

    TestBed.inject(DOCUMENT).defaultView?.dispatchEvent(new Event('online'));
    await fixture.whenStable();

    expect(element.querySelector('.timer-publish__online')).not.toBeNull();

    element.querySelector<HTMLButtonElement>('.timer-publish__retry')?.click();
    await fixture.whenStable();

    expect(publish.publish).toHaveBeenCalledExactlyOnceWith(TIMER_SESSION_READY);
    expect(element.querySelector('.timer-publish__online'), 'the offer is spent on the retry').toBeNull();
  });

  it('confirms the local save for a guest and points at the key without publishing anything', async () => {
    isAdmin.set(false);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.timer-publish__saved')).toBeNull();

    element.querySelector<HTMLButtonElement>('.timer-publish__save')?.click();
    await fixture.whenStable();

    expect(publish.publish, 'a guest has nothing to send').not.toHaveBeenCalled();
    expect(element.querySelector('.timer-publish__saved')).not.toBeNull();
    expect(element.querySelector('.timer-publish__admin-link')?.getAttribute('href')).toBe(TIMER_PUBLISH_ADMIN_HREF);
    expect(element.querySelector('.timer-publish__note'), 'the key check needs the internet').not.toBeNull();
  });

  it('blocks the publication until every gender is known, and settles the unnamed times either way', async () => {
    publish.state.set(TimerPublishState.failed);
    publish.step.set(TimerPublishStep.failed);
    fixture.componentRef.setInput('session', TIMER_SESSION_FINISHED);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const queued = vi.fn();

    fixture.componentInstance.queue.subscribe(queued);

    expect(element.querySelector('.timer-publish__blocked')?.textContent?.trim()).toBe(TIMER_PUBLISH_GENDER_TEXT);
    expect(element.querySelector('.timer-publish__unnamed-text')?.textContent?.trim()).toBe(TIMER_PUBLISH_UNNAMED_TEXT);

    element.querySelector<HTMLButtonElement>('.timer-publish__retry')?.click();

    expect(publish.publish, 'a runner without a gender has no place in the protocol').not.toHaveBeenCalled();

    element.querySelector<HTMLButtonElement>('.timer-publish__unnamed-resolve')?.click();

    expect(queued).toHaveBeenCalledOnce();

    element.querySelector<HTMLButtonElement>('.timer-publish__unnamed-drop')?.click();

    expect(sessions.update.mock.calls[0][0]).toBe(TIMER_SESSION_ID);
    expect(sessions.update.mock.calls[0][1](TIMER_SESSION_FINISHED).splits).toEqual(
      TIMER_SESSION_FINISHED.splits.filter((split) => split.runnerId !== null),
    );

    fixture.componentRef.setInput('session', TIMER_SESSION_EMPTY);
    await fixture.whenStable();

    expect(
      element.querySelector('.timer-publish__blocked')?.textContent?.trim(),
      'a race nobody ran is stopped before any gender is asked about',
    ).toBe(TIMER_PUBLISH_EMPTY_TEXT);
  });

  it('holds «Сохранить» while a time is still nobody’s, and says so when it is pressed', async () => {
    fixture.componentRef.setInput('session', TIMER_SESSION_UNNAMED);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const save = element.querySelector<HTMLButtonElement>('.timer-publish__save');

    expect(save?.getAttribute('aria-disabled'), 'the key reads as held to a screen reader too').toBe('true');
    expect(save?.classList.contains('timer-publish__save_held')).toBe(true);
    expect(element.querySelector('.timer-publish__nag'), 'nothing is said before the key is pressed').toBeNull();

    save?.click();
    await fixture.whenStable();

    expect(publish.publish, 'a time without a name never reaches the archive').not.toHaveBeenCalled();
    expect(element.querySelector('.timer-publish__nag')?.textContent?.trim()).toBe(TIMER_PUBLISH_RESOLVE_FIRST_TEXT);

    fixture.componentRef.setInput('session', TIMER_SESSION_READY);
    await fixture.whenStable();

    expect(element.querySelector('.timer-publish__nag'), 'the answer goes with the queue it was about').toBeNull();
    expect(element.querySelector<HTMLButtonElement>('.timer-publish__save')?.getAttribute('aria-disabled')).toBeNull();
  });

  it('throws a test run away from the finish screen, once the question is answered', async () => {
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const dialog = (): HTMLDialogElement | null => element.querySelector('dialog.timer-confirm');
    const ask = async (): Promise<void> => {
      element.querySelector<HTMLButtonElement>('.timer-publish__remove')?.click();
      await fixture.whenStable();
    };

    expect(element.querySelector('.timer-publish__remove-hint'), 'the card says how «Удалить» differs from «Сброс»').not.toBeNull();

    await ask();

    expect(dialog()?.querySelector('.timer-confirm__note')?.textContent).toBe(TIMER_PUBLISH_REMOVE_NOTE);

    dialog()?.querySelector<HTMLElement>('.timer-confirm__cancel')?.click();
    await fixture.whenStable();

    expect(sessions.remove, '«Отмена» keeps the measurement').not.toHaveBeenCalled();

    await ask();
    dialog()?.querySelector<HTMLElement>('.timer-confirm__action')?.click();
    await fixture.whenStable();

    expect(sessions.remove).toHaveBeenCalledExactlyOnceWith(TIMER_SESSION_ID);

    publish.state.set(TimerPublishState.published);
    publish.step.set(TimerPublishStep.done);
    await fixture.whenStable();

    expect(element.querySelector('.timer-publish__remove'), 'a race already in the archive is not thrown away from here').toBeNull();
  });
});

describe('TimerPublish without a window', () => {
  const isAdmin = signal(false);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: { defaultView: null } },
        { provide: TimerPublishService, useValue: timerPublishServiceMock() },
        { provide: TimerSessionService, useValue: timerSessionServiceMock() },
        { provide: AdminTokenService, useValue: { isAdmin } },
      ],
    });
  });

  it('skips the network listener during prerender instead of throwing', () => {
    expect(() => TestBed.runInInjectionContext(() => new TimerPublish())).not.toThrow();
  });
});
