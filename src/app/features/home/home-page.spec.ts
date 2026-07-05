import { PLATFORM_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EMPTY_INDEX, EXISTING_INDEX } from '../../core/github/archive-index.mock';
import { EMPTY_SITE_META } from '../../core/github/site-meta.constant';
import { ANNOUNCEMENT_ONLY_SITE_META, EXISTING_SITE_META } from '../../core/github/site-meta.mock';
import { AdminTokenService } from '../../github/admin-token.service';
import { ArchiveService } from '../../github/archive.service';
import { SiteMetaService } from '../../github/site-meta.service';
import { SITE_META_CDN_ERROR_MESSAGE } from '../../github/site-meta.service.mock';
import { RacesStatus } from '../races/races-page.enum';
import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../spec-utils/platform.mock';
import { settle } from '../spec-utils/settle';
import { HomePage } from './home-page';
import { RACES_PAGE_LINK, UPLOAD_PAGE_LINK } from './home-page.constant';
import { EXPECTED_ANNOUNCE_TIME_TEXT, EXPECTED_RACE_ITEMS, EXPECTED_RACE_TITLES, INDEX_LOAD_ERROR_MESSAGE } from './home-page.mock';

describe('HomePage', () => {
  const isAdmin = signal(false);
  const loadIndex = vi.fn();
  const loadMeta = vi.fn();

  let platformId = BROWSER_PLATFORM_ID;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(() => {
    vi.clearAllMocks();
    isAdmin.set(false);
    platformId = BROWSER_PLATFORM_ID;
    loadIndex.mockResolvedValue(EXISTING_INDEX);
    loadMeta.mockResolvedValue(EMPTY_SITE_META);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ArchiveService, useValue: { loadIndex } },
        { provide: AdminTokenService, useValue: { isAdmin } },
        { provide: SiteMetaService, useValue: { load: loadMeta } },
        { provide: PLATFORM_ID, useFactory: () => platformId },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  async function createPage(): Promise<ComponentFixture<HomePage>> {
    const created = TestBed.createComponent(HomePage);

    await settle();

    return created;
  }

  it('renders the latest races as cards with the all-races links and hides the admin block for visitors', async () => {
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
    expect(element.querySelector('.home__admin')).toBeNull();
    expect(element.querySelector('.home__course'), 'the course card stays on the landing').not.toBeNull();
    expect(element.querySelector('.home__announce'), 'no announcement block until the organiser publishes one').toBeNull();
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

  it('shows the admin upload entry when a token is stored', async () => {
    isAdmin.set(true);
    fixture = await createPage();

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.home__upload').getAttribute('href')).toBe(UPLOAD_PAGE_LINK);
  });

  it('shows the empty and error states of the race preview', async () => {
    loadIndex.mockResolvedValue(EMPTY_INDEX);
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(RacesStatus.empty);

    fixture.detectChanges();

    const statusRegion = fixture.nativeElement.querySelector('.home__status');

    expect(statusRegion.getAttribute('aria-live')).toBe('polite');
    expect(statusRegion.textContent.trim(), 'the empty-state text is rendered inside the persistent live region').not.toBe('');

    loadIndex.mockRejectedValue(new Error(INDEX_LOAD_ERROR_MESSAGE));
    fixture.destroy();
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(RacesStatus.error);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.home__error').getAttribute('role')).toBe('alert');
  });

  it('does not fetch during prerender and keeps the loading state for hydration', async () => {
    platformId = SERVER_PLATFORM_ID;
    fixture = await createPage();

    expect(loadIndex).not.toHaveBeenCalled();
    expect(loadMeta, 'the meta read also waits for hydration').not.toHaveBeenCalled();
    expect(fixture.componentInstance.status()).toBe(RacesStatus.loading);
  });
});
