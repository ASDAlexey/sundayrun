import { PLATFORM_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FIRST_ARCHIVE_EVENT_NUMBER } from '../../core/github/archive-index.constant';
import { EMPTY_INDEX, EXISTING_INDEX, NEWER_ENTRY } from '../../core/github/archive-index.mock';
import { EMPTY_SITE_META } from '../../core/github/site-meta.constant';
import { BUILT_SITE_META, EXISTING_SITE_META, RAW_START_TIME_INPUT } from '../../core/github/site-meta.mock';
import { TokenCheck } from '../../core/github/token-check.enum';
import { AdminTokenService } from '../../github/admin-token.service';
import { ADMIN_TOKEN_MOCK } from '../../github/admin-token.service.mock';
import { ArchiveService } from '../../github/archive.service';
import { EventDeleteService } from '../../github/event-delete.service';
import { PublishState, PublishStateType } from '../../github/github-storage.enum';
import { SiteMetaService } from '../../github/site-meta.service';
import { SITE_META_CDN_ERROR_MESSAGE } from '../../github/site-meta.service.mock';
import { ProtocolStateService } from '../../state/protocol-state.service';
import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../spec-utils/platform.mock';
import { settle } from '../spec-utils/settle';
import { AdminPage } from './admin-page';
import { RaceListStatus, TokenSaveStatus } from './admin-page.enum';
import {
  ADMIN_RACES_LOAD_ERROR_MESSAGE,
  EXPECTED_ADMIN_RACES,
  EXPECTED_NEXT_NUMBER,
  MONTH_QUERY,
  NO_MATCH_QUERY,
  NUMBER_QUERY,
  PADDED_TOKEN_INPUT,
  WHITESPACE_TOKEN_INPUT,
  YEAR_QUERY,
} from './admin-page.mock';

