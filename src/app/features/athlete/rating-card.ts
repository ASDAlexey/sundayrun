import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { CourseRecordHistory } from '../../core/history/course-records.type';
import { athleteRating, newestEventIso, winnerTimesBySlug } from '../../core/history/runner-scores';
import { AthleteRating, EventWinnerTimes } from '../../core/history/runner-scores.interface';
import { scoreText } from '../../core/history/score-text';
import { pluralText } from '../../core/i18n/plural-text';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { GenderType } from '../../core/models/gender.enum';
import { RatingCardView } from './rating-card.interface';

/**
 * The «Рейтинг» card: three percent scores of one athlete. The UltraSignup-style Runner Rank
 * (the average percent of the own-gender winner over every start), the ITRA-style «Индекс формы»
 * (the weighted top-5 of the last year, fresher runs weighing more) and the age-grading-style
 * «Локальный грейд» (the best against the course record of the own gender). An athlete with no
 * scored finish — genderless, or from protocols without a gender winner — shows no card at all.
 */
@Component({
  selector: 'app-rating-card',
  templateUrl: './rating-card.html',
  styleUrl: './rating-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingCard {
  // The computed lambdas run lazily, so referencing the inputs declared below is safe.
  /** The archive's newest event day anchors the form-index year — no wall clock, no rating drift. */
  readonly #anchorIso = computed(() => newestEventIso(this.winnerEvents()));

  readonly #courseRecordMs = computed(() => {
    const gender = this.gender();

    return gender === null ? null : (this.courseRecords()[gender].at(-1)?.timeMs ?? null);
  });

  /** The athlete's full 5 km history; the order never matters. */
  readonly runs = input.required<AthleteRun[]>();
  readonly gender = input.required<GenderType | null>();
  /** Every event's per-gender winning times — the score denominators. */
  readonly winnerEvents = input.required<EventWinnerTimes[]>();
  /** The course record progression; the standing record of the athlete's gender feeds the grade. */
  readonly courseRecords = input.required<CourseRecordHistory>();

  readonly view = computed(() =>
    toRatingCardView(
      athleteRating(this.runs(), this.gender(), winnerTimesBySlug(this.winnerEvents()), this.#courseRecordMs(), this.#anchorIso()),
    ),
  );
}

function toRatingCardView(rating: AthleteRating): RatingCardView | null {
  if (rating.runnerRank === null) {
    return null;
  }

  return {
    rankText: scoreText(rating.runnerRank),
    rankRunsText: rankRunsText(rating.scoredCount),
    formText: rating.formIndex === null ? null : scoreText(rating.formIndex),
    gradeText: rating.localGrade === null ? null : scoreText(rating.localGrade),
  };
}

/** «по 1 забегу / по 42 забегам» — each plural form is a separate translatable message. */
function rankRunsText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@athlete.ratingRankRunsOne:по ${count}:count: забегу`,
    few: $localize`:@@athlete.ratingRankRunsFew:по ${count}:count: забегам`,
    many: $localize`:@@athlete.ratingRankRunsMany:по ${count}:count: забегам`,
  });
}
