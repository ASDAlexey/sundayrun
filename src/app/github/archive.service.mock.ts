import { CDN_REF_SHA_MOCK } from './cdn-ref.service.mock';

/** jsDelivrFileUrl(INDEX_JSON_PATH, CDN_REF_SHA_MOCK): the sha-pinned CDN url of the archive index. */
export const INDEX_CDN_URL = `https://cdn.jsdelivr.net/gh/ASDAlexey/sundayrun@${CDN_REF_SHA_MOCK}/data/index.json`;

export const CDN_ERROR_MESSAGE = 'cdn unreachable';

export const CDN_SERVER_ERROR_STATUS = 500;
