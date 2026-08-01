import { DOCUMENT } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gender } from '../../../core/models/gender.enum';
import { PADDED_TIMER_ID, TIMER_ID, TIMER_ID_NOW_MS, TIMER_ID_RANDOM } from '../../../core/timer/timer-id.mock';
import { TimerRunnerOutcome } from '../../../core/timer/timer-session.enum';
import { TimerRosterStatus } from '../../../state/timer-roster.enum';
import { TimerRosterService } from '../../../state/timer-roster.service';
import { TimerRosterServiceMock, timerRosterServiceMock } from '../../../state/timer-roster.service.mock';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerSessionServiceMock, timerSessionServiceMock } from '../../../state/timer-session.service.mock';
import { TimerSessionChange } from '../../../state/timer-session.type';
import { SSR_DOCUMENT_MOCK } from '../../../state/timer-view.mock';
import { TimerPicker } from './runner-picker';
import {
  HAHUTSKIY_KEY,
  NEWCOMER_BLANK_NAME,
  NEWCOMER_FEMALE_NAME,
  NEWCOMER_FULL_NAME,
  NEWCOMER_INCOMPLETE_NAME,
  NEWCOMER_KNOWN_DISPLAY_NAME,
  NEWCOMER_KNOWN_NAME,
  NEWCOMER_RAW_NAME,
  NEWCOMER_TWIN_SURNAME,
  PICKER_ADD_CHECKED_TEXT,
  PICKER_APPEARANCES,
  PICKER_CACHED_AT_MS,
  PICKER_DONE_TEXT,
  PICKER_EMPTY_SESSION,
  PICKER_JUST_ADDED_BATCH,
  PICKER_JUST_ADDED_BATCH_TEXT,
  PICKER_JUST_ADDED_LEFT_TEXT,
  PICKER_JUST_ADDED_ONE_TEXT,
  PICKER_MISSING_GENDER_TEXT,
  PICKER_PREVIOUS_SESSION,
  PICKER_QUERY,
  PICKER_RECORDS,
  PICKER_REGULAR_NAMES,
  PICKER_ROSTER_AGE_PATTERN,
  PICKER_SESSION,
  PICKER_SESSION_ID,
  PICKER_SHORT_QUERY,
  PICKER_SHORT_QUERY_NAMES,
  ROMANENKO_META_TEXT,
  SIDOROVA_META_TEXT,
  TROILIN_META_TEXT,
} from './runner-picker.mock';

/** The sheet writes through `updateActive`, so the mock applies the change and the reads see it. */
function wireWrites(sessions: TimerSessionServiceMock): void {
  sessions.updateActive.mockImplementation((change: TimerSessionChange) => {
    sessions.active.update((session) => (session === null ? session : change(session)));
  });
}

function providersFor(sessions: TimerSessionServiceMock, roster: TimerRosterServiceMock): unknown[] {
  return [
    { provide: TimerSessionService, useValue: sessions },
    { provide: TimerRosterService, useValue: roster },
  ];
}

