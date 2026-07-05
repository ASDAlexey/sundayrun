import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AthletesSort } from '../../core/history/athletes-list.enum';
import { EXPECTED_ROLLUP_HISTORY } from '../../core/history/athletes-rollup.mock';
import { AthletesService } from '../../github/athletes.service';
import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../spec-utils/platform.mock';
import { settle } from '../spec-utils/settle';
import { AthletesPage } from './athletes-page';
import { AthletesStatus } from './athletes-page.enum';
import {
  ATHLETES_LOAD_ERROR_MESSAGE,
  ATHLETES_NO_MATCH_QUERY,
  ATHLETES_SEARCH_QUERY,
  EXPECTED_BEST_TIME_ITEMS,
  EXPECTED_PARTICIPATION_KEYS,
  EXPECTED_SEARCH_KEYS,
} from './athletes-page.mock';

describe('AthletesPage', () => {
  const loadHistory = vi.fn();

  let platformId = BROWSER_PLATFORM_ID;
  let fixture: ComponentFixture<AthletesPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    platformId = BROWSER_PLATFORM_ID;
    loadHistory.mockResolvedValue(EXPECTED_ROLLUP_HISTORY);
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

  async function createPage(): Promise<ComponentFixture<AthletesPage>> {
    const created = TestBed.createComponent(AthletesPage);

    await settle();

    return created;
  }

  it('renders the athletes sorted by best time by default with personal links and column headers', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(AthletesStatus.ready);
    expect(page.items()).toEqual(EXPECTED_BEST_TIME_ITEMS);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const headers = [...element.querySelectorAll('.athletes__th')];
    const links = [...element.querySelectorAll('.athletes__athlete')];
    const sortButtons = [...element.querySelectorAll('.athletes__sort')];

    expect(element.querySelector('.athletes__status').getAttribute('aria-live'), 'the live region stays in the DOM across states').toBe(
      'polite',
    );
    expect(element.querySelector('.athletes__status').textContent.trim(), 'the live region is empty once the list is ready').toBe('');
    expect(headers.map((header) => header.getAttribute('scope'))).toEqual(['col', 'col', 'col']);
    expect(links.map((link) => link.textContent.trim())).toEqual(EXPECTED_BEST_TIME_ITEMS.map((item) => item.displayName));
    expect(links[0].getAttribute('href')).toBe(
      `${EXPECTED_BEST_TIME_ITEMS[0].link[0]}/${encodeURIComponent(EXPECTED_BEST_TIME_ITEMS[0].link[1])}`,
    );
    expect(
      sortButtons.map((button) => button.getAttribute('aria-pressed')),
      'the active sort is pressed',
    ).toEqual(['true', 'false']);
    expect(element.querySelector('.athletes__search-label').getAttribute('for')).toBe(
      element.querySelector('.athletes__search-input').getAttribute('id'),
    );
  });

  it('re-sorts by participations, filters by a normalized query and reports an empty match', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.setSort(AthletesSort.participations);

    expect(page.items().map((item) => item.key)).toEqual(EXPECTED_PARTICIPATION_KEYS);

    page.onQueryChange(ATHLETES_SEARCH_QUERY);

    expect(page.items().map((item) => item.key)).toEqual(EXPECTED_SEARCH_KEYS);

    page.onQueryChange(ATHLETES_NO_MATCH_QUERY);

    expect(page.items()).toEqual([]);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const sortButtons = [...element.querySelectorAll('.athletes__sort')];

    const statusRegions = [...element.querySelectorAll('.athletes__status')];

    expect(sortButtons.map((button) => button.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
    expect(statusRegions.at(-1).getAttribute('role'), 'the empty match note is announced').toBe('status');
    expect(statusRegions.at(-1).textContent.trim(), 'the "no matches" note lives in the persistent live region').not.toBe('');
    expect(element.querySelector('.athletes__table-wrap')).toBeNull();
  });

  it('shows the empty state for a history without athletes and keeps the CDN note visible', async () => {
    loadHistory.mockResolvedValue({});
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(AthletesStatus.empty);
    expect(fixture.componentInstance.items()).toEqual([]);

    fixture.detectChanges();

    const element = fixture.nativeElement;

    const statusRegion = element.querySelector('.athletes__status');

    expect(statusRegion.getAttribute('aria-live')).toBe('polite');
    expect(statusRegion.textContent.trim(), 'the empty-state text is rendered inside the persistent live region').not.toBe('');
    expect(element.querySelector('.athletes__cdn-note')).not.toBeNull();
  });

  it('shows the error state when the history cannot be loaded', async () => {
    loadHistory.mockRejectedValue(new Error(ATHLETES_LOAD_ERROR_MESSAGE));
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(AthletesStatus.error);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.athletes__error').getAttribute('role')).toBe('alert');
  });

  it('does not fetch during prerender and keeps the loading state for hydration', async () => {
    platformId = SERVER_PLATFORM_ID;
    fixture = await createPage();

    expect(loadHistory).not.toHaveBeenCalled();
    expect(fixture.componentInstance.status()).toBe(AthletesStatus.loading);
  });
});
