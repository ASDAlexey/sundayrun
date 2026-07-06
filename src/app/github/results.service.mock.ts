import { EVENT_DATE_ISO } from '../core/github/event-paths.mock';
import { CDN_REF_SHA_MOCK } from './cdn-ref.service.mock';

/** jsDelivrFileUrl(eventFilePaths(EVENT_DATE_ISO).resultsJson, CDN_REF_SHA_MOCK): the sha-pinned CDN url of the results file. */
export const RESULTS_CDN_URL = `https://cdn.jsdelivr.net/gh/ASDAlexey/sundayrun@${CDN_REF_SHA_MOCK}/data/events/${EVENT_DATE_ISO}/results.json`;

/** Parses to null: valid JSON of an unexpected shape. */
export const FOREIGN_SCHEMA_TEXT = '{"schemaVersion":2}';
