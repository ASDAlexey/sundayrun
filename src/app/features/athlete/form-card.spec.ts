import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FADING_FORM_RUNS, SHORT_FORM_RUNS } from '../../core/history/form.mock';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { FormCard } from './form-card';
import { EXPECTED_FADING_FORM_VIEW, EXPECTED_SINGLE_WINDOW_VIEW, SINGLE_WINDOW_RUNS } from './form-card.mock';

describe('FormCard', () => {
  let fixture: ComponentFixture<FormCard>;

  afterEach(() => {
    fixture.destroy();
  });

  function createCard(runs: readonly AthleteRun[]): FormCard {
    fixture = TestBed.createComponent(FormCard);
    fixture.componentRef.setInput('runs', [...runs]);

    return fixture.componentInstance;
  }

  it('maps the fading curve into chart geometry and quotes the percent with the peak month', () => {
    const card = createCard(FADING_FORM_RUNS);

    expect(card.view()).toEqual(EXPECTED_FADING_FORM_VIEW);

    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelector('.form-card__now').textContent).toContain('80% от пика');
    expect(element.querySelector('.form-card__peak').textContent).toContain('мае 2025');
    expect(element.querySelector('.form-card__line').getAttribute('points')).toBe(EXPECTED_FADING_FORM_VIEW.linePoints);
  });

  it('centres the lone all-peak window and cheers instead of quoting the percent', () => {
    const card = createCard(SINGLE_WINDOW_RUNS);

    expect(card.view()).toEqual(EXPECTED_SINGLE_WINDOW_VIEW);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.form-card__now_peak')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.form-card__peak'), 'no separate peak line while at the peak').toBeNull();
  });

  it('hides the card entirely without a full window of finishes', () => {
    const card = createCard(SHORT_FORM_RUNS);

    expect(card.view()).toBeNull();

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.form-card')).toBeNull();
  });
});
