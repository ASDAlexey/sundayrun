import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtocolStateService } from '../../../state/protocol-state.service';
import { RACE_EVENT_DEFAULTS } from '../race-event-defaults.constant';
import { EventForm } from './event-form';
import { EMPTY_DATE_ISO } from './event-form.constant';
import {
  BELOW_MIN_EVENT_NUMBER,
  EXPECTED_AUTO_NUMBER,
  EXPECTED_AUTO_NUMBER_AFTER_DATE_CHANGE,
  LATER_DATE_ISO,
  PUBLISHED_EVENT_DATES,
  PUBLISHED_EVENT_DATES_WITH_FUTURE,
  SUGGESTED_DATE_ISO,
  VALID_EVENT_NUMBER,
  VALID_RACE_EVENT,
} from './event-form.mock';

describe('EventForm', () => {
  const setEvent = vi.fn();
  const suggestedDateIso = signal<string | null>(SUGGESTED_DATE_ISO);
  const publishedEventDates = signal<string[] | null>(null);

  let fixture: ComponentFixture<EventForm>;

  beforeEach(() => {
    vi.clearAllMocks();
    suggestedDateIso.set(SUGGESTED_DATE_ISO);
    publishedEventDates.set(null);
    TestBed.configureTestingModule({
      providers: [{ provide: ProtocolStateService, useValue: { setEvent, suggestedDateIso, publishedEventDates } }],
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('prefills defaults with the suggested date and pushes only valid values to the store', () => {
    fixture = TestBed.createComponent(EventForm);

    const form = fixture.componentInstance.form;

    expect(form.getRawValue()).toEqual({ number: null, dateIso: SUGGESTED_DATE_ISO, ...RACE_EVENT_DEFAULTS });
    expect(setEvent).not.toHaveBeenCalled();

    form.controls.city.setValue(RACE_EVENT_DEFAULTS.city);
    form.controls.number.setValue(BELOW_MIN_EVENT_NUMBER);

    expect(setEvent).not.toHaveBeenCalled();

    form.controls.number.setValue(VALID_EVENT_NUMBER);

    expect(setEvent).toHaveBeenCalledTimes(1);
    expect(setEvent).toHaveBeenCalledWith(VALID_RACE_EVENT);

    form.controls.dateIso.setValue(EMPTY_DATE_ISO);

    expect(setEvent).toHaveBeenCalledTimes(1);
  });

  it('leaves the date empty when the file name did not contain one', () => {
    suggestedDateIso.set(null);
    fixture = TestBed.createComponent(EventForm);

    expect(fixture.componentInstance.form.controls.dateIso.value).toBe(EMPTY_DATE_ISO);
  });

  it('auto-computes the race number from the published dates, ignoring later events, and recomputes on date change', () => {
    publishedEventDates.set(PUBLISHED_EVENT_DATES);
    fixture = TestBed.createComponent(EventForm);
    fixture.detectChanges();

    const form = fixture.componentInstance.form;

    expect(form.controls.number.value).toBe(EXPECTED_AUTO_NUMBER);

    publishedEventDates.set(PUBLISHED_EVENT_DATES_WITH_FUTURE);
    fixture.detectChanges();

    expect(form.controls.number.value, 'a published date after the form date is not counted').toBe(EXPECTED_AUTO_NUMBER);

    form.controls.dateIso.setValue(LATER_DATE_ISO);
    fixture.detectChanges();

    expect(form.controls.number.value).toBe(EXPECTED_AUTO_NUMBER_AFTER_DATE_CHANGE);
    expect(setEvent).toHaveBeenCalledWith({ ...VALID_RACE_EVENT, number: EXPECTED_AUTO_NUMBER_AFTER_DATE_CHANGE, dateIso: LATER_DATE_ISO });
  });
});
