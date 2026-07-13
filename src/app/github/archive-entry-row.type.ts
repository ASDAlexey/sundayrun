/** The flat db row `toArchiveEntry` folds into an `ArchiveIndexEntry`; weather columns are joined-in and individually nullable. */
export type ArchiveEntryRow = {
  slug: string;
  dateIso: string;
  number: number;
  legacyNumber: string | null;
  city: string;
  park: string;
  participantCount: number;
  finisherCount: number | null;
  medianTimeMs: number | null;
  medianMaleMs: number | null;
  medianFemaleMs: number | null;
  bestMaleMs: number | null;
  bestFemaleMs: number | null;
  newcomerCount: number | null;
  personalRecordCount: number | null;
  weatherSlug: string | null;
  temperatureC: number | null;
  apparentC: number | null;
  precipitationMm: number | null;
  windKmh: number | null;
  weatherCode: number | null;
};
