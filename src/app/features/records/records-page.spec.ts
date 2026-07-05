import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AthletesService } from '../../github/athletes.service';
import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../spec-utils/platform.mock';
import { settle } from '../spec-utils/settle';
import { RecordsPage } from './records-page';
import { RecordsStatus } from './records-page.enum';
import {
  EXPECTED_MEN_NAMES,
  EXPECTED_TOP_TIME_TEXT,
  EXPECTED_WOMEN_NAMES,
  HISTORY_LOAD_ERROR_MESSAGE,
  RECORDS_HISTORY_MOCK,
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

  it('renders both leaderboards with places, times and links to athletes and record races', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(RecordsStatus.ready);
    expect(page.men().map((row) => row.displayName)).toEqual(EXPECTED_MEN_NAMES);
    expect(page.women().map((row) => row.displayName)).toEqual(EXPECTED_WOMEN_NAMES);
    expect(page.men().map((row) => row.place)).toEqual([1, 2, 3]);
    expect(page.men()[0].timeText).toBe(EXPECTED_TOP_TIME_TEXT);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const boards = element.querySelectorAll('.records__board');
    const firstAthlete = element.querySelector('.records__athlete');
    const firstDate = element.querySelector('.records__date');

    expect(boards.length).toBe(2);
    expect(decodeURIComponent(firstAthlete.getAttribute('href')), 'the router encodes the key in the href').toBe(
      page.men()[0].athleteLink.join('/'),
    );
    expect(firstDate.getAttribute('href')).toBe(page.men()[0].raceLink.join('/'));
    expect(element.querySelector('.records__status').textContent.trim(), 'the live region is empty once ready').toBe('');
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
