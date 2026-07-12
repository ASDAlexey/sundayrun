import { PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EXISTING_INDEX } from '../../core/github/archive-index.mock';
import { EMPTY_SITE_META } from '../../core/github/site-meta.constant';
import { SiteMetaFile } from '../../core/github/site-meta.interface';
import { ANNOUNCEMENT_ONLY_SITE_META, EXISTING_SITE_META } from '../../core/github/site-meta.mock';
import { OverallStats } from '../../core/history/overall-stats.interface';
import { EXPECTED_STATS } from '../../core/history/overall-stats.mock';
import { ArchiveService } from '../../github/archive.service';
import { AthletesService } from '../../github/athletes.service';
import { CdnRefService } from '../../github/cdn-ref.service';
import { cdnRefServiceMock } from '../../github/cdn-ref.service.mock';
import { SiteMetaService } from '../../github/site-meta.service';
import { SITE_META_CDN_ERROR_MESSAGE } from '../../github/site-meta.service.mock';
import { RacesStatus } from '../races/races-page.enum';
import { RaceListItem } from '../races/races-page.interface';
import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../spec-utils/platform.mock';
import { settle } from '../spec-utils/settle';
import { HomePage } from './home-page';
import { HOME_META_TRANSFER_KEY, HOME_RACES_TRANSFER_KEY, HOME_STATS_TRANSFER_KEY, RACES_PAGE_LINK } from './home-page.constant';
import {
  ATHLETES_LOAD_ERROR_MESSAGE,
  BAKED_RACE_ITEMS,
  EXPECTED_ANNOUNCE_TIME_TEXT,
  EXPECTED_MEN_ONLY_STATS_VALUES,
  EXPECTED_RACE_ITEMS,
  EXPECTED_RACE_TITLES,
  EXPECTED_STATS_VALUES,
  INDEX_LOAD_ERROR_MESSAGE,
  MEN_ONLY_STATS,
} from './home-page.mock';
import { RACES_TODAY_ISO } from '../races/races-page.mock';

const RACES_KEY = makeStateKey<{ data: RaceListItem[] } | null>(HOME_RACES_TRANSFER_KEY);
const META_KEY = makeStateKey<{ data: SiteMetaFile } | null>(HOME_META_TRANSFER_KEY);
const STATS_KEY = makeStateKey<{ data: OverallStats } | null>(HOME_STATS_TRANSFER_KEY);

