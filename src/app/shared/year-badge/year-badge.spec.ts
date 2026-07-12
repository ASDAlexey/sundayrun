import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YearBadge } from '../../core/history/year-badges.enum';
import { YearBadgeChip } from './year-badge';
import { YEAR_BADGE_LABELS, YEAR_BADGE_MODIFIERS } from './year-badge.constant';
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
    expect(chip.textContent.trim()).toBe(YEAR_BADGE_LABELS[YearBadge.obsessiveGold]);
    expect(fixture.nativeElement.querySelector('.year-badge__rarity'), 'no share — no hint').toBeNull();

    fixture.componentRef.setInput('rarityPercent', RARITY_PERCENT);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.year-badge__rarity').textContent.trim()).toBe(EXPECTED_RARITY_TEXT);
  });
});
