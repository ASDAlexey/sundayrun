import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YearBadge } from '../../core/history/year-badges.enum';
import { Gender } from '../../core/models/gender.enum';
import { YearBadgeChip } from './year-badge';
import { YEAR_BADGE_FEMALE_LABELS, YEAR_BADGE_LABELS, YEAR_BADGE_MODIFIERS } from './year-badge.constant';
import { EXPECTED_RARITY_TEXT, RARITY_PERCENT } from './year-badge.mock';

describe('YearBadgeChip', () => {
  let fixture: ComponentFixture<YearBadgeChip>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(YearBadgeChip);
    fixture.componentRef.setInput('badge', YearBadge.obsessiveGold);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('renders the label with the tier modifier and shows the rarity share only when provided', () => {
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.year-badge');

    expect(chip.className).toContain(YEAR_BADGE_MODIFIERS[YearBadge.obsessiveGold]);
    expect(chip.querySelector('.year-badge__label').textContent.trim()).toBe(YEAR_BADGE_LABELS[YearBadge.obsessiveGold]);
    expect(chip.querySelector('.year-badge__medal-number').textContent.trim(), 'gold tier engraves 50').toBe('50');
    expect(fixture.nativeElement.querySelector('.year-badge__rarity'), 'no share — no hint').toBeNull();

    fixture.componentRef.setInput('rarityPercent', RARITY_PERCENT);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.year-badge__rarity').textContent.trim()).toBe(EXPECTED_RARITY_TEXT);
  });

  it('draws the ranking art and turns the crown labels female by gender', () => {
    fixture.componentRef.setInput('badge', YearBadge.courseKing);
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.year-badge');

    expect(chip.querySelector('.year-badge__crown'), 'the course crown draws the crown art').not.toBeNull();
    expect(chip.querySelector('.year-badge__label').textContent.trim(), 'no gender — the neutral label').toBe(
      YEAR_BADGE_LABELS[YearBadge.courseKing],
    );

    fixture.componentRef.setInput('gender', Gender.female);
    fixture.detectChanges();

    expect(chip.querySelector('.year-badge__label').textContent.trim()).toBe(YEAR_BADGE_FEMALE_LABELS[YearBadge.courseKing]);

    fixture.componentRef.setInput('badge', YearBadge.yearPodium);
    fixture.detectChanges();

    expect(chip.querySelector('.year-badge__podium-step'), 'the podium badge draws the steps').not.toBeNull();
    expect(chip.querySelector('.year-badge__label').textContent.trim(), 'no female override — the neutral label stays').toBe(
      YEAR_BADGE_LABELS[YearBadge.yearPodium],
    );

    fixture.componentRef.setInput('badge', YearBadge.yearTopTen);
    fixture.detectChanges();

    expect(chip.querySelector('.year-badge__laurel-count').textContent.trim(), 'the laurel carries its cut').toBe('10');
  });
});
