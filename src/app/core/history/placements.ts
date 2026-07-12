import { FIRST_PLACE, SECOND_PLACE, THIRD_PLACE } from './placements.constant';
import { AthletePlacements } from './placements.interface';

/**
 * Splits the athlete's protocol places by race kind: the best place ever taken at a monthly final
 * (see `monthFinalSlugs`) vs at a regular race, plus how many finals ended on each podium step.
 * Places come per gender as the protocol assigns them; a DNF or a 2.3 km run carries no place and
 * never enters `placeBySlug`.
 */
export function athletePlacements(placeBySlug: Readonly<Record<string, number>>, finalSlugs: ReadonlySet<string>): AthletePlacements {
  const placements: AthletePlacements = {
    bestFinalPlace: null,
    bestRegularPlace: null,
    firstFinalCount: 0,
    secondFinalCount: 0,
    thirdFinalCount: 0,
  };

  for (const [slug, place] of Object.entries(placeBySlug)) {
    if (!finalSlugs.has(slug)) {
      placements.bestRegularPlace = betterPlace(placements.bestRegularPlace, place);
      continue;
    }

    placements.bestFinalPlace = betterPlace(placements.bestFinalPlace, place);

    if (place === FIRST_PLACE) {
      placements.firstFinalCount += 1;
    } else if (place === SECOND_PLACE) {
      placements.secondFinalCount += 1;
    } else if (place === THIRD_PLACE) {
      placements.thirdFinalCount += 1;
    }
  }

  return placements;
}

function betterPlace(current: number | null, place: number): number {
  return current === null || place < current ? place : current;
}
