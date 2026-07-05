import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtocolStateService } from '../../../state/protocol-state.service';
import { RACE_EVENT_DEFAULTS } from '../race-event-defaults.constant';
import { EventForm } from './event-form';
import { EMPTY_DATE_ISO } from './event-form.constant';
import {
  BELOW_MIN_EVENT_NUMBER,
  NON_INTEGER_EVENT_NUMBER,
  SUGGESTED_DATE_ISO,
  VALID_EVENT_NUMBER,
  VALID_RACE_EVENT,
} from './event-form.mock';

describe('EventForm', () => {
  const setEvent = vi.fn();
  const suggestedDateIso = signal<string | null>(SUGGESTED_DATE_ISO);

  let fixture: ComponentFixture<EventForm>;

  beforeEach(() => {
    vi.clearAllMocks();
    suggestedDateIso.set(SUGGESTED_DATE_ISO);
    TestBed.configureTestingModule({
      providers: [{ provide: ProtocolStateService, useValue: { setEvent, suggestedDateIso } }],
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
    form.controls.number.setValue(NON_INTEGER_EVENT_NUMBER);
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
});
