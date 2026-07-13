import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EMPTY_COURSE_RECORD_HISTORY } from '../../core/history/course-records.constant';
import { CourseRecordHistory } from '../../core/history/course-records.type';
import { EventWinnerTimes } from '../../core/history/runner-scores.interface';
import { MALE_RUNS } from '../../core/history/runner-scores.mock';
import { Gender, GenderType } from '../../core/models/gender.enum';
import { RatingCard } from './rating-card';
import {
  CARD_COURSE_RECORDS,
  CARD_WINNER_EVENTS,
  EXPECTED_RATING_CARD_VIEW,
  EXPECTED_RESTED_VIEW,
  RESTED_WINNER_EVENTS,
} from './rating-card.mock';

describe('RatingCard', () => {
  let fixture: ComponentFixture<RatingCard>;

  afterEach(() => {
    fixture.destroy();
  });

  function createCard(gender: GenderType | null, courseRecords: CourseRecordHistory, winnerEvents: EventWinnerTimes[]): RatingCard {
    fixture = TestBed.createComponent(RatingCard);
    fixture.componentRef.setInput('runs', MALE_RUNS);
    fixture.componentRef.setInput('gender', gender);
    fixture.componentRef.setInput('winnerEvents', winnerEvents);
    fixture.componentRef.setInput('courseRecords', courseRecords);

    return fixture.componentInstance;
  }

  it('quotes all three percents with the run tally behind the rank', () => {
    const card = createCard(Gender.male, CARD_COURSE_RECORDS, CARD_WINNER_EVENTS);

    expect(card.view()).toEqual(EXPECTED_RATING_CARD_VIEW);

    fixture.detectChanges();

    const values = [...fixture.nativeElement.querySelectorAll('.rating-card__metric-value')].map((cell) => cell.textContent?.trim());

    expect(values).toEqual(['92', '98,4', '96,5']);
    expect(fixture.nativeElement.querySelector('.rating-card__metric-note').textContent).toContain('по 3 забегам');
  });

  it('rests the form index after a silent year and dashes the grade without a course record', () => {
    const card = createCard(Gender.male, EMPTY_COURSE_RECORD_HISTORY, RESTED_WINNER_EVENTS);

    expect(card.view()).toEqual(EXPECTED_RESTED_VIEW);

    fixture.detectChanges();

    expect([...fixture.nativeElement.querySelectorAll('.rating-card__metric-value_empty')], 'both dashes render muted').toHaveLength(2);
  });

  it('hides the card entirely for a genderless athlete', () => {
    const card = createCard(null, CARD_COURSE_RECORDS, CARD_WINNER_EVENTS);

    expect(card.view()).toBeNull();

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.rating-card')).toBeNull();
  });
});
