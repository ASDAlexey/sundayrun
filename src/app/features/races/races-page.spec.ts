import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EMPTY_INDEX, EXISTING_INDEX } from '../../core/github/archive-index.mock';
import { ArchiveService } from '../../github/archive.service';
import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../spec-utils/platform.mock';
import { settle } from '../spec-utils/settle';
import { RacesPage } from './races-page';
import { RacesStatus } from './races-page.enum';
import { EXPECTED_RACE_ITEMS, EXPECTED_RACE_TITLES, INDEX_LOAD_ERROR_MESSAGE } from './races-page.mock';

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
    expect(element.querySelector('.races__cdn-note')).not.toBeNull();
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
    expect(fixture.componentInstance.status()).toBe(RacesStatus.loading);
  });
});
