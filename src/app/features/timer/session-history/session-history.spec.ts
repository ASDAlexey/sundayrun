import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerRunnerOutcome } from '../../../core/timer/timer-session.enum';
import { TimerSession } from '../../../core/timer/timer-session.interface';
import {
  FIRST_UNNAMED_SPLIT_ID,
  KUZNETSOV_RUNNER_ID,
  TIMER_SESSION,
  TIMER_SESSION_WITHOUT_SPLITS,
  TROILIN_LAP_SPLIT_ID,
  TROILIN_RUNNER_ID,
} from '../../../core/timer/timer-session.mock';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerSessionServiceMock, timerSessionServiceMock } from '../../../state/timer-session.service.mock';
import { TimerHistory } from './session-history';
import { HISTORY_EXPECTED_LINES, HISTORY_NOBODY, HISTORY_REMOVE_NOTE, HISTORY_REMOVE_ORPHAN_NOTE } from './session-history.mock';

describe('TimerHistory', () => {
  let sessions: TimerSessionServiceMock;
  let fixture: ComponentFixture<TimerHistory>;
  let history: TimerHistory;

  /** Runs the newest pure change the component handed to the store against a session of our choosing. */
  const applyLastChange = (session: TimerSession): TimerSession => {
    const calls = sessions.updateActive.mock.calls;

    return calls[calls.length - 1][0](session);
  };

  beforeEach(() => {
    sessions = timerSessionServiceMock();
    TestBed.configureTestingModule({ providers: [{ provide: TimerSessionService, useValue: sessions }] });
    fixture = TestBed.createComponent(TimerHistory);
    history = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('lists every tap in journal order and names its owner', () => {
    expect(history.entries(), 'no measurement is open, so there is no journal').toEqual([]);
    expect(history.runners()).toEqual([]);
    expect(history.hasEntries()).toBe(false);

    sessions.active.set(TIMER_SESSION_WITHOUT_SPLITS);

    expect(history.entries()).toEqual([]);
    expect(history.runners()).toHaveLength(TIMER_SESSION.runners.length);

    sessions.active.set(TIMER_SESSION);

    const lines = history.entries().map((entry) => `${entry.index} ${entry.timeText} ${entry.ownerName ?? HISTORY_NOBODY}`);

    expect(lines).toEqual(HISTORY_EXPECTED_LINES);
    expect(
      history
        .entries()
        .map((entry) => entry.orphan)
        .slice(-2),
      'the last two times wait for a name',
    ).toEqual([true, true]);
    expect(history.hasEntries()).toBe(true);
  });

  it('moves a time to another runner, sends one back to the queue and records an outcome', () => {
    sessions.active.set(TIMER_SESSION);
    history.onExpand(TROILIN_LAP_SPLIT_ID);

    expect(history.expandedId()).toBe(TROILIN_LAP_SPLIT_ID);

    history.onExpand(TROILIN_LAP_SPLIT_ID);

    expect(history.expandedId(), 'tapping the owner again folds the roster back').toBeNull();

    history.onExpand(TROILIN_LAP_SPLIT_ID);
    history.onReassign(TROILIN_LAP_SPLIT_ID, KUZNETSOV_RUNNER_ID);

    const reassigned = applyLastChange(TIMER_SESSION).splits.find((split) => split.id === TROILIN_LAP_SPLIT_ID);

    expect(reassigned?.runnerId).toBe(KUZNETSOV_RUNNER_ID);
    expect(history.expandedId(), 'a handled entry closes itself').toBeNull();
    expect(history.entries().find((entry) => entry.id === TROILIN_LAP_SPLIT_ID)?.edited).toBe(true);

    history.onUnassign(TROILIN_LAP_SPLIT_ID);

    expect(applyLastChange(TIMER_SESSION).splits.find((split) => split.id === TROILIN_LAP_SPLIT_ID)?.runnerId).toBeNull();

    history.onOutcome(TROILIN_RUNNER_ID, TimerRunnerOutcome.lapOnly);

    const retired = applyLastChange(TIMER_SESSION).runners.find((runner) => runner.id === TROILIN_RUNNER_ID);

    expect(retired?.outcome, '«только круг» is a result edit too').toBe(TimerRunnerOutcome.lapOnly);
  });

  it('names the entry it is about to drop, and drops it only when the question is answered', async () => {
    sessions.active.set(TIMER_SESSION);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const dialog = (): HTMLDialogElement | null => element.querySelector('dialog.timer-confirm');
    const ask = async (index: number): Promise<void> => {
      element.querySelectorAll<HTMLElement>('.timer-history__action_danger')[index].click();
      await fixture.whenStable();
    };

    await ask(0);

    expect(dialog()?.querySelector('.timer-confirm__note')?.textContent).toBe(HISTORY_REMOVE_NOTE);

    dialog()?.querySelector<HTMLElement>('.timer-confirm__cancel')?.click();
    await fixture.whenStable();

    expect(sessions.updateActive, '«Отмена» keeps the journal whole').not.toHaveBeenCalled();
    expect(dialog()).toBeNull();

    await ask(0);
    dialog()?.querySelector<HTMLElement>('.timer-confirm__action')?.click();
    await fixture.whenStable();

    const dropped = applyLastChange(TIMER_SESSION);

    expect(dropped.splits).toHaveLength(TIMER_SESSION.splits.length - 1);
    expect(dropped.splits.some((split) => split.id === TROILIN_LAP_SPLIT_ID)).toBe(false);
    expect(dialog(), 'the question closes itself behind the deed').toBeNull();

    await ask(HISTORY_EXPECTED_LINES.length - 1);

    expect(dialog()?.querySelector('.timer-confirm__note')?.textContent, 'a nameless time is named as such').toBe(
      HISTORY_REMOVE_ORPHAN_NOTE,
    );
  });

  it('renders the journal, the roster picker and the close button', () => {
    const closed: number[] = [];

    history.close.subscribe(() => closed.push(1));
    sessions.active.set(TIMER_SESSION);
    history.onExpand(FIRST_UNNAMED_SPLIT_ID);
    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelectorAll('.timer-history__row')).toHaveLength(HISTORY_EXPECTED_LINES.length);
    expect(element.querySelector('.timer-history__nobody'), 'a nameless time says so').not.toBeNull();
    expect(element.querySelectorAll('.timer-history__pick')).toHaveLength(TIMER_SESSION.runners.length);
    expect(element.querySelectorAll('.timer-history__outcome')).toHaveLength(TIMER_SESSION.runners.length * 3);

    element.querySelector('.timer-history__close').click();

    expect(closed).toHaveLength(1);

    sessions.active.set(null);
    fixture.detectChanges();

    expect(element.querySelector('.timer-history__empty')).not.toBeNull();
    expect(element.querySelector('.timer-history__outcomes'), 'no roster, no outcome keys').toBeNull();
  });
});