describe('AdminPage', () => {
  const isAdmin = signal(false);
  const validate = vi.fn();
  const save = vi.fn();
  const clear = vi.fn();
  const metaState = signal<PublishStateType>(PublishState.idle);
  const loadMeta = vi.fn();
  const saveMeta = vi.fn();
  const loadIndex = vi.fn();
  const deleteState = signal<PublishStateType>(PublishState.idle);
  const deleteRace = vi.fn();

  let platformId = BROWSER_PLATFORM_ID;
  let fixture: ComponentFixture<AdminPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    isAdmin.set(false);
    platformId = BROWSER_PLATFORM_ID;
    metaState.set(PublishState.idle);
    deleteState.set(PublishState.idle);
    validate.mockResolvedValue(TokenCheck.valid);
    loadMeta.mockResolvedValue(EXISTING_SITE_META);
    saveMeta.mockResolvedValue(undefined);
    loadIndex.mockResolvedValue(EXISTING_INDEX);
    deleteRace.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AdminTokenService, useValue: { isAdmin, validate, save, clear } },
        { provide: SiteMetaService, useValue: { state: metaState, load: loadMeta, save: saveMeta } },
        { provide: ArchiveService, useValue: { loadIndex } },
        { provide: EventDeleteService, useValue: { state: deleteState, delete: deleteRace } },
        { provide: ProtocolStateService, useValue: { reset: vi.fn(), importFile: vi.fn() } },
        { provide: PLATFORM_ID, useFactory: () => platformId },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  async function createPage(): Promise<ComponentFixture<AdminPage>> {
    const created = TestBed.createComponent(AdminPage);

    await settle();
    created.detectChanges();

    return created;
  }

  it('validates the trimmed token, saves it and preloads the announcement editor', async () => {
    fixture = await createPage();

    const element = fixture.nativeElement;

    element.querySelector('.admin__input').value = PADDED_TOKEN_INPUT;
    element.querySelector('.admin__save').click();

    expect(fixture.componentInstance.status()).toBe(TokenSaveStatus.checking);

    fixture.detectChanges();

    expect(element.querySelector('.admin__save').disabled).toBe(true);
    expect(element.querySelector('.admin__status')).not.toBeNull();
    expect(element.querySelector('.admin__feedback').getAttribute('aria-live')).toBe('polite');

    await settle();

    expect(validate).toHaveBeenCalledWith(ADMIN_TOKEN_MOCK);
    expect(save).toHaveBeenCalledWith(ADMIN_TOKEN_MOCK);
    expect(fixture.componentInstance.status()).toBe(TokenSaveStatus.valid);
    expect(loadMeta, 'the panel opens right away, so the editor prefill loads after saving').toHaveBeenCalled();
  });

  it('shows empty, unauthorized and generic error messages without saving the token', async () => {
    fixture = await createPage();

    const element = fixture.nativeElement;

    element.querySelector('.admin__input').value = WHITESPACE_TOKEN_INPUT;
    element.querySelector('.admin__save').click();

    expect(fixture.componentInstance.status()).toBe(TokenSaveStatus.empty);
    expect(validate, 'a blank token never reaches the network').not.toHaveBeenCalled();

    fixture.detectChanges();

    expect(element.querySelector('.admin__error').getAttribute('role')).toBe('alert');

    validate.mockResolvedValueOnce(TokenCheck.unauthorized);
    element.querySelector('.admin__input').value = ADMIN_TOKEN_MOCK;
    element.querySelector('.admin__save').click();
    await settle();

    expect(fixture.componentInstance.status()).toBe(TokenSaveStatus.unauthorized);

    fixture.detectChanges();

    expect(element.querySelector('.admin__error')).not.toBeNull();

    validate.mockResolvedValueOnce(TokenCheck.error);
    element.querySelector('.admin__save').click();
    await settle();

    expect(fixture.componentInstance.status()).toBe(TokenSaveStatus.error);
    expect(save).not.toHaveBeenCalled();
    expect(loadMeta).not.toHaveBeenCalled();
  });

  it('renders the organiser panel with the dropzone, next number, races total and a clear button', async () => {
    isAdmin.set(true);
    fixture = await createPage();

    const element = fixture.nativeElement;

    expect(element.querySelector('.admin__saved')).not.toBeNull();
    expect(element.querySelector('app-protocol-dropzone .dropzone__zone')).not.toBeNull();
    expect(element.querySelector('.admin__input:not(.admin__input_time)'), 'no token input in admin mode').toBeNull();
    expect(fixture.componentInstance.nextNumber()).toBe(EXPECTED_NEXT_NUMBER);
    expect(element.querySelector('.admin__upload-number').textContent).toContain(String(EXPECTED_NEXT_NUMBER));
    expect(element.querySelector('.admin__races-total').textContent).toContain(String(EXPECTED_ADMIN_RACES.length));
    expect(element.querySelector('.admin__viewport'), 'the races list virtualizes its rows').not.toBeNull();
    expect(element.querySelector('.admin__races-note')).not.toBeNull();

    element.querySelector('.admin__clear').click();

    expect(clear).toHaveBeenCalled();
    expect(fixture.componentInstance.status()).toBe(TokenSaveStatus.idle);
  });

  it('prefills the editor start-time draft and publishes the trimmed form input', async () => {
    isAdmin.set(true);
    fixture = await createPage();

    const page = fixture.componentInstance;
    const element = fixture.nativeElement;

    expect(loadMeta).toHaveBeenCalled();
    expect(element.querySelector('.admin__input_time').value).toBe(EXISTING_SITE_META.startTime);

    page.onStartTimeInput(RAW_START_TIME_INPUT);

    saveMeta.mockImplementation(() => {
      metaState.set(PublishState.success);

      return Promise.resolve();
    });
    element.querySelector('.admin__publish').click();
    await settle();

    expect(saveMeta).toHaveBeenCalledWith(BUILT_SITE_META);
    expect(page.meta(), 'the prefill follows the published value').toEqual(BUILT_SITE_META);
    expect(page.draftStartTime(), 'the drafts re-sync to the published file').toBe(BUILT_SITE_META.startTime);

    fixture.detectChanges();

    expect(element.querySelector('.admin__feedback_meta .admin__saved')).not.toBeNull();
  });

  it('keeps the editor usable on a CDN failure and disables publishing until the prefill settles', async () => {
    isAdmin.set(true);
    loadMeta.mockRejectedValueOnce(new Error(SITE_META_CDN_ERROR_MESSAGE));
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.meta(), 'a CDN hiccup falls back to the empty meta').toEqual(EMPTY_SITE_META);
    expect(page.draftStartTime(), 'no start time yet — the draft stays empty').toBe('');

    metaState.set(PublishState.publishing);
    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelector('.admin__publish').disabled, 'no double publish while one is in flight').toBe(true);
    expect(element.querySelector('.admin__status')).not.toBeNull();

    metaState.set(PublishState.error);
    fixture.detectChanges();

    expect(element.querySelector('.admin__error').getAttribute('role')).toBe('alert');

    element.querySelector('.admin__publish').click();
    await settle();

    expect(saveMeta).toHaveBeenCalled();
    expect(page.meta(), 'a failed publish never becomes the prefill').toEqual(EMPTY_SITE_META);
  });

  it('loads the race list with links and search fields and deletes a race only after an explicit confirmation', async () => {
    isAdmin.set(true);
    deleteRace.mockImplementation(() => {
      deleteState.set(PublishState.success);

      return Promise.resolve();
    });
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.races()).toEqual(EXPECTED_ADMIN_RACES);
    expect(page.filteredRaces(), 'a blank query keeps the full list').toEqual(EXPECTED_ADMIN_RACES);

    page.askDelete(NEWER_ENTRY.slug);

    expect(page.pendingSlug()).toBe(NEWER_ENTRY.slug);

    page.cancelDelete();

    expect(page.pendingSlug(), 'cancel backs out without deleting').toBeNull();
    expect(deleteRace).not.toHaveBeenCalled();

    await page.confirmDelete();

    expect(deleteRace, 'no pending race — nothing to confirm').not.toHaveBeenCalled();

    page.askDelete(NEWER_ENTRY.slug);
    await page.confirmDelete();

    expect(deleteRace).toHaveBeenCalledWith(NEWER_ENTRY.slug);
    expect(page.pendingSlug()).toBeNull();
    expect(page.races(), 'the deleted race leaves the list').toEqual(EXPECTED_ADMIN_RACES.slice(1));

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.admin__feedback_delete .admin__saved')).not.toBeNull();
  });

  it('filters the list by number, month and year and reports when nothing matches', async () => {
    isAdmin.set(true);
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.onQueryChange(NUMBER_QUERY);

    expect(page.filteredRaces()).toEqual([EXPECTED_ADMIN_RACES[0]]);

    page.onQueryChange(MONTH_QUERY);

    expect(page.filteredRaces(), 'the long russian date is searchable').toEqual([EXPECTED_ADMIN_RACES[1]]);

    page.onQueryChange(YEAR_QUERY);

    expect(page.filteredRaces(), 'the ISO date is searchable and the query is trimmed').toEqual(EXPECTED_ADMIN_RACES);

    page.onQueryChange(NO_MATCH_QUERY);

    expect(page.filteredRaces()).toEqual([]);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.admin__viewport'), 'no rows to virtualize').toBeNull();
  });

  it('keeps the race in the list when the deletion fails', async () => {
    isAdmin.set(true);
    deleteRace.mockImplementation(() => {
      deleteState.set(PublishState.error);

      return Promise.resolve();
    });
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.askDelete(NEWER_ENTRY.slug);
    await page.confirmDelete();

    expect(page.races(), 'a failed deletion removes nothing').toEqual(EXPECTED_ADMIN_RACES);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.admin__feedback_delete .admin__error').getAttribute('role')).toBe('alert');
  });

  it('shows the empty race list state with the first number and the load error', async () => {
    isAdmin.set(true);
    loadIndex.mockResolvedValueOnce(EMPTY_INDEX);
    fixture = await createPage();

    expect(fixture.componentInstance.racesStatus()).toBe(RaceListStatus.empty);
    expect(fixture.componentInstance.nextNumber(), 'an empty archive suggests the first number').toBe(FIRST_ARCHIVE_EVENT_NUMBER);

    fixture.destroy();
    loadIndex.mockRejectedValueOnce(new Error(ADMIN_RACES_LOAD_ERROR_MESSAGE));
    fixture = await createPage();

    expect(fixture.componentInstance.racesStatus()).toBe(RaceListStatus.error);

    expect(fixture.nativeElement.querySelector('.admin__error').getAttribute('role')).toBe('alert');
  });

  it('does not read the meta or the race list during prerender', async () => {
    platformId = SERVER_PLATFORM_ID;
    isAdmin.set(true);
    fixture = await createPage();

    expect(loadMeta).not.toHaveBeenCalled();
    expect(loadIndex).not.toHaveBeenCalled();
    expect(fixture.componentInstance.meta()).toBeNull();
  });
});
