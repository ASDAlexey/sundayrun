import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LIFETIME_RUNS, SHORT_ONLY_RUNS } from '../../core/history/lifetime-aggregates.mock';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { LifetimeCard } from './lifetime-card';
import { EXPECTED_LIFETIME_VIEW, EXPECTED_SHORT_ONLY_VIEW } from './lifetime-card.mock';

describe('LifetimeCard', () => {
  let fixture: ComponentFixture<LifetimeCard>;

  afterEach(() => {
    fixture.destroy();
  });

  function createCard(runs: readonly AthleteRun[]): LifetimeCard {
    fixture = TestBed.createComponent(LifetimeCard);
    fixture.componentRef.setInput('runs', [...runs]);

    return fixture.componentInstance;
  }

  it('formats the totals, scales the minute bars against the tallest bucket and lists the year paces', () => {
    const card = createCard(LIFETIME_RUNS);

    expect(card.view()).toEqual(EXPECTED_LIFETIME_VIEW);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const counts = [...element.querySelectorAll('.lifetime__bucket-count')];

    expect([...element.querySelectorAll('.lifetime__total-value')].map((value) => value.textContent.trim())).toEqual([
      EXPECTED_LIFETIME_VIEW.totalTimeText,
      EXPECTED_LIFETIME_VIEW.totalKmText,
    ]);
    expect(counts.map((count) => count.textContent.trim())).toEqual(['2', '0', '1']);
    expect(
      counts.map((count) => count.classList.contains('lifetime__bucket-count_zero')),
      'only the gap minute is muted',
    ).toEqual([false, true, false]);
    expect([...element.querySelectorAll('.lifetime__pace-value')].map((value) => value.textContent.trim())).toEqual(
      EXPECTED_LIFETIME_VIEW.yearPaces.map((pace) => `${pace.paceText} /км`),
    );
  });

  it('keeps the totals for a short-course-only history and hides the card without any finishes', () => {
    const card = createCard(SHORT_ONLY_RUNS);

    expect(card.view()).toEqual(EXPECTED_SHORT_ONLY_VIEW);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.lifetime__block'), 'no 5 km finishes — no histogram, no paces').toBeNull();

    fixture.componentRef.setInput('runs', []);
    fixture.detectChanges();

    expect(card.view()).toBeNull();
    expect(fixture.nativeElement.querySelector('.lifetime')).toBeNull();
  });
});
