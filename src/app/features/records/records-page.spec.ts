import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EXPECTED_YEARS, LEADERBOARD_YEAR } from '../../core/history/best-results.mock';
import { Gender } from '../../core/models/gender.enum';
import { AthletesService } from '../../github/athletes.service';
import { ALL_YEARS_VALUE } from '../races/races-page.constant';
import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../spec-utils/platform.mock';
import { settle } from '../spec-utils/settle';
import { RecordsPage } from './records-page';
import { RecordsStatus } from './records-page.enum';
import {
  EXPECTED_MEN_NAMES,
  EXPECTED_SEARCH_PLACE,
  EXPECTED_TOP_TIME_TEXT,
  EXPECTED_WOMEN_NAMES,
  EXPECTED_YEAR_RACE_SLUG,
  HISTORY_LOAD_ERROR_MESSAGE,
  NO_MATCH_QUERY,
  RECORDS_HISTORY_MOCK,
  SEARCH_QUERY,
} from './records-page.mock';

describe('RecordsPage', () => {
  const loadHistory = vi.fn();

  let platformId = BROWSER_PLATFORM_ID;
  let fixture: ComponentFixture<RecordsPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    platformId = BROWSER_PLATFORM_ID;
    loadHistory.mockResolvedValue(RECORDS_HISTORY_MOCK);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AthletesService, useValue: { loadHistory } },
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

    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelectorAll('.records__board').length).toBe(2);
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

    expect(fixture.nativeElement.querySelectorAll('.records__board').length, 'boards hide behind the no-matches message').toBe(0);
  });

  it('filters by season and by gender', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.onYearChange(LEADERBOARD_YEAR);

    expect(page.men().map((row) => row.place)).toEqual([1]);
    expect(page.men()[0].raceLink.at(-1), 'the record run comes from the chosen season').toBe(EXPECTED_YEAR_RACE_SLUG);
    expect(page.women()).toEqual([]);

    page.onYearChange(ALL_YEARS_VALUE);

    expect(page.men().length).toBe(EXPECTED_MEN_NAMES.length);

    page.setGender(Gender.male);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.records__board').length).toBe(1);

    page.setGender(Gender.female);
    page.onQueryChange(NO_MATCH_QUERY);

    expect(page.showMen()).toBe(false);
    expect(page.noMatches(), 'a hidden board never counts as a match').toBe(true);

    page.onQueryChange(SEARCH_QUERY);

    expect(page.noMatches(), 'Быстров is male, so the female board stays empty').toBe(true);

    page.setGender(null);

    expect(page.noMatches()).toBe(false);
  });

  it('shows the empty state without history and the error state on a load failure', async () => {
    loadHistory.mockResolvedValue({});
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(RecordsStatus.empty);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.records__status').textContent.trim()).not.toBe('');

    loadHistory.mockRejectedValue(new Error(HISTORY_LOAD_ERROR_MESSAGE));
    fixture.destroy();
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(RecordsStatus.error);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.records__error').getAttribute('role')).toBe('alert');
  });

  it('does not fetch during prerender and keeps the loading state for hydration', async () => {
    platformId = SERVER_PLATFORM_ID;
    fixture = await createPage();

    expect(loadHistory).not.toHaveBeenCalled();
    expect(fixture.componentInstance.status()).toBe(RecordsStatus.loading);
  });
});
