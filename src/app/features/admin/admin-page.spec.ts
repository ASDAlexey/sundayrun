import { PLATFORM_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { EMPTY_SITE_META } from '../../core/github/site-meta.constant';
import { BUILT_SITE_META, EXISTING_SITE_META, RAW_ANNOUNCEMENT_INPUT } from '../../core/github/site-meta.mock';
import { TokenCheck } from '../../core/github/token-check.enum';
import { AdminTokenService } from '../../github/admin-token.service';
import { ADMIN_TOKEN_MOCK } from '../../github/admin-token.service.mock';
import { PublishState, PublishStateType } from '../../github/github-storage.enum';
import { SiteMetaService } from '../../github/site-meta.service';
import { SITE_META_CDN_ERROR_MESSAGE } from '../../github/site-meta.service.mock';
import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../spec-utils/platform.mock';
import { settle } from '../spec-utils/settle';
import { AdminPage } from './admin-page';
import { TokenSaveStatus } from './admin-page.enum';
import { PADDED_TOKEN_INPUT, WHITESPACE_TOKEN_INPUT } from './admin-page.mock';
import { HOME_ROUTE_COMMANDS } from './admin.guard.constant';

describe('AdminPage', () => {
  const isAdmin = signal(false);
  const validate = vi.fn();
  const save = vi.fn();
  const clear = vi.fn();
  const navigate = vi.fn(() => Promise.resolve(true));
  const metaState = signal<PublishStateType>(PublishState.idle);
  const loadMeta = vi.fn();
  const saveMeta = vi.fn();

  let platformId = BROWSER_PLATFORM_ID;
  let fixture: ComponentFixture<AdminPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    isAdmin.set(false);
    platformId = BROWSER_PLATFORM_ID;
    metaState.set(PublishState.idle);
    validate.mockResolvedValue(TokenCheck.valid);
    loadMeta.mockResolvedValue(EXISTING_SITE_META);
    saveMeta.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: AdminTokenService, useValue: { isAdmin, validate, save, clear } },
        { provide: SiteMetaService, useValue: { state: metaState, load: loadMeta, save: saveMeta } },
        { provide: Router, useValue: { navigate } },
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

  it('validates the trimmed token, saves it and returns to the race list', async () => {
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
    expect(navigate).toHaveBeenCalledWith(HOME_ROUTE_COMMANDS);
    expect(fixture.componentInstance.status()).toBe(TokenSaveStatus.valid);
    expect(loadMeta, 'the announcement editor is admin-only, so a visitor triggers no meta read').not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.admin__subtitle')).toBeNull();
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
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the saved state with a clear button in admin mode', async () => {
    isAdmin.set(true);
    fixture = await createPage();

    const element = fixture.nativeElement;

    expect(element.querySelector('.admin__saved')).not.toBeNull();
    expect(element.querySelector('.admin__input:not(.admin__input_time)')).toBeNull();

    element.querySelector('.admin__clear').click();

    expect(clear).toHaveBeenCalled();
    expect(fixture.componentInstance.status()).toBe(TokenSaveStatus.idle);
  });

  it('prefills the announcement editor from the published meta and publishes the trimmed form input', async () => {
    isAdmin.set(true);
    fixture = await createPage();

    const element = fixture.nativeElement;
    const timeInput = element.querySelector('.admin__input_time');
    const textarea = element.querySelector('.admin__textarea');

    expect(loadMeta).toHaveBeenCalled();
    expect(timeInput.value).toBe(EXISTING_SITE_META.startTime);
    expect(textarea.value).toBe(EXISTING_SITE_META.announcement);

    // A time input rejects padded values at the DOM level, so only the textarea exercises trimming.
    timeInput.value = BUILT_SITE_META.startTime;
    textarea.value = RAW_ANNOUNCEMENT_INPUT;
    saveMeta.mockImplementation(() => {
      metaState.set(PublishState.success);

      return Promise.resolve();
    });
    element.querySelectorAll('.admin__save')[0].click();
    await settle();

    expect(saveMeta).toHaveBeenCalledWith(BUILT_SITE_META);
    expect(fixture.componentInstance.meta(), 'the prefill follows the published value').toEqual(BUILT_SITE_META);

    fixture.detectChanges();

    expect(element.querySelector('.admin__saved + .admin__clear'), 'the token card is still there').not.toBeNull();
  });

  it('keeps the editor usable on a CDN failure and disables publishing until the prefill settles', async () => {
    isAdmin.set(true);
    loadMeta.mockRejectedValueOnce(new Error(SITE_META_CDN_ERROR_MESSAGE));
    fixture = await createPage();

    expect(fixture.componentInstance.meta(), 'a CDN hiccup falls back to the empty meta').toEqual(EMPTY_SITE_META);

    metaState.set(PublishState.publishing);
    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelectorAll('.admin__save')[0].disabled, 'no double publish while one is in flight').toBe(true);
    expect(element.querySelector('.admin__status')).not.toBeNull();

    metaState.set(PublishState.error);
    fixture.detectChanges();

    expect(element.querySelector('.admin__error').getAttribute('role')).toBe('alert');

    element.querySelectorAll('.admin__save')[0].click();
    await settle();

    expect(saveMeta).toHaveBeenCalled();
    expect(fixture.componentInstance.meta(), 'a failed publish never becomes the prefill').toEqual(EMPTY_SITE_META);
  });

  it('does not read the meta during prerender', async () => {
    platformId = SERVER_PLATFORM_ID;
    isAdmin.set(true);
    fixture = await createPage();

    expect(loadMeta).not.toHaveBeenCalled();
    expect(fixture.componentInstance.meta()).toBeNull();
  });
});
