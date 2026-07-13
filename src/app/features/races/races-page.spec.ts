import { PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EMPTY_INDEX, EXISTING_INDEX } from '../../core/github/archive-index.mock';
import { ArchiveService } from '../../github/archive.service';
import { CdnRefService } from '../../github/cdn-ref.service';
import { cdnRefServiceMock } from '../../github/cdn-ref.service.mock';
import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../spec-utils/platform.mock';
import { settle } from '../spec-utils/settle';
import { RacesPage } from './races-page';
import { RACES_TRANSFER_KEY } from './races-page.constant';
import { RacesStatus } from './races-page.enum';
import { RaceListItem } from './races-page.interface';
import {
  BAKED_RACE_ITEMS,
  EXPECTED_RACE_ITEMS,
  EXPECTED_RACE_TITLES,
  EXPECTED_YEARS,
  INDEX_LOAD_ERROR_MESSAGE,
  PREVIOUS_YEAR_INDEX,
  RACES_TODAY_ISO,
} from './races-page.mock';

const RACES_KEY = makeStateKey<{ data: RaceListItem[] } | null>(RACES_TRANSFER_KEY);

describe('RacesPage', () => {
  const loadIndex = vi.fn();

  let platformId = BROWSER_PLATFORM_ID;
  let fixture: ComponentFixture<RacesPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    // The month-final mark depends on the calendar, so only Date is faked (real timers keep `settle` working).
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(RACES_TODAY_ISO));
    platformId = BROWSER_PLATFORM_ID;
    loadIndex.mockResolvedValue(EXISTING_INDEX);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ArchiveService, useValue: { loadIndex } },
        { provide: CdnRefService, useValue: cdnRefServiceMock() },
        { provide: PLATFORM_ID, useFactory: () => platformId },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  async function createPage(): Promise<ComponentFixture<RacesPage>> {
    const created = TestBed.createComponent(RacesPage);

    await settle();

    return created;
  }

  it('renders the served race order as cards with protocol links and on-click pdf buttons', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(RacesStatus.ready);
    expect(page.races()).toEqual(EXPECTED_RACE_ITEMS);
    expect(
      page.yearGroups().map((group) => group.countText),
      'a same-year pair pluralizes as «забега»',
    ).toEqual(['2 забега']);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const titles = [...element.querySelectorAll('.race-card__title')].map((node) => node.textContent.replace(/\s+/g, ' ').trim());
    const pdfButtons = [...element.querySelectorAll('.race-card__pdf')];
    const protocolLinks = [...element.querySelectorAll('.race-card__protocol')];
    const heroValues = [...element.querySelectorAll('.race-card__hero-value')].map((node) => node.textContent.trim());
    const barHeights = [...element.querySelectorAll('.race-card__trend-bar')].map((node) => node.style.height);
    const genderValues = [...element.querySelectorAll('.race-card__gender-value')].map((node) => node.textContent.trim());

    expect(titles).toEqual(EXPECTED_RACE_TITLES);
    expect(
      [...element.querySelectorAll('.race-card')].map((card) => card.classList.contains('race-card_final')),
      'only the closed month’s last race carries the «итоговый» accent',
    ).toEqual(EXPECTED_RACE_ITEMS.map((item) => item.isMonthFinal));
    expect(element.querySelectorAll('.race-card__final-badge').length, 'the month-final card shows its badge').toBe(1);
    expect(heroValues, 'the hero shows the finisher count').toEqual(EXPECTED_RACE_ITEMS.map((item) => item.hero.value));
    expect(barHeights, 'the dynamics bars scale against the window maximum').toEqual(
      EXPECTED_RACE_ITEMS.flatMap((item) => (item.hero.trend?.bars ?? []).map((bar) => `${bar.heightPercent}%`)),
    );
    expect(
      [...element.querySelectorAll('.race-card__trend-bar')].map((node) => node.classList.contains('race-card__trend-bar_current')),
      'only the card’s own race lights its bar',
    ).toEqual(EXPECTED_RACE_ITEMS.flatMap((item) => (item.hero.trend?.bars ?? []).map((bar) => bar.isCurrent)));
    expect(
      [...element.querySelectorAll('.race-card__trend-bar')].map((node) => node.getAttribute('data-count')),
      'each bar carries its count for the hover bubble',
    ).toEqual(EXPECTED_RACE_ITEMS.flatMap((item) => (item.hero.trend?.bars ?? []).map((bar) => String(bar.count))));
    expect(
      [...element.querySelectorAll('.race-card__trend-highlight')].map((node) => node.textContent.replace(/\s+/g, ' ').trim()),
      'the caption tail names the series maximum or the race itself',
    ).toEqual(EXPECTED_RACE_ITEMS.map((item) => `· ${item.hero.trend?.highlightText}`));
    expect(
      [...element.querySelectorAll('.race-card__stat')].map((node) => node.classList.contains('race-card__stat_zero')),
      'zero side stats stay on the card, dimmed',
    ).toEqual(EXPECTED_RACE_ITEMS.flatMap((item) => item.hero.stats.map((stat) => stat.isZero)));
    expect(genderValues, 'every М/Ж cell renders its preformatted value').toEqual(
      EXPECTED_RACE_ITEMS.flatMap((item) => item.genders.flatMap((block) => [block.best, block.median])),
    );
    expect(
      protocolLinks.map((link) => link.getAttribute('href')),
      'each card links to the online protocol',
    ).toEqual(EXPECTED_RACE_ITEMS.map((item) => item.protocolLink.join('/')));
    expect(
      pdfButtons.map((button) => button.tagName),
      'the pdf action generates on click instead of linking to a file',
    ).toEqual(pdfButtons.map(() => 'BUTTON'));
    expect(
      pdfButtons.map((button, index) => button.getAttribute('aria-label').includes(String(EXPECTED_RACE_ITEMS[index].number))),
      'each pdf button names its race',
    ).toEqual(pdfButtons.map(() => true));
    expect(element.querySelector('.races__status').getAttribute('aria-live'), 'the live region stays in the DOM across states').toBe(
      'polite',
    );
    expect(element.querySelector('.races__status').textContent.trim(), 'the live region is empty once the list is ready').toBe('');
    expect(element.querySelector('.races__cdn-note')).not.toBeNull();
  });

  it('filters the list through the year chips, groups it under year dividers and resets on the all-years chip', async () => {
    loadIndex.mockResolvedValue(PREVIOUS_YEAR_INDEX);
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.years()).toEqual(EXPECTED_YEARS);
    expect(page.visibleRaces().length, 'no filter by default').toBe(2);
    expect(page.visibleRaces()[1].genders, 'a pre-stats index entry renders without the М/Ж block').toEqual([]);
    expect(page.visibleRaces()[1].hero.trend, 'a pre-stats index entry falls back to a chart-less participants hero').toBeNull();
    expect(
      page.yearGroups().map((group) => [group.year, group.countText, group.races.length]),
      'one season section per year, newest first, with a pluralized count',
    ).toEqual([
      [EXPECTED_YEARS[0], '1 забег', 1],
      [EXPECTED_YEARS[1], '1 забег', 1],
    ]);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const chips = [...element.querySelectorAll<HTMLButtonElement>('.races__filter-chip')];

    expect(chips.map((chip) => chip.textContent?.trim())).toEqual(['Все годы', ...EXPECTED_YEARS]);
    expect(chips[0].getAttribute('aria-pressed'), 'the all-years chip is pressed by default').toBe('true');

    chips[2].click();
    fixture.detectChanges();

    expect(page.visibleRaces().map((race) => race.slug)).toEqual([PREVIOUS_YEAR_INDEX.events[1].slug]);
    expect(element.querySelectorAll('.races__year-divider').length, 'a year filter keeps only its own section').toBe(1);

    element.querySelector<HTMLButtonElement>('.races__filter-chip')?.click();
    fixture.detectChanges();

    expect(page.visibleRaces().length, 'the all-years chip resets the filter').toBe(2);
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