describe('TimerPicker', () => {
  let sessions: TimerSessionServiceMock;
  let roster: TimerRosterServiceMock;
  let fixture: ComponentFixture<TimerPicker>;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(TIMER_ID_NOW_MS);
    vi.spyOn(Math, 'random').mockReturnValue(TIMER_ID_RANDOM);
    sessions = timerSessionServiceMock();
    roster = timerRosterServiceMock();
    sessions.activeId.set(PICKER_SESSION_ID);
    sessions.active.set(PICKER_SESSION);
    sessions.sessions.set([PICKER_SESSION]);
    roster.records.set(PICKER_RECORDS);
    roster.appearanceCount.set(PICKER_APPEARANCES);
    wireWrites(sessions);
    TestBed.configureTestingModule({ providers: providersFor(sessions, roster) });
    fixture = TestBed.createComponent(TimerPicker);
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  it('refreshes the directory, suggests by name and adds a hit with the gender from the archive', () => {
    const picker = fixture.componentInstance;

    expect(roster.load, 'the sheet asks for fresh names the moment it opens').toHaveBeenCalledOnce();
    expect(picker.suggestions(), 'an empty query suggests nothing').toEqual([]);

    picker.query.set(PICKER_SHORT_QUERY);

    expect(
      picker.suggestions().map((option) => option.displayName),
      'two characters are already a list',
    ).toEqual(PICKER_SHORT_QUERY_NAMES);

    picker.query.set(PICKER_QUERY);

    const [match] = picker.suggestions();

    picker.pick(match);

    expect(picker.query(), 'a pick clears the box for the next name').toBe('');
    expect(picker.runners().at(-1)).toEqual({
      id: TIMER_ID,
      fullName: 'Хахуцкий Виктор',
      athleteKey: HAHUTSKIY_KEY,
      gender: Gender.male,
      outcome: TimerRunnerOutcome.active,
    });
    expect(picker.warningSurname(), 'a surname nobody shares raises nothing').toBeNull();

    picker.query.set(PICKER_QUERY);

    expect(picker.suggestions(), 'whoever is already in the roster stops being suggested').toEqual([]);
  });

  it('ranks the regulars by timed laps, ticks them off and adds the whole batch in one write', () => {
    const picker = fixture.componentInstance;

    picker.addRegulars();

    expect(sessions.updateActive, 'nothing ticked, nothing written').not.toHaveBeenCalled();
    expect(picker.regulars().map((option) => option.displayName)).toEqual(PICKER_REGULAR_NAMES);
    expect(picker.regulars()[0].metaText).toBe(TROILIN_META_TEXT);
    expect(picker.regulars()[3].metaText).toBe(ROMANENKO_META_TEXT);
    expect(picker.regulars().at(-1)?.metaText, 'no gender and no laps — both fallbacks').toBe(SIDOROVA_META_TEXT);

    const [top, second] = picker.regulars();

    picker.toggleRegular(top);
    picker.toggleRegular(second);

    expect(picker.checkedCount()).toBe(2);
    expect(picker.regulars()[0].checked).toBe(true);

    picker.toggleRegular(second);

    expect(picker.checkedCount(), 'a second tap unticks').toBe(1);

    picker.toggleRegular(second);

    expect(picker.doneText(), 'the button names the ticks it still owes').toBe(PICKER_ADD_CHECKED_TEXT);

    const closed = vi.fn();

    picker.close.subscribe(closed);
    picker.commit();

    expect(sessions.updateActive, 'thirty people, one write').toHaveBeenCalledOnce();
    expect(closed, 'the ticks are spent and the sheet steps aside').toHaveBeenCalledOnce();
    expect(picker.doneText(), 'nothing pending — the button answers with the line-up').toBe(PICKER_DONE_TEXT);
    expect(picker.runners().map((runner) => runner.fullName)).toEqual([
      'Попов Алексей',
      'Соколова Анна',
      PICKER_REGULAR_NAMES[0],
      PICKER_REGULAR_NAMES[1],
    ]);
    expect(new Set(picker.runners().map((runner) => runner.id)).size, 'one clock reading still yields distinct ids').toBe(4);
    expect(picker.checkedCount(), 'the ticks are spent').toBe(0);
  });

  it('pulls the previous line-up and skips whoever is already standing here', () => {
    const picker = fixture.componentInstance;

    expect(picker.previousCount(), 'a lone measurement has no «прошлый раз»').toBe(0);

    picker.addPrevious();

    expect(sessions.updateActive).not.toHaveBeenCalled();

    sessions.sessions.set([PICKER_SESSION, PICKER_EMPTY_SESSION, PICKER_PREVIOUS_SESSION]);

    expect(picker.previousCount(), 'the active one and the empty one are both skipped').toBe(3);

    picker.addPrevious();

    expect(
      picker.runners().map((runner) => runner.fullName),
      'the keyed twin and the unkeyed namesake are dropped',
    ).toEqual(['Попов Алексей', 'Соколова Анна', 'Хахуцкий Виктор']);
  });

  it('takes the newcomer from the search box itself, confirms the gender and warns about the namesake', () => {
    const picker = fixture.componentInstance;

    expect(picker.showNewcomer(), 'an empty box offers nothing to create').toBe(false);
    expect(picker.canAddNewcomer(), 'an empty box adds nobody').toBe(false);

    picker.addNewcomer();
    picker.query.set(NEWCOMER_BLANK_NAME);

    expect(picker.showNewcomer(), 'whitespace is not a name either').toBe(false);

    picker.addNewcomer();
    picker.query.set(NEWCOMER_INCOMPLETE_NAME);

    expect(picker.showNewcomer(), 'the form is offered from the first character typed').toBe(true);
    expect(picker.canAddNewcomer(), '«Попов» alone is not a participant').toBe(false);

    picker.addNewcomer();

    expect(sessions.updateActive, 'none of the three refusals reached the session').not.toHaveBeenCalled();

    picker.query.set(NEWCOMER_KNOWN_NAME);

    expect(picker.newcomerName(), 'the key shows the name as it would be written down').toBe(NEWCOMER_KNOWN_DISPLAY_NAME);
    expect(picker.newcomerKnown(), 'the archive already holds this exact person').toBe(true);
    expect(picker.canAddNewcomer(), 'and creating a second one is still allowed — brothers do run together').toBe(true);

    picker.query.set(NEWCOMER_RAW_NAME);

    expect(picker.canAddNewcomer()).toBe(true);
    expect(picker.newcomerKnown(), 'nobody by that name in the directory').toBe(false);
    expect(picker.newGender(), 'the dictionary guesses «Игорь» for us').toBe(Gender.male);

    picker.addNewcomer();

    expect(picker.runners().at(-1)).toEqual({
      id: TIMER_ID,
      fullName: NEWCOMER_FULL_NAME,
      athleteKey: null,
      gender: Gender.male,
      outcome: TimerRunnerOutcome.active,
    });
    expect(picker.warningSurname()).toBe(NEWCOMER_TWIN_SURNAME);
    expect(picker.query(), 'the box is ready for the next latecomer').toBe('');

    picker.query.set(NEWCOMER_FEMALE_NAME);

    expect(picker.newGender(), 'a new name re-infers the guess').toBe(Gender.female);

    picker.newGender.set(Gender.male);
    picker.addNewcomer();

    expect(picker.runners().at(-1)?.gender, 'the tap wins over the guess').toBe(Gender.male);
    expect(picker.warningSurname(), 'a surname nobody shares clears the warning').toBeNull();
  });

  it('names the person the last press added and takes that press back whole', () => {
    const picker = fixture.componentInstance;
    const roster = picker.runners().length;

    expect(picker.justAdded(), 'nothing has been pressed yet').toBeNull();

    picker.query.set(NEWCOMER_RAW_NAME);
    picker.addNewcomer();

    expect(picker.justAdded(), 'a misheard surname is caught only by reading it back').toBe(PICKER_JUST_ADDED_ONE_TEXT);

    picker.undoJustAdded();

    expect(picker.runners().length, 'one press in, one press out').toBe(roster);
    expect(picker.justAdded(), 'and the strip goes with the person').toBeNull();
    expect(picker.warningSurname()).toBeNull();

    const [top, second] = picker.regulars();

    picker.toggleRegular(top);
    picker.toggleRegular(second);
    picker.addRegulars();

    expect(picker.justAdded(), 'a batch is counted, not spelled out').toBe(PICKER_JUST_ADDED_BATCH_TEXT);

    const [, newest] = picker.runners().slice(-PICKER_JUST_ADDED_BATCH);

    picker.remove(newest);

    expect(picker.justAdded(), 'a «×» below narrows the strip instead of stranding it').toBe(PICKER_JUST_ADDED_LEFT_TEXT);

    picker.undoJustAdded();

    expect(picker.runners().length, '«Убрать» clears whatever is left of that press').toBe(roster);
  });

  it('holds «Готово» until every gender is answered for, and lets a mistake be removed', () => {
    const picker = fixture.componentInstance;

    expect(picker.genderPending()).toBe(true);
    expect(picker.missingGenderText()).toBe(PICKER_MISSING_GENDER_TEXT);

    const [popov, sokolova] = picker.runners();

    picker.setGender(sokolova, Gender.female);

    expect(picker.missingGender(), 'the answer came straight from her own row').toEqual([]);
    expect(picker.genderPending()).toBe(false);

    picker.remove(popov);

    expect(picker.runners().map((runner) => runner.fullName)).toEqual(['Соколова Анна']);
    expect(picker.warningSurname()).toBeNull();

    sessions.active.set(null);

    expect(picker.runners(), 'no measurement, no roster').toEqual([]);
    expect(picker.missingGender()).toEqual([]);
    expect(picker.genderPending()).toBe(false);
  });

  it('shows how old the cached directory is', () => {
    const picker = fixture.componentInstance;

    expect(picker.rosterAgeText(), 'a directory never read has no date to show').toBeNull();

    roster.cachedAtMs.set(PICKER_CACHED_AT_MS);

    expect(picker.rosterAgeText()).toMatch(PICKER_ROSTER_AGE_PATTERN);
  });

  it('renders the sheet, reports the directory state and closes three ways', () => {
    const picker = fixture.componentInstance;
    const closed = vi.fn();

    picker.close.subscribe(closed);
    sessions.sessions.set([PICKER_SESSION, PICKER_PREVIOUS_SESSION]);
    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelector('.timer-picker__title').textContent.trim()).toBe('Атлеты');
    expect(element.querySelectorAll('.timer-picker__runner').length).toBe(2);
    expect(element.querySelector('.timer-picker__quick-button')).not.toBeNull();
    expect(element.querySelector('.timer-picker__missing').textContent.trim()).toBe(PICKER_MISSING_GENDER_TEXT);
    expect(element.querySelector('.timer-picker__done').disabled, '«Готово» waits for the genders').toBe(true);

    picker.query.set(NEWCOMER_KNOWN_NAME);
    fixture.detectChanges();

    expect(
      element.querySelector('.timer-picker__newcomer .timer-picker__quick-button').textContent,
      'the key spells out whom it is about to add',
    ).toContain(NEWCOMER_KNOWN_DISPLAY_NAME);
    expect(element.querySelector('.timer-picker__known'), 'and says the archive already knows him').not.toBeNull();

    picker.query.set(NEWCOMER_INCOMPLETE_NAME);
    fixture.detectChanges();

    expect(element.querySelector('.timer-picker__hint'), 'a half-typed name asks for the other half').not.toBeNull();

    picker.query.set('');
    roster.status.set(TimerRosterStatus.loading);
    fixture.detectChanges();

    expect(element.querySelector('.timer-picker__status').textContent).toContain('Обновляем справочник');

    roster.status.set(TimerRosterStatus.error);
    fixture.detectChanges();

    expect(element.querySelector('.timer-picker__status').textContent, 'offline is a state, not an error screen').toContain('Сети нет');

    element.querySelector('.timer-picker__close').click();
    element.querySelector('.timer-picker__scrim').click();
    element.querySelector('.timer-picker').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(closed).toHaveBeenCalledTimes(3);
  });

  it('renders both empty states when there is neither a directory nor a roster', () => {
    roster.records.set([]);
    sessions.active.set(null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.timer-picker__empty').length).toBe(2);
  });
});

describe('TimerPicker without a window', () => {
  let sessions: TimerSessionServiceMock;
  let roster: TimerRosterServiceMock;

  beforeEach(() => {
    vi.clearAllMocks();
    sessions = timerSessionServiceMock();
    roster = timerRosterServiceMock();
    sessions.active.set(PICKER_SESSION);
    wireWrites(sessions);
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: SSR_DOCUMENT_MOCK }, ...providersFor(sessions, roster)],
    });
  });

  it('falls back to the prerender clock when the document has no window', () => {
    const picker = TestBed.runInInjectionContext(() => new TimerPicker());

    picker.query.set(NEWCOMER_FEMALE_NAME);
    picker.addNewcomer();

    expect(picker.runners().at(-1)?.id, 'a fixed pair of fallbacks — the id is never stored anyway').toBe(PADDED_TIMER_ID);
  });
});
