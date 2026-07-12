import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EXPECTED_YEARS, LEADERBOARD_RECORDS, LEADERBOARD_YEAR } from '../../core/history/best-results.mock';
import { EXPECTED_COURSE_RECORD_HISTORY } from '../../core/history/course-records.mock';
import { Gender } from '../../core/models/gender.enum';
import { AthletesService } from '../../github/athletes.service';
import { ALL_YEARS_VALUE } from '../races/races-page.constant';
import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../spec-utils/platform.mock';
import { settle } from '../spec-utils/settle';
import { RecordsPage } from './records-page';
import { ALL_GENDERS_VALUE, KING_ALL_TIME_TEXT, KING_YEAR_PREFIX, QUEEN_ALL_TIME_TEXT } from './records-page.constant';
import { RecordsStatus } from './records-page.enum';
import {
  EXPECTED_CROWNED_MEN_KEY,
  EXPECTED_CROWNED_WOMEN_KEY,
  EXPECTED_MEN_NAMES,
  EXPECTED_MEN_TIMELINE_DELTAS,
  EXPECTED_MEN_TIMELINE_TIMES,
  EXPECTED_SEARCH_PLACE,
  EXPECTED_TIE_CROWNED_KEY,
  EXPECTED_TIMELINE_ROW_COUNT,
  EXPECTED_TOP_TIME_TEXT,
  EXPECTED_WOMEN_NAMES,
  EXPECTED_YEAR_RACE_SLUG,
  HISTORY_LOAD_ERROR_MESSAGE,
  NO_MATCH_QUERY,
  SEARCH_QUERY,
  TIE_RECORDS,
} from './records-page.mock';

