import { PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSelect } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { EMPTY_INDEX, EXISTING_INDEX } from '../../core/github/archive-index.mock';
import { ArchiveService } from '../../github/archive.service';
import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../spec-utils/platform.mock';
import { settle } from '../spec-utils/settle';
import { RacesPage } from './races-page';
import { ALL_YEARS_VALUE, RACES_TRANSFER_KEY } from './races-page.constant';
import { RacesStatus } from './races-page.enum';
import { RaceListItem } from './races-page.interface';
import {
  BAKED_RACE_ITEMS,
  EXPECTED_RACE_ITEMS,
  EXPECTED_RACE_TITLES,
  EXPECTED_YEARS,
  INDEX_LOAD_ERROR_MESSAGE,
  PREVIOUS_YEAR_INDEX,
} from './races-page.mock';

const RACES_KEY = makeStateKey<{ data: RaceListItem[] } | null>(RACES_TRANSFER_KEY);

describe('RacesPage', () => {
  const loadIndex = vi.fn();

  let platformId = BROWSER_PLATFORM_ID;
  let fixture: ComponentFixture<RacesPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    platformId = BROWSER_PLATFORM_ID;
    loadIndex.mockResolvedValue(EXISTING_INDEX);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ArchiveService, useValue: { loadIndex } },
        { provide: PLATFORM_ID, useFactory: () => platformId },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  async function createPage(): Promise<ComponentFixture<RacesPage>> {
    const created = TestBed.createComponent(RacesPage);

    await settle();

    return created;
  }

  it('renders the served race order as cards with protocol and CDN pdf links', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(RacesStatus.ready);
    expect(page.races()).toEqual(EXPECTED_RACE_ITEMS);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const titles = [...element.querySelectorAll('.race-card__title')].map((node) => node.textContent.trim());
    const pdfLinks = [...element.querySelectorAll('.race-card__pdf')];
    const protocolLinks = [...element.querySelectorAll('.race-card__protocol')];
    const statValues = [...element.querySelectorAll('.race-card__stat-value')].map((node) => node.textContent.trim());

    expect(titles).toEqual(EXPECTED_RACE_TITLES);
    expect(statValues, 'every stat chip renders its preformatted value').toEqual(
      EXPECTED_RACE_ITEMS.flatMap((item) => item.stats.map((stat) => stat.value)),
    );
    expect(
      protocolLinks.map((link) => link.getAttribute('href')),
      'each card links to the online protocol',
    ).toEqual(EXPECTED_RACE_ITEMS.map((item) => item.protocolLink.join('/')));
    expect(pdfLinks.map((link) => link.getAttribute('href'))).toEqual(EXPECTED_RACE_ITEMS.map((item) => item.pdfUrl));
    expect(pdfLinks[0].getAttribute('target')).toBe('_blank');
    expect(pdfLinks[0].getAttribute('rel')).toBe('noopener');
    expect(
      pdfLinks.map((link, index) => link.getAttribute('aria-label').includes(String(EXPECTED_RACE_ITEMS[index].number))),
      'each pdf link names its race',
    ).toEqual(pdfLinks.map(() => true));
    expect(element.querySelector('.races__status').getAttribute('aria-live'), 'the live region stays in the DOM across states').toBe(
      'polite',
    );
    expect(element.querySelector('.races__status').textContent.trim(), 'the live region is empty once the list is ready').toBe('');
    expect(element.querySelector('.races__cdn-note')).not.toBeNull();
  });

  it('filters the list by the selected year and resets on the all-years option', async () => {
    loadIndex.mockResolvedValue(PREVIOUS_YEAR_INDEX);
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.years()).toEqual(EXPECTED_YEARS);
    expect(page.visibleRaces().length, 'no filter by default').toBe(2);
    expect(page.visibleRaces()[1].stats, 'a pre-stats index entry renders without chips').toEqual([]);

    page.onYearChange(EXPECTED_YEARS[1]);

    expect(page.visibleRaces().map((race) => race.slug)).toEqual([PREVIOUS_YEAR_INDEX.events[1].slug]);

    page.onYearChange(ALL_YEARS_VALUE);

    expect(page.visibleRaces().length).toBe(2);

    fixture.detectChanges();

    // mat-select stamps its options into the overlay only once opened.
    const select: MatSelect = fixture.debugElement.query(By.directive(MatSelect)).componentInstance;

    select.open();
    fixture.detectChanges();

    const options = select.options.map((option) => option.value);

    expect(options).toEqual([ALL_YEARS_VALUE, ...EXPECTED_YEARS]);
  });

  it('shows the empty state for an index without events', async () => {
    loadIndex.mockResolvedValue(EMPTY_INDEX);
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(RacesStatus.empty);
    expect(fixture.componentInstance.races()).toEqual([]);

    fixture.detectChanges();

    const statusRegion = fixture.nativeElement.querySelector('.races__status');

    expect(statusRegion.getAttribute('aria-live')).toBe('polite');
    expect(statusRegion.textContent.trim(), 'the empty-state text is rendered inside the persistent live region').not.toBe('');
  });

  it('shows the error state when the index cannot be loaded', async () => {
    loadIndex.mockRejectedValue(new Error(INDEX_LOAD_ERROR_MESSAGE));
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(RacesStatus.error);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.races__error').getAttribute('role')).toBe('alert');
  });

  it('prerender fetches the list, renders the ready state and bakes it into the transfer state', async () => {
    platformId = SERVER_PLATFORM_ID;
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(RacesStatus.ready);
    expect(fixture.componentInstance.races()).toEqual(EXPECTED_RACE_ITEMS);
    expect(TestBed.inject(TransferState).get(RACES_KEY, null)).toEqual({ data: EXPECTED_RACE_ITEMS });

    loadIndex.mockRejectedValue(new Error(INDEX_LOAD_ERROR_MESSAGE));
    fixture.destroy();
    TestBed.inject(TransferState).remove(RACES_KEY);
    fixture = await createPage();

    expect(fixture.componentInstance.status(), 'a prerender failure keeps the calm loading state').toBe(RacesStatus.loading);
    expect(TestBed.inject(TransferState).get(RACES_KEY, null)).toBeNull();
  });

  it('applies the baked list before hydration, then refreshes it from the network', async () => {
    TestBed.inject(TransferState).set(RACES_KEY, { data: BAKED_RACE_ITEMS });
    fixture = TestBed.createComponent(RacesPage);

    const page = fixture.componentInstance;

    expect(page.status(), 'the baked cards render synchronously, so hydration matches the prerendered HTML').toBe(RacesStatus.ready);
    expect(page.races()).toEqual(BAKED_RACE_ITEMS);

    await settle();

    expect(page.races(), 'the network answer replaces the baked payload').toEqual(EXPECTED_RACE_ITEMS);

    loadIndex.mockRejectedValue(new Error(INDEX_LOAD_ERROR_MESSAGE));
    fixture.destroy();
    fixture = await createPage();

    expect(fixture.componentInstance.status(), 'a refresh failure stays silent while baked content is on screen').toBe(RacesStatus.ready);
    expect(fixture.componentInstance.races()).toEqual(BAKED_RACE_ITEMS);
  });
});
