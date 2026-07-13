/** The «Рейтинг» card prepared for the template; null (nothing scored yet) hides the card. */
export interface RatingCardView {
  /** «92,4» — the average percent of the own-gender winner over every start. */
  rankText: string;
  /** «по 42 забегам» — the pluralized tally behind the rank. */
  rankRunsText: string;
  /** «98,1» — the weighted top-5 of the last year; null shows the resting dash instead. */
  formText: string | null;
  /** «96,5» — the best against the course record of the own gender; null shows the dash. */
  gradeText: string | null;
}
