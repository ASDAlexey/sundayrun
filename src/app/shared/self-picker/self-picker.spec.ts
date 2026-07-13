import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { AthletesService } from '../../github/athletes.service';
import { SelfAthlete } from '../../state/self-athlete.interface';
import { SelfAthleteService } from '../../state/self-athlete.service';
import { settle } from '../../features/spec-utils/settle';
import { SelfPicker } from './self-picker';
import { SelfPickerStatus } from './self-picker.enum';
import {
  EXPECTED_PICKER_SAVE,
  PICKED_SELF,
  PICKER_DIRECTORY,
  PICKER_LOAD_ERROR_MESSAGE,
  PICKER_MATCH,
  PICKER_QUERY,
} from './self-picker.mock';

describe('SelfPicker', () => {
  const loadRecords = vi.fn();
  const save = vi.fn();
  const clear = vi.fn();

  let selfSignal: WritableSignal<SelfAthlete | null>;
  let fixture: ComponentFixture<SelfPicker>;

  beforeEach(() => {
    vi.clearAllMocks();
    loadRecords.mockResolvedValue(PICKER_DIRECTORY);
    selfSignal = signal<SelfAthlete | null>(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AthletesService, useValue: { loadRecords } },
        { provide: SelfAthleteService, useValue: { self: selfSignal, save, clear } },
      ],
    });
    fixture = TestBed.createComponent(SelfPicker);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('loads the directory lazily on the first open, suggests by name and saves the pick', async () => {
    const picker = fixture.componentInstance;

    expect(loadRecords, 'no directory fetch until the visitor opens the dropdown').not.toHaveBeenCalled();

    picker.toggle();
    await settle();

    expect(picker.open()).toBe(true);
    expect(picker.status()).toBe(SelfPickerStatus.ready);
    expect(picker.suggestions(), 'an empty query suggests nothing').toEqual([]);

    picker.onQueryChange(PICKER_QUERY);

    expect(picker.suggestions()).toEqual([PICKER_MATCH]);

    picker.pick(PICKER_MATCH);

    expect(save).toHaveBeenCalledExactlyOnceWith(EXPECTED_PICKER_SAVE);
    expect(picker.open(), 'picking closes the dropdown').toBe(false);
    expect(picker.query()).toBe('');

    picker.toggle();
    await settle();

    expect(loadRecords, 'the directory is fetched once and reused').toHaveBeenCalledOnce();

    picker.close();

    expect(picker.open()).toBe(false);
  });

  it('renders the toggle without a pick and the profile link with a reset once picked', async () => {
    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelector('.self-picker__toggle')).not.toBeNull();
    expect(element.querySelector('.self-picker__me')).toBeNull();

    selfSignal.set(PICKED_SELF);
    fixture.detectChanges();

    const link = element.querySelector('.self-picker__me-link');

    expect(element.querySelector('.self-picker__toggle'), 'a picked self replaces the toggle').toBeNull();
    expect(link.textContent.trim()).toBe(PICKED_SELF.displayName);
    expect(link.getAttribute('href')).toBe(`${ATHLETES_PAGE_LINK}/${encodeURIComponent(PICKED_SELF.key)}`);

    element.querySelector('.self-picker__clear').click();

    expect(clear).toHaveBeenCalledOnce();
  });

  it('reports a failed directory load and retries on the next open', async () => {
    loadRecords.mockRejectedValueOnce(new Error(PICKER_LOAD_ERROR_MESSAGE));

    const picker = fixture.componentInstance;

    picker.toggle();
    await settle();

    expect(picker.status()).toBe(SelfPickerStatus.error);

    picker.toggle();
    picker.toggle();
    await settle();

    expect(loadRecords, 'a failed load retries when the dropdown reopens').toHaveBeenCalledTimes(2);
    expect(picker.status()).toBe(SelfPickerStatus.ready);
  });
});
