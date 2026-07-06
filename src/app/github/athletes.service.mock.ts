import { CDN_REF_SHA_MOCK } from './cdn-ref.service.mock';

/** jsDelivrFileUrl(ATHLETES_JSON_PATH, CDN_REF_SHA_MOCK): the sha-pinned CDN url of the athletes history. */
export const ATHLETES_CDN_URL = `https://cdn.jsdelivr.net/gh/ASDAlexey/sundayrun@${CDN_REF_SHA_MOCK}/data/athletes.json`;
