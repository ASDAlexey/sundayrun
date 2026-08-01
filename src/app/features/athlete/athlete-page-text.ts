import { pluralText } from '../../core/i18n/plural-text';
import { NO_BEST_TIME_TEXT } from './athlete-page.constant';

/**
 * The link-preview sentence of one profile — «Попов Алексей — 42 финиша на 5 км, личный рекорд
 * 19:12,07». The profile link is the one people actually paste to each other («посмотри мой
 * профиль»), so its preview has to name them rather than the site. Empty while there is nobody to
 * describe, which is what restores the site-wide description on a missing or failed profile.
 */
export function athleteDescriptionText(displayName: string, finishCount: number, bestTimeText: string): string {
  if (displayName === '') {
    return '';
  }

  const finishes = pluralText(finishCount, {
    one: $localize`:@@athlete.metaFinishesOne:${finishCount}:count: финиш на 5 км`,
    few: $localize`:@@athlete.metaFinishesFew:${finishCount}:count: финиша на 5 км`,
    many: $localize`:@@athlete.metaFinishesMany:${finishCount}:count: финишей на 5 км`,
  });

  if (bestTimeText === NO_BEST_TIME_TEXT) {
    return $localize`:@@athlete.metaDescription:${displayName}:name: — ${finishes}:finishes:`;
  }

  return $localize`:@@athlete.metaDescriptionWithBest:${displayName}:name: — ${finishes}:finishes:, личный рекорд ${bestTimeText}:best:`;
}

/** «1 раз / 2 раза / 5 раз рядом» — each plural form is a separate translatable message. */
export function closeTimesText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@athlete.rivalTimesOne:${count}:count: раз рядом`,
    few: $localize`:@@athlete.rivalTimesFew:${count}:count: раза рядом`,
    many: $localize`:@@athlete.rivalTimesMany:${count}:count: раз рядом`,
  });
}

/** «1 финиш / 2 финиша / 5 финишей» — each plural form is a separate translatable message. */
export function finishesText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@athlete.legendFinishesOne:${count}:count: финиш`,
    few: $localize`:@@athlete.legendFinishesFew:${count}:count: финиша`,
    many: $localize`:@@athlete.legendFinishesMany:${count}:count: финишей`,
  });
}

/** «1 забег / 2 забега / 5 забегов» — each plural form is a separate translatable message. */
export function runsCountText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@athlete.runsCountOne:${count}:count: забег`,
    few: $localize`:@@athlete.runsCountFew:${count}:count: забега`,
    many: $localize`:@@athlete.runsCountMany:${count}:count: забегов`,
  });
}

/** «1 неделя / 2 недели / 5 недель» — each plural form is a separate translatable message. */
export function weeksText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@athlete.streakWeeksOne:${count}:count: неделя`,
    few: $localize`:@@athlete.streakWeeksFew:${count}:count: недели`,
    many: $localize`:@@athlete.streakWeeksMany:${count}:count: недель`,
  });
}
