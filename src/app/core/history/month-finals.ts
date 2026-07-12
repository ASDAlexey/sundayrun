import { ISO_MONTH_LENGTH } from './month-finals.constant';

/**
 * Slugs of the «итоговые» events — the last race of each calendar month, the one that closes the
 * month's standings. Published slugs are ISO dates, so the month is a slug prefix and the
 * lexicographic maximum is the latest race. The current month is still open — its latest race may
 * yet be followed by another — so only months strictly before `todayIso` qualify; the set works
 * over any contiguous slice of the archive (a month present in the slice always brings its last
 * race along).
 */
export function monthFinalSlugs(eventSlugs: readonly string[], todayIso: string): Set<string> {
  const latestByMonth = new Map<string, string>();

  for (const slug of eventSlugs) {
    const month = slug.slice(0, ISO_MONTH_LENGTH);
    const latest = latestByMonth.get(month);

    if (latest === undefined || slug > latest) {
      latestByMonth.set(month, slug);
    }
  }

  const currentMonth = todayIso.slice(0, ISO_MONTH_LENGTH);
  const finals = new Set<string>();

  for (const [month, slug] of latestByMonth) {
    if (month < currentMonth) {
      finals.add(slug);
    }
  }

  return finals;
}
