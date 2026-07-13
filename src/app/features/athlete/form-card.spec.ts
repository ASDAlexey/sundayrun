import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FADING_FORM_RUNS, SHORT_FORM_RUNS } from '../../core/history/form.mock';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { FormCard } from './form-card';
import {
  EXPECTED_FADING_FORM_VIEW,
  EXPECTED_SINGLE_WINDOW_VIEW,
  EXPECTED_STALE_FORM_VIEW,
  FADING_ANCHOR_ISO,
  FADING_STALE_ANCHOR_ISO,
  SINGLE_WINDOW_ANCHOR_ISO,
  SINGLE_WINDOW_RUNS,
} from './form-card.mock';

describe('FormCard', () => {
  let fixture: ComponentFixture<FormCard>;

  afterEach(() => {
    fixture.destroy();
  });

  function createCard(runs: readonly AthleteRun[], anchorIso: string): FormCard {
    fixture = TestBed.createComponent(FormCard);
    fixture.componentRef.setInput('runs', [...runs]);
    fixture.componentRef.setInput('anchorIso', anchorIso);

    return fixture.componentInstance;
  }

  it('maps the fading curve into chart geometry and quotes the percent with the peak month', () => {
    const card = createCard(FADING_FORM_RUNS, FADING_ANCHOR_ISO);

    expect(card.view()).toEqual(EXPECTED_FADING_FORM_VIEW);

    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelector('.form-card__now').textContent).toContain('80% от пика');
    expect(element.querySelector('.form-card__peak').textContent).toContain('мае 2025');
    expect(element.querySelector('.form-card__line').getAttribute('points')).toBe(EXPECTED_FADING_FORM_VIEW.linePoints);
    expect(element.querySelectorAll('.form-card__dot').length, 'every window is a hoverable dot').toBe(4);
    expect(element.querySelector('.form-card__dot').getAttribute('aria-label'), 'the dot labels its window for a screen reader').toContain(
      'от пика',
    );
    expect(element.querySelector('.form-card__tooltip'), 'the tooltip stays hidden until a dot is hovered').toBeNull();

    const view = card.view();

    if (view === null) {
      throw new Error('the form view is present once there are enough finishes');
    }

    card.hoveredPoint.set(view.points[3]);
    fixture.detectChanges();

    const tooltip = element.querySelector('.form-card__tooltip');

    expect(tooltip.querySelector('.form-card__tooltip-title').textContent).toContain('3 августа 2025 г.');
    expect(tooltip.textContent, 'the styled box shows the window median and its percent of the peak').toContain('30:00');
    expect(tooltip.textContent).toContain('80% от пика');
  });

  it('centres the lone all-peak window and cheers instead of quoting the percent', () => {
    const card = createCard(SINGLE_WINDOW_RUNS, SINGLE_WINDOW_ANCHOR_ISO);

    expect(card.view()).toEqual(EXPECTED_SINGLE_WINDOW_VIEW);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.form-card__now_peak')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.form-card__peak'), 'no separate peak line while at the peak').toBeNull();
  });

  it('drops «сейчас» for the stale note and last-finish legend after a season-long break', () => {
    const card = createCard(FADING_FORM_RUNS, FADING_STALE_ANCHOR_ISO);

    expect(card.view()).toEqual(EXPECTED_STALE_FORM_VIEW);

    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelector('.form-card__now_stale'), 'the stale note replaces «сейчас»').not.toBeNull();
    expect(element.querySelector('.form-card__now_peak'), 'a stale athlete never cheers').toBeNull();
    expect(element.querySelector('.form-card__peak').textContent).toContain('мае 2025');
    expect(element.querySelector('.form-card__legend-item_current').textContent).toContain('последний финиш');
  });

  it('hides the card entirely without a full window of finishes', () => {
    const card = createCard(SHORT_FORM_RUNS, FADING_ANCHOR_ISO);

    expect(card.view()).toBeNull();

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.form-card')).toBeNull();
  });
});
