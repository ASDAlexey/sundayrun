import { AthletesHistory } from '../models/athletes-history.type';

/**
 * The dates of every published event, recovered from the athletes' participations (each
 * published event has at least one participant, DNF included) and sorted ascending. Published
 * slugs are the events' ISO dates. Feeds the auto-computed race number on the admin form.
 */
export function eventDatesFromHistory(history: AthletesHistory): string[] {
  const dates = new Set<string>();

  for (const record of Object.values(history)) {
    for (const slug of record.participationSlugs) {
      dates.add(slug);
    }
  }

  return [...dates].sort((left, right) => left.localeCompare(right));
}
