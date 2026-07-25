import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TIMER_SESSION, TIMER_SESSION_WITHOUT_SPLITS } from '../../../core/timer/timer-session.mock';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerSessionServiceMock, timerSessionServiceMock } from '../../../state/timer-session.service.mock';
import { TimerFinishBoard } from './finish-board';
import { FINISH_EXPECTED_ROWS, FINISH_EXPECTED_UNASSIGNED_TEXT, FINISH_EXPECTED_UNASSIGNED_TIMES } from './finish-board.mock';

describe('TimerFinishBoard', () => {
  let sessions: TimerSessionServiceMock;
  let fixture: ComponentFixture<TimerFinishBoard>;
  let finish: TimerFinishBoard;

  beforeEach(() => {
    sessions = timerSessionServiceMock();
    TestBed.configureTestingModule({ providers: [{ provide: TimerSessionService, useValue: sessions }] });
    fixture = TestBed.createComponent(TimerFinishBoard);
    finish = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('shows the protocol the publish path would build, and the times still without a name', () => {
    expect(finish.rows(), 'no measurement is open, so there is no protocol').toEqual([]);
    expect(finish.hasRows()).toBe(false);
    expect(finish.unassignedTimes()).toEqual([]);
    expect(finish.unassignedText(), 'an empty queue says nothing').toBeNull();

    sessions.active.set(TIMER_SESSION);

    expect(finish.rows()).toEqual(FINISH_EXPECTED_ROWS);
    expect(finish.hasRows()).toBe(true);
    expect(finish.unassignedTimes()).toEqual(FINISH_EXPECTED_UNASSIGNED_TIMES);
    expect(finish.unassignedText()).toBe(FINISH_EXPECTED_UNASSIGNED_TEXT);
  });

  it('renders the table, dims the rows without a 5 km time and drops the queue block once it is empty', () => {
    sessions.active.set(TIMER_SESSION);
    fixture.detectChanges();

    const element = fixture.nativeElement;
    const rows = element.querySelectorAll('.timer-finish-board__row');

    expect(rows).toHaveLength(FINISH_EXPECTED_ROWS.length);
    expect(rows[0].classList.contains('timer-finish-board__row_out')).toBe(false);
    expect(rows[3].classList.contains('timer-finish-board__row_out'), 'a 2.3 km runner keeps his line, dimmed').toBe(true);
    expect(element.querySelector('.timer-finish-board__place').textContent.trim()).toBe(FINISH_EXPECTED_ROWS[0].placeText);
    expect(element.querySelectorAll('.timer-finish-board__unassigned-time')).toHaveLength(FINISH_EXPECTED_UNASSIGNED_TIMES.length);

    sessions.active.set(TIMER_SESSION_WITHOUT_SPLITS);
    fixture.detectChanges();

    expect(element.querySelector('.timer-finish-board__unassigned')).toBeNull();
    expect(element.querySelectorAll('.timer-finish-board__row'), 'a roster with no taps is a protocol of DNFs').toHaveLength(
      FINISH_EXPECTED_ROWS.length,
    );

    sessions.active.set(null);
    fixture.detectChanges();

    expect(element.querySelector('.timer-finish-board__empty')).not.toBeNull();
  });
});
