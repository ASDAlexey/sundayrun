import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FADE_PROFILE_LAPS, NEGATIVE_PROFILE_RUNS, PACING_LAPS, PACING_RUNS } from '../../core/history/pacing.mock';
import { AthleteFirstLap } from '../../core/history/first-lap.interface';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { PacingCard } from './pacing-card';
import { EXPECTED_FADE_CARD_VIEW, EXPECTED_NEAR_EVEN_CARD_VIEW, EXPECTED_PACING_CARD_VIEW, NEAR_EVEN_LAPS } from './pacing-card.mock';

describe('PacingCard', () => {
  let fixture: ComponentFixture<PacingCard>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => {
    fixture.destroy();
  });

  function createCard(runs: readonly AthleteRun[], laps: readonly AthleteFirstLap[]): PacingCard {
    fixture = TestBed.createComponent(PacingCard);
    fixture.componentRef.setInput('runs', [...runs]);
    fixture.componentRef.setInput('laps', [...laps]);

    return fixture.componentInstance;
  }

  it('renders the archetype, the median delta, the tally and the linked best split', () => {
    const card = createCard(PACING_RUNS, PACING_LAPS);

    expect(card.view()).toEqual(EXPECTED_PACING_CARD_VIEW);

    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelector('.pacing-card__profile').textContent.trim()).toBe(EXPECTED_PACING_CARD_VIEW.profileText);
    expect(element.querySelector('.pacing-card__date').getAttribute('href')).toContain(String(EXPECTED_PACING_CARD_VIEW.best?.raceLink[1]));
  });

  it('drops the best row for a fader, levels sub-percent deltas, hides the card below the minimum', () => {
    const card = createCard(NEGATIVE_PROFILE_RUNS, FADE_PROFILE_LAPS);

    expect(card.view()).toEqual(EXPECTED_FADE_CARD_VIEW);

    fixture.componentRef.setInput('laps', NEAR_EVEN_LAPS);

    expect(card.view(), 'hair-thin negative splits: level median, yet the best row survives').toEqual(EXPECTED_NEAR_EVEN_CARD_VIEW);

    fixture.componentRef.setInput('laps', FADE_PROFILE_LAPS.slice(0, 2));

    expect(card.view()).toBeNull();

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.pacing-card')).toBeNull();
  });
});
