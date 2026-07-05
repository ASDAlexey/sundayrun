import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TokenCheck } from '../../core/github/token-check.enum';
import { AdminTokenService } from '../../github/admin-token.service';
import { ADMIN_TOKEN_MOCK } from '../../github/admin-token.service.mock';
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

  let fixture: ComponentFixture<AdminPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    isAdmin.set(false);
    validate.mockResolvedValue(TokenCheck.valid);
    TestBed.configureTestingModule({
      providers: [
        { provide: AdminTokenService, useValue: { isAdmin, validate, save, clear } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    fixture = TestBed.createComponent(AdminPage);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('validates the trimmed token, saves it and returns to the race list', async () => {
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
  });

  it('shows empty, unauthorized and generic error messages without saving the token', async () => {
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

  it('shows the saved state with a clear button in admin mode', () => {
    isAdmin.set(true);
    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelector('.admin__saved')).not.toBeNull();
    expect(element.querySelector('.admin__input')).toBeNull();

    element.querySelector('.admin__clear').click();

    expect(clear).toHaveBeenCalled();
    expect(fixture.componentInstance.status()).toBe(TokenSaveStatus.idle);
  });
});
