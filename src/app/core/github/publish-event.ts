import { bytesToBase64 } from '../encoding/base64';
import { applyEventsToDb } from '../sqlite/protocol-db-write';
import { isoToday } from '../time/iso-today';
import { type EventWeather } from '../weather/event-weather.interface';
import { fetchEventsWeather } from '../weather/fetch-event-weather';
import { eventFilePaths } from './event-paths';
import { COMMIT_MESSAGE_PREFIX } from './github-api.constant';
import { type CommitFile } from './github-api.interface';
import { commitFilesAtomically } from './github-commit';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { type GithubAccess, type GithubFetchFn } from './github-fetch.type';
import { buildProtocolDbCommitFile } from './protocol-db-file';
import { type PublishEventInput, type PublishEventResult } from './publish-event.interface';
import { BATCH_SLUG_RANGE_SEPARATOR, BATCH_SLUG_SUFFIX_CLOSE, BATCH_SLUG_SUFFIX_OPEN } from './publish-event.constant';
import { publishVersionPointer } from './version-pointer';

/** One protocol to publish, plus who publishes it and over which transport. */
export interface PublishEventRequest {
  readonly token: string;
  readonly input: PublishEventInput;
  readonly fetchFn?: GithubFetchFn;
}

/** The batch form of {@link PublishEventRequest}: every protocol lands in the same commit. */
export interface PublishEventsRequest {
  readonly token: string;
  readonly inputs: PublishEventInput[];
  readonly fetchFn?: GithubFetchFn;
}

/** What one commit attempt of a publication works on; `parentSha` moves when the branch does. */
interface PublishAttempt {
  readonly ordered: PublishEventInput[];
  readonly weathers: (EventWeather | null)[];
  readonly parentSha: string;
}

/**
 * Publishes one event into the protocols repository as a single atomic commit: the `source.xlsx`
 * workbook and the derived `sundayrun.db`, which is the single source of truth. The db is downloaded
 * fresh on every commit attempt and the event is rolled onto it — re-publishing the same date first
 * strips the previous contribution, so the operation is idempotent, and a concurrent publication is
 * merged instead of overwritten. Finishes by pointing `version.json` at the new commit — the
 * sha-pinned data urls are immutable, so nothing else needs a purge. The returned sha references the
 * data commit; the protocol PDF is generated on the fly from the results, never stored.
 *
 * The event date's 9:00 course weather rides along into the db; it is fetched once per publication
 * (not per commit attempt — the readings cannot change), for the whole batch in a single request
 * per endpoint (see `fetchEventsWeather`), and a failed fetch publishes without it.
 */
export function publishEvent(request: PublishEventRequest): Promise<PublishEventResult> {
  const { token, input, fetchFn } = request;

  return publishEvents({ token, inputs: [input], fetchFn });
}

/**
 * The batch form of `publishEvent`: every workbook plus the one `sundayrun.db` carrying all the
 * events land in the SAME atomic commit, so a multi-protocol upload is all-or-nothing — a failed
 * attempt leaves the archive untouched — and is followed by a single pointer update.
 */
export async function publishEvents(request: PublishEventsRequest): Promise<PublishEventResult> {
  const { token, inputs, fetchFn = DEFAULT_GITHUB_FETCH } = request;
  const access: GithubAccess = { token, fetchFn };
  const ordered = [...inputs].sort((left, right) => left.event.dateIso.localeCompare(right.event.dateIso));
  const weathers = await fetchEventsWeather(
    ordered.map((input) => input.event.dateIso),
    { todayIso: isoToday(), fetchFn },
  );
  const slug = batchSlug(ordered);
  const commitSha = await commitFilesAtomically({
    token,
    fetchFn,
    buildFiles: (parentSha) => buildCommitFiles(access, { ordered, weathers, parentSha }),
    message: `${COMMIT_MESSAGE_PREFIX}${slug}`,
  });

  await publishVersionPointer({ token, slug, dataCommitSha: commitSha, fetchFn });

  return { commitSha };
}

/** One date reads as before; a batch reads as its date range plus the count, keeping messages short. */
function batchSlug(ordered: PublishEventInput[]): string {
  const first = ordered[0].event.dateIso;
  const last = ordered[ordered.length - 1].event.dateIso;

  return ordered.length === 1
    ? first
    : `${first}${BATCH_SLUG_RANGE_SEPARATOR}${last}${BATCH_SLUG_SUFFIX_OPEN}${ordered.length}${BATCH_SLUG_SUFFIX_CLOSE}`;
}

/**
 * Re-downloads `sundayrun.db`, rolls every event onto it and pairs it with the source workbooks;
 * once per attempt. An event without a workbook (timed by the built-in stopwatch) contributes no
 * file at all, so a mixed batch commits only the workbooks it actually has.
 */
async function buildCommitFiles(access: GithubAccess, attempt: PublishAttempt): Promise<CommitFile[]> {
  const { ordered, weathers, parentSha } = attempt;
  const dbFile = await buildProtocolDbCommitFile(access, {
    parentSha,
    updateDb: (dbBytes) =>
      applyEventsToDb(
        dbBytes,
        ordered.map((input, index) => ({ event: input.event, rows: input.rows, weather: weathers[index] })),
      ),
  });

  return [...ordered.flatMap(sourceXlsxCommitFile), dbFile];
}

/** The event's workbook as a commit file, or nothing when it was timed by the stopwatch. */
function sourceXlsxCommitFile(input: PublishEventInput): CommitFile[] {
  const bytes = input.sourceXlsxBytes;

  return bytes === null ? [] : [{ path: eventFilePaths(input.event.dateIso).sourceXlsx, base64Content: bytesToBase64(bytes) }];
}
