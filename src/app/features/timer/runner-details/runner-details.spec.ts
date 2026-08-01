import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerRunnerOutcome } from '../../../core/timer/timer-session.enum';
import { TimerSession } from '../../../core/timer/timer-session.interface';
import {
  KUZNETSOV_RUNNER_ID,
  POPOV_ALEKSEY_FINISH_MS,
  POPOV_ALEKSEY_LAP_MS,
  POPOV_ALEKSEY_RUNNER_ID,
  TIMER_SESSION,
  TROILIN_FINISH_MS,
  TROILIN_LAP_MS,
  TROILIN_RUNNER_ID,
} from '../../../core/timer/timer-session.mock';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerSessionServiceMock, timerSessionServiceMock } from '../../../state/timer-session.service.mock';
import { TimerRunnerCard } from './runner-details';
import {
  CARD_FINISH_TEXT,
  CARD_LAP_TEXT,
  CARD_NO_TIME_TEXT,
  CARD_OTHER_NAMES,
  CARD_OTHER_TIMES,
  CARD_REMOVE_NOTE,
} from './runner-details.mock';

describe('TimerRunnerCard', () => {
  let sessions: TimerSessionServiceMock;
  let fixture: ComponentFixture<TimerRunnerCard>;
  let card: TimerRunnerCard;

  const element = (): HTMLElement => fixture.nativeElement;
  const textOf = (selector: string): string[] => [...element().querySelectorAll(selector)].map((node) => node.textContent?.trim() ?? '');

  /** Runs the newest pure change the card handed to the store against a session of our choosing. */
  const applyLastChange = (session: TimerSession): TimerSession => {
    const calls = sessions.updateActive.mock.calls;

    return calls[calls.length - 1][0](session);
  };

  beforeEach(() => {
    sessions = timerSessionServiceMock();
    TestBed.configureTestingModule({ providers: [{ provide: TimerSessionService, useValue: sessions }] });
    fixture = TestBed.createComponent(TimerRunnerCard);
    card = fixture.componentInstance;
    fixture.componentRef.setInput('runnerId', TROILIN_RUNNER_ID);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('shows the times of one runner, everybody else to swap with, and closes on Escape', async () => {
    expect(card.fullName(), 'no measurement is open, so there is nobody to describe').toBe(CARD_NO_TIME_TEXT);
    expect(card.lapText()).toBe(CARD_NO_TIME_TEXT);
    expect(card.outcome(), 'and nobody to have retired').toBe(TimerRunnerOutcome.active);
    expect(card.others()).toEqual([]);

    sessions.active.set(TIMER_SESSION);
    await fixture.whenStable();

    expect(fixture.nativeElement.ownerDocument.activeElement, 'the card takes the focus itself — nothing else here traps it').toBe(
      element(),
    );
    expect(element().getAttribute('role'), 'a group and not a dialog: the tiles behind it stay tappable').toBe('group');
    expect(element().getAttribute('aria-label'), 'and the group is named by the man it describes').toBe('Троилин Антон');
    expect(element().querySelector('.timer-runner-card__name')?.textContent?.trim()).toBe('Троилин Антон');
    expect(textOf('.timer-runner-card__time-value')).toEqual([CARD_LAP_TEXT, CARD_FINISH_TEXT]);
    expect(card.outcome()).toBe(TimerRunnerOutcome.active);

    fixture.componentRef.setInput('runnerId', KUZNETSOV_RUNNER_ID);
    await fixture.whenStable();

    expect(textOf('.timer-runner-card__time-value'), 'nobody has tapped him yet').toEqual([CARD_NO_TIME_TEXT, CARD_NO_TIME_TEXT]);

    fixture.componentRef.setInput('runnerId', TROILIN_RUNNER_ID);
    card.onToggleSwap();
    await fixture.whenStable();

    expect(textOf('.timer-runner-card__pick-name'), 'the card never offers a swap with himself').toEqual([...CARD_OTHER_NAMES]);
    expect(textOf('.timer-runner-card__pick-times')).toEqual([...CARD_OTHER_TIMES]);

    const closed = vi.fn();

    card.close.subscribe(closed);
    element()
      .querySelector('.timer-runner-card__pick')
      ?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    element().querySelector<HTMLElement>('.timer-runner-card__close')?.click();

    expect(closed, 'Escape from anywhere inside and the × are the same way out').toHaveBeenCalledTimes(2);
  });

  it('swaps two mistapped runners, records an outcome and removes the runner on a full hold', async () => {
    const closed = vi.fn();

    card.close.subscribe(closed);
    sessions.active.set(TIMER_SESSION);
    card.onToggleSwap();
    await fixture.whenStable();

    expect(card.swapping()).toBe(true);

    element().querySelector<HTMLElement>('.timer-runner-card__pick')?.click();

    const swapped = applyLastChange(TIMER_SESSION);
    const ownerOf = (atMs: number): string | null | undefined => swapped.splits.find((split) => split.atMs === atMs)?.runnerId;

    expect(card.swapping(), 'the list folds itself back behind the repair').toBe(false);
    expect(ownerOf(TROILIN_LAP_MS), 'both times of the one tapped by mistake changed hands').toBe(POPOV_ALEKSEY_RUNNER_ID);
    expect(ownerOf(TROILIN_FINISH_MS)).toBe(POPOV_ALEKSEY_RUNNER_ID);
    expect(ownerOf(POPOV_ALEKSEY_LAP_MS), 'and both times of the other one came back').toBe(TROILIN_RUNNER_ID);
    expect(ownerOf(POPOV_ALEKSEY_FINISH_MS)).toBe(TROILIN_RUNNER_ID);

    await fixture.whenStable();
    element().querySelectorAll<HTMLElement>('.timer-runner-card__outcome')[2].click();

    expect(applyLastChange(TIMER_SESSION).runners.find((runner) => runner.id === TROILIN_RUNNER_ID)?.outcome).toBe(TimerRunnerOutcome.dnf);

    const dialog = (): HTMLDialogElement | null => element().querySelector('dialog.timer-confirm');

    element().querySelector<HTMLElement>('.timer-runner-card__remove')?.click();
    await fixture.whenStable();

    expect(dialog()?.querySelector('.timer-confirm__note')?.textContent, 'the question names him and his times').toBe(CARD_REMOVE_NOTE);

    dialog()?.querySelector<HTMLElement>('.timer-confirm__cancel')?.click();
    await fixture.whenStable();

    expect(closed, '«Отмена» keeps him in the race').not.toHaveBeenCalled();

    element().querySelector<HTMLElement>('.timer-runner-card__remove')?.click();
    await fixture.whenStable();
    dialog()?.querySelector<HTMLElement>('.timer-confirm__action')?.click();
    await fixture.whenStable();

    const removed = applyLastChange(TIMER_SESSION);

    expect(removed.runners.some((runner) => runner.id === TROILIN_RUNNER_ID)).toBe(false);
    expect(
      removed.splits.some((split) => split.runnerId === TROILIN_RUNNER_ID),
      'his times go with him',
    ).toBe(false);
    expect(closed, 'and the card has nothing left to describe').toHaveBeenCalledOnce();
  });
});
