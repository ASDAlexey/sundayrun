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
import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../spec-utils/platform.mock';
import { settle } from '../spec-utils/settle';
import { RacesPage } from './races-page';
import { UPLOAD_PAGE_LINK } from './races-page.constant';
import { RacesStatus } from './races-page.enum';
import { EXPECTED_ANNOUNCE_TIME_TEXT, EXPECTED_RACE_ITEMS, EXPECTED_RACE_TITLES, INDEX_LOAD_ERROR_MESSAGE } from './races-page.mock';

describe('RacesPage', () => {
  const isAdmin = signal(false);
  const loadIndex = vi.fn();
  const loadMeta = vi.fn();

  let platformId = BROWSER_PLATFORM_ID;
  let fixture: ComponentFixture<RacesPage>;

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

  async function createPage(): Promise<ComponentFixture<RacesPage>> {
    const created = TestBed.createComponent(RacesPage);

    await settle();

    return created;
  }

  it('renders the served race order as cards with CDN pdf links and hides the admin block for visitors', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(RacesStatus.ready);
    expect(page.races()).toEqual(EXPECTED_RACE_ITEMS);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const titles = [...element.querySelectorAll('.races__race-title')].map((node) => node.textContent.trim());
    const pdfLinks = [...element.querySelectorAll('.races__race-pdf')];
    const protocolLinks = [...element.querySelectorAll('.races__race-protocol')];

    expect(titles).toEqual(EXPECTED_RACE_TITLES);
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
    expect(element.querySelector('.races__admin')).toBeNull();
    expect(element.querySelector('.races__cdn-note')).not.toBeNull();
    expect(element.querySelector('.races__organizer'), 'the organizer entry moved to the shell footer').toBeNull();
    expect(element.querySelector('.races__announce'), 'no announcement block until the organiser publishes one').toBeNull();
  });

  it('shows the published start time and announcement above the list, and stays silent on a meta failure', async () => {
    loadMeta.mockResolvedValue(EXISTING_SITE_META);
    fixture = await createPage();

    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelector('.races__announce-time').textContent.trim()).toBe(EXPECTED_ANNOUNCE_TIME_TEXT);
    expect(element.querySelector('.races__announce-text').textContent.trim()).toBe(EXISTING_SITE_META.announcement);

    loadMeta.mockResolvedValue(ANNOUNCEMENT_ONLY_SITE_META);
    fixture.destroy();
    fixture = await createPage();

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.races__announce-time'), 'no time line without a start time').toBeNull();
    expect(fixture.nativeElement.querySelector('.races__announce-text').textContent.trim()).toBe(ANNOUNCEMENT_ONLY_SITE_META.announcement);

    loadMeta.mockRejectedValue(new Error(SITE_META_CDN_ERROR_MESSAGE));
    fixture.destroy();
    fixture = await createPage();

    expect(fixture.componentInstance.status(), 'the race list is unaffected by the meta failure').toBe(RacesStatus.ready);
    expect(fixture.componentInstance.hasAnnouncement()).toBe(false);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.races__announce')).toBeNull();
  });

  it('shows the admin upload entry when a token is stored', async () => {
    isAdmin.set(true);
    fixture = await createPage();

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.races__upload').getAttribute('href')).toBe(UPLOAD_PAGE_LINK);
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

  it('does not fetch during prerender and keeps the loading state for hydration', async () => {
    platformId = SERVER_PLATFORM_ID;
    fixture = await createPage();

    expect(loadIndex).not.toHaveBeenCalled();
    expect(loadMeta, 'the meta read also waits for hydration').not.toHaveBeenCalled();
    expect(fixture.componentInstance.status()).toBe(RacesStatus.loading);
  });
});