describe('RecordsPage', () => {
  const loadRecords = vi.fn();
  const loadCourseRecords = vi.fn();

  let platformId = BROWSER_PLATFORM_ID;
  let fixture: ComponentFixture<RecordsPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    platformId = BROWSER_PLATFORM_ID;
    loadRecords.mockResolvedValue(LEADERBOARD_RECORDS);
    loadCourseRecords.mockResolvedValue(EXPECTED_COURSE_RECORD_HISTORY);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AthletesService, useValue: { loadRecords, loadCourseRecords } },
        { provide: PLATFORM_ID, useFactory: () => platformId },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  async function createPage(): Promise<ComponentFixture<RecordsPage>> {
    const created = TestBed.createComponent(RecordsPage);

    await settle();

    return created;
  }

  it('renders both full leaderboards with places and the participant counters', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(RecordsStatus.ready);
    expect(page.men().map((row) => row.displayName)).toEqual(EXPECTED_MEN_NAMES);
    expect(page.women().map((row) => row.displayName)).toEqual(EXPECTED_WOMEN_NAMES);
    expect(page.men().map((row) => row.place)).toEqual([1, 2, 3]);
    expect(page.men()[0].timeText).toBe(EXPECTED_TOP_TIME_TEXT);
    expect(page.years()).toEqual(EXPECTED_YEARS);
    expect(page.menCount()).toBe(EXPECTED_MEN_NAMES.length);
    expect(page.womenCount()).toBe(EXPECTED_WOMEN_NAMES.length);
    expect(
      page.men().flatMap((row) => (row.crowned ? [row.key] : [])),
      'the 19:00 tie stays with its first setter',
    ).toEqual([EXPECTED_CROWNED_MEN_KEY]);
    expect(page.women().flatMap((row) => (row.crowned ? [row.key] : []))).toEqual([EXPECTED_CROWNED_WOMEN_KEY]);
    expect(page.kingText()).toBe(KING_ALL_TIME_TEXT);
    expect(page.queenText()).toBe(QUEEN_ALL_TIME_TEXT);
    expect(
      page.menRecordTimeline().map((entry) => entry.timeText),
      'the timeline leads with the standing record',
    ).toEqual(EXPECTED_MEN_TIMELINE_TIMES);
    expect(page.menRecordTimeline().map((entry) => entry.improvementText)).toEqual(EXPECTED_MEN_TIMELINE_DELTAS);
    expect(page.menRecordTimeline().map((entry) => entry.current)).toEqual([true, false, false]);

    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelectorAll('.records__board').length, 'two leaderboards and two record timelines').toBe(4);
    expect(element.querySelector('.records__history')).not.toBeNull();
    expect(element.querySelectorAll('.records__timeline-row').length).toBe(EXPECTED_TIMELINE_ROW_COUNT);
    expect(element.querySelectorAll('.records__timeline-row_current').length, 'one standing record per gender').toBe(2);
    expect(element.querySelector('.records__board-count').textContent).toContain(`${EXPECTED_MEN_NAMES.length}`);
    expect(element.querySelector('.records__viewport'), 'the board list virtualizes through the window scroll').not.toBeNull();
    expect(element.querySelector('.records__search-input')).not.toBeNull();
    expect(element.querySelector('.records__status').textContent.trim(), 'the live region is empty once ready').toBe('');
  });

  it('search keeps the real place, and an unmatched query reports no matches', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.onQueryChange(SEARCH_QUERY);

    expect(page.men().map((row) => row.place)).toEqual([EXPECTED_SEARCH_PLACE]);
    expect(page.women()).toEqual([]);
    expect(page.menCount(), 'the participant counter ignores the search box').toBe(EXPECTED_MEN_NAMES.length);
    expect(page.noMatches(), 'one non-empty board is still a match').toBe(false);

    page.onQueryChange(NO_MATCH_QUERY);

    expect(page.noMatches()).toBe(true);

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('.records__board').length,
      'leaderboards hide behind the no-matches message, the record timelines stay',
    ).toBe(2);
  });

  it('filters by season and by gender', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.onYearChange(LEADERBOARD_YEAR);

    expect(page.men().map((row) => row.place)).toEqual([1]);
    expect(page.men()[0].raceLink.at(-1), 'the record run comes from the chosen season').toBe(EXPECTED_YEAR_RACE_SLUG);
    expect(page.men()[0].crowned, 'the sole 2024 runner is the season king').toBe(true);
    expect(page.kingText()).toBe(`${KING_YEAR_PREFIX} ${LEADERBOARD_YEAR}`);
    expect(page.women()).toEqual([]);

    page.onYearChange(ALL_YEARS_VALUE);

    expect(page.men().length).toBe(EXPECTED_MEN_NAMES.length);
    expect(page.kingText(), 'the crown label follows the season filter back').toBe(KING_ALL_TIME_TEXT);

    page.onGenderChange(Gender.male);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.records__board').length, 'one leaderboard and one timeline').toBe(2);

    page.setGender(Gender.female);
    page.onQueryChange(NO_MATCH_QUERY);

    expect(page.showMen()).toBe(false);
    expect(page.noMatches(), 'a hidden board never counts as a match').toBe(true);

    page.onQueryChange(SEARCH_QUERY);

    expect(page.noMatches(), 'Быстров is male, so the female board stays empty').toBe(true);

    page.onGenderChange(ALL_GENDERS_VALUE);

    expect(page.noMatches()).toBe(false);
    expect(page.gender(), 'the "all" toggle maps the sentinel back to null').toBeNull();
  });

  it('shows the empty state without history and the error state on a load failure', async () => {
    loadRecords.mockResolvedValue([]);
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(RecordsStatus.empty);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.records__status').textContent.trim()).not.toBe('');

    loadRecords.mockRejectedValue(new Error(HISTORY_LOAD_ERROR_MESSAGE));
    fixture.destroy();
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(RecordsStatus.error);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.records__error').getAttribute('role')).toBe('alert');
  });

  it('crowns the earliest runner of a three-way tie regardless of the alphabetic board order', async () => {
    loadRecords.mockResolvedValue(TIE_RECORDS);
    fixture = await createPage();

    expect(fixture.componentInstance.men().flatMap((row) => (row.crowned ? [row.key] : []))).toEqual([EXPECTED_TIE_CROWNED_KEY]);
  });

  it('does not fetch during prerender and keeps the loading state for hydration', async () => {
    platformId = SERVER_PLATFORM_ID;
    fixture = await createPage();

    expect(loadRecords).not.toHaveBeenCalled();
    expect(loadCourseRecords).not.toHaveBeenCalled();
    expect(fixture.componentInstance.status()).toBe(RecordsStatus.loading);
  });
});