describe('HomePage', () => {
  const loadLatest = vi.fn();
  const loadMeta = vi.fn();
  const loadOverallStats = vi.fn();

  let platformId = BROWSER_PLATFORM_ID;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(() => {
    vi.clearAllMocks();
    // The month-final mark depends on the calendar, so only Date is faked (real timers keep `settle` working).
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(RACES_TODAY_ISO));
    platformId = BROWSER_PLATFORM_ID;
    loadLatest.mockResolvedValue(EXISTING_INDEX.events);
    loadMeta.mockResolvedValue(EMPTY_SITE_META);
    loadOverallStats.mockResolvedValue(EXPECTED_STATS);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ArchiveService, useValue: { loadLatest } },
        { provide: CdnRefService, useValue: cdnRefServiceMock() },
        { provide: SiteMetaService, useValue: { load: loadMeta } },
        { provide: AthletesService, useValue: { loadOverallStats } },
        { provide: PLATFORM_ID, useFactory: () => platformId },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  async function createPage(): Promise<ComponentFixture<HomePage>> {
    const created = TestBed.createComponent(HomePage);

    await settle();

    return created;
  }

  it('renders the latest races as cards with the all-races links', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(RacesStatus.ready);
    expect(page.latestRaces(), 'the index has fewer events than the preview cap, so all of them show').toEqual(EXPECTED_RACE_ITEMS);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const titles = [...element.querySelectorAll('.race-card__title')].map((node) => node.textContent.trim());

    expect(titles).toEqual(EXPECTED_RACE_TITLES);
    expect(element.querySelector('.home__latest-all').getAttribute('href')).toBe(RACES_PAGE_LINK);
    expect(element.querySelector('.home__all-cta').getAttribute('href')).toBe(RACES_PAGE_LINK);
    expect(element.querySelector('.home__course'), 'the course card stays on the landing').not.toBeNull();
    expect(element.querySelector('.home__announce'), 'no announcement block until the organiser publishes one').toBeNull();

    const statValues = [...element.querySelectorAll('.home__stats-value')].map((node) => node.textContent.trim());

    expect(statValues, 'the overall statistics render formatted totals').toEqual(EXPECTED_STATS_VALUES);
  });

  it('shows the published start time and announcement, and stays silent on a meta failure', async () => {
    loadMeta.mockResolvedValue(EXISTING_SITE_META);
    fixture = await createPage();

    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelector('.home__announce-time').textContent.trim()).toBe(EXPECTED_ANNOUNCE_TIME_TEXT);
    expect(element.querySelector('.home__announce-text').textContent.trim()).toBe(EXISTING_SITE_META.announcement);

    loadMeta.mockResolvedValue(ANNOUNCEMENT_ONLY_SITE_META);
    fixture.destroy();
    fixture = await createPage();

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.home__announce-time'), 'no time line without a start time').toBeNull();
    expect(fixture.nativeElement.querySelector('.home__announce-text').textContent.trim()).toBe(ANNOUNCEMENT_ONLY_SITE_META.announcement);

    loadMeta.mockRejectedValue(new Error(SITE_META_CDN_ERROR_MESSAGE));
    fixture.destroy();
    fixture = await createPage();

    expect(fixture.componentInstance.status(), 'the race preview is unaffected by the meta failure').toBe(RacesStatus.ready);
    expect(fixture.componentInstance.hasAnnouncement()).toBe(false);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.home__announce')).toBeNull();
  });

  it('shows the empty and error states of the race preview', async () => {
    loadLatest.mockResolvedValue([]);
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(RacesStatus.empty);

    fixture.detectChanges();

    const statusRegion = fixture.nativeElement.querySelector('.home__status');

    expect(statusRegion.getAttribute('aria-live')).toBe('polite');
    expect(statusRegion.textContent.trim(), 'the empty-state text is rendered inside the persistent live region').not.toBe('');

    loadOverallStats.mockResolvedValue(MEN_ONLY_STATS);
    fixture.destroy();
    fixture = await createPage();

    fixture.detectChanges();

    const menOnlyValues = [...fixture.nativeElement.querySelectorAll('.home__stats-value')].map((node) => node.textContent.trim());

    expect(menOnlyValues, 'a gender without 5 km finishes shows a dash instead of 0:00').toEqual(EXPECTED_MEN_ONLY_STATS_VALUES);

    loadLatest.mockRejectedValue(new Error(INDEX_LOAD_ERROR_MESSAGE));
    loadOverallStats.mockRejectedValue(new Error(ATHLETES_LOAD_ERROR_MESSAGE));
    fixture.destroy();
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(RacesStatus.error);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.home__error').getAttribute('role')).toBe('alert');
    expect(fixture.nativeElement.querySelector('.home__stats'), 'a history failure silently hides the statistics').toBeNull();
  });

  it('prerender fetches the data, renders the ready state and bakes it into the transfer state', async () => {
    platformId = SERVER_PLATFORM_ID;
    loadMeta.mockResolvedValue(EXISTING_SITE_META);
    fixture = await createPage();

    const transferState = TestBed.inject(TransferState);

    expect(fixture.componentInstance.status()).toBe(RacesStatus.ready);
    expect(fixture.componentInstance.latestRaces()).toEqual(EXPECTED_RACE_ITEMS);
    expect(transferState.get(RACES_KEY, null)).toEqual({ data: EXPECTED_RACE_ITEMS });
    expect(transferState.get(META_KEY, null), 'the announcement is baked alongside the preview').toEqual({ data: EXISTING_SITE_META });
    expect(transferState.get(STATS_KEY, null), 'only the computed totals are baked, never the history').toEqual({ data: EXPECTED_STATS });
  });

  it('keeps the calm loading state when the prerender fetches fail', async () => {
    platformId = SERVER_PLATFORM_ID;
    loadLatest.mockRejectedValue(new Error(INDEX_LOAD_ERROR_MESSAGE));
    loadMeta.mockRejectedValue(new Error(SITE_META_CDN_ERROR_MESSAGE));
    fixture = await createPage();

    expect(fixture.componentInstance.status(), 'the browser retry decides the real status').toBe(RacesStatus.loading);
    expect(TestBed.inject(TransferState).get(RACES_KEY, null)).toBeNull();
  });

  it('applies the baked races before hydration, then refreshes them from the network', async () => {
    TestBed.inject(TransferState).set(RACES_KEY, { data: BAKED_RACE_ITEMS });
    fixture = TestBed.createComponent(HomePage);

    const page = fixture.componentInstance;

    expect(page.status(), 'the baked cards render synchronously, so hydration matches the prerendered HTML').toBe(RacesStatus.ready);
    expect(page.latestRaces()).toEqual(BAKED_RACE_ITEMS);

    await settle();

    expect(page.latestRaces(), 'the network answer replaces the baked payload').toEqual(EXPECTED_RACE_ITEMS);

    loadLatest.mockRejectedValue(new Error(INDEX_LOAD_ERROR_MESSAGE));
    fixture.destroy();
    fixture = await createPage();

    expect(fixture.componentInstance.status(), 'a refresh failure stays silent while baked content is on screen').toBe(RacesStatus.ready);
    expect(fixture.componentInstance.latestRaces()).toEqual(BAKED_RACE_ITEMS);
  });
});
