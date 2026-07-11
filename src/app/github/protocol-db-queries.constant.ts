/**
 * The statements behind `protocol-db-queries`. Column aliases translate the db's snake_case
 * into the camelCase the model interfaces use, so rows need no per-field remapping.
 */

export const SELECT_ATHLETE_SQL = `
SELECT key, display_name AS displayName, gender, best_ms AS bestMs
FROM athletes
WHERE key = $key`;

export const SELECT_ATHLETE_RUNS_SQL = `
SELECT date_iso AS dateIso, slug, time_ms AS timeMs, distance_km AS distanceKm
FROM runs
WHERE athlete_key = $key
ORDER BY date_iso`;

export const SELECT_ATHLETE_PARTICIPATIONS_SQL = `
SELECT slug
FROM participations
WHERE athlete_key = $key
ORDER BY slug`;

/** Ranked athletes only: a null `best_ms` (a DNF-only athlete) never reaches a leaderboard. */
export const SELECT_RANKED_ATHLETES_SQL = `
SELECT key, display_name AS displayName, gender, best_ms AS bestMs
FROM athletes
WHERE best_ms IS NOT NULL`;

/**
 * One row per athlete and season: the fastest 5 km time of that year and the earliest run
 * where it was set (SQLite's bare-column-with-MIN rule makes `slug` come from that run) —
 * exactly the runs `bestResults` reads off an `AthleteRecord`.
 */
export const SELECT_YEAR_BEST_RUNS_SQL = `
SELECT year_bests.athlete_key AS athleteKey,
       MIN(runs.date_iso) AS dateIso,
       runs.slug AS slug,
       year_bests.best_ms AS timeMs
FROM (
  SELECT athlete_key, substr(date_iso, 1, 4) AS year, MIN(time_ms) AS best_ms
  FROM runs
  WHERE distance_km = $distanceKm
  GROUP BY athlete_key, substr(date_iso, 1, 4)
) AS year_bests
JOIN runs ON runs.athlete_key = year_bests.athlete_key
  AND runs.distance_km = $distanceKm
  AND runs.time_ms = year_bests.best_ms
  AND substr(runs.date_iso, 1, 4) = year_bests.year
GROUP BY year_bests.athlete_key, year_bests.year`;

/** Events are counted from `events` — every published event has at least one participant. */
export const SELECT_OVERALL_COUNTS_SQL = `
SELECT (SELECT COUNT(*) FROM events) AS eventsCount,
       (SELECT COUNT(*) FROM runs) AS finishesCount,
       (SELECT COUNT(DISTINCT athlete_key) FROM runs) AS finishersCount`;

const FIVE_KM_GENDER_TIMES_SQL = `FROM runs
  JOIN athletes ON athletes.key = runs.athlete_key
  WHERE athletes.gender = $gender AND runs.distance_km = $distanceKm`;

/**
 * The median 5 km time of one gender, like `computeOverallStats` takes it: the middle value,
 * or the mean of the two middle values for an even sample (`LIMIT 2 - count % 2`). An empty
 * sample averages nothing and yields null.
 */
export const SELECT_MEDIAN_TIME_SQL = `
SELECT AVG(time_ms) AS medianMs
FROM (
  SELECT runs.time_ms AS time_ms
  ${FIVE_KM_GENDER_TIMES_SQL}
  ORDER BY runs.time_ms
  LIMIT 2 - (SELECT COUNT(*) ${FIVE_KM_GENDER_TIMES_SQL}) % 2
  OFFSET (SELECT (COUNT(*) - 1) / 2 ${FIVE_KM_GENDER_TIMES_SQL})
)`;

/** Newest first — the order `parseArchiveIndex` guarantees for the JSON index. */
export const SELECT_EVENTS_SQL = `
SELECT slug,
       date_iso AS dateIso,
       number,
       city,
       park,
       participant_count AS participantCount,
       finisher_count AS finisherCount,
       avg_time_ms AS avgTimeMs,
       best_male_ms AS bestMaleMs,
       best_female_ms AS bestFemaleMs
FROM events
ORDER BY date_iso DESC`;

export const SELECT_LATEST_EVENTS_SQL = `${SELECT_EVENTS_SQL}
LIMIT $limit`;

/** One event's metadata, aliased straight into `RaceEvent`; the results below share the slug. */
export const SELECT_EVENT_SQL = `
SELECT number,
       date_iso AS dateIso,
       city,
       park,
       club_name AS clubName,
       chairman
FROM events
WHERE slug = $slug`;

/** Every protocol row of one event, in display order; the reserved `idx` reads back as `index`. */
export const SELECT_EVENT_RESULTS_SQL = `
SELECT idx AS "index",
       full_name AS fullName,
       time23,
       time5,
       total_ms AS totalMs,
       distance_km AS distanceKm,
       gender,
       place_m AS placeM,
       place_f AS placeF,
       club,
       note
FROM results
WHERE slug = $slug
ORDER BY idx`;
