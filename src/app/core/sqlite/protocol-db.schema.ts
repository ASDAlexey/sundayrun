import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Drizzle table descriptions mirroring `PROTOCOL_DB_SCHEMA_STATEMENTS` column-for-column. */

export const events = sqliteTable('events', {
  slug: text('slug').primaryKey(),
  dateIso: text('date_iso').notNull(),
  number: real('number').notNull(),
  city: text('city').notNull(),
  park: text('park').notNull(),
  clubName: text('club_name').notNull(),
  chairman: text('chairman').notNull(),
  participantCount: integer('participant_count').notNull(),
  finisherCount: integer('finisher_count'),
  avgTimeMs: integer('avg_time_ms'),
  bestMaleMs: integer('best_male_ms'),
  bestFemaleMs: integer('best_female_ms'),
});

export const results = sqliteTable(
  'results',
  {
    slug: text('slug').notNull(),
    idx: integer('idx').notNull(),
    fullName: text('full_name').notNull(),
    time23: text('time23').notNull(),
    time5: text('time5').notNull(),
    totalMs: integer('total_ms'),
    distanceKm: real('distance_km'),
    gender: text('gender'),
    placeM: integer('place_m'),
    placeF: integer('place_f'),
    club: text('club').notNull(),
    note: text('note').notNull(),
  },
  (t) => [primaryKey({ columns: [t.slug, t.idx] })],
);

export const athletes = sqliteTable('athletes', {
  key: text('key').primaryKey(),
  displayName: text('display_name').notNull(),
  gender: text('gender'),
  bestMs: integer('best_ms'),
});

export const runs = sqliteTable('runs', {
  athleteKey: text('athlete_key').notNull(),
  dateIso: text('date_iso').notNull(),
  slug: text('slug').notNull(),
  timeMs: integer('time_ms').notNull(),
  distanceKm: real('distance_km').notNull(),
});

export const participations = sqliteTable(
  'participations',
  {
    athleteKey: text('athlete_key').notNull(),
    slug: text('slug').notNull(),
  },
  (t) => [primaryKey({ columns: [t.athleteKey, t.slug] })],
);

export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
