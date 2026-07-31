import { inject, Service, signal } from '@angular/core';
import { gzipSync, strToU8 } from 'fflate';

import { CorosApiError } from '../core/coros/coros-api.error';
import { CorosClient } from '../core/coros/coros.client';
import { CorosActivity } from '../core/coros/coros-api.interface';
import { isoToday } from '../core/time/iso-today';
import { TRACK_CHECK_ATTEMPT_LIMIT } from './athlete-track.constant';
import { AthleteTrack } from './athlete-track.interface';
import { readChecks, readTracks, saveCheck, saveTrack } from './athlete-track.storage';
import { RACE_DISTANCE_MAX_M, RACE_DISTANCE_MIN_M } from './track-sync.constant';
import { TrackSyncStatus, TrackSyncStatusType } from './track-sync.enum';
import { RaceDay } from './track-sync.interface';
import { WatchAccount } from './watch-account.interface';
import { WatchAccountService } from './watch-account.service';

/**
 * Pulls the races of a linked watch account into this device, quietly, on every visit.
 *
 * The whole point is that it costs nothing when there is nothing to fetch: a day is asked about
 * only if the athlete raced it, the track is not here yet, and the day has not already been asked
 * about too many times. In a normal week that leaves an empty list and no request at all.
 */
@Service()
export class TrackSyncService {
  readonly #accounts = inject(WatchAccountService);
  readonly #coros = inject(CorosClient);
  readonly #tracks = signal<AthleteTrack[]>([]);
  readonly #status = signal<TrackSyncStatusType>(TrackSyncStatus.idle);

  readonly tracks = this.#tracks.asReadonly();

  readonly status = this.#status.asReadonly();

  /** Reads what this device already holds, without touching the network. */
  async load(): Promise<void> {
    this.#tracks.set(await readTracks());
  }

  /**
   * Fetches whatever is missing among the given races.
   *
   * Empty answers are journalled rather than retried forever: a watch is often synced hours after
   * the race, so a day gets a few visits' worth of second chances before it is given up on.
   */
  async sync(races: RaceDay[]): Promise<void> {
    const account = this.#accounts.account();

    if (account === null) {
      return;
    }

    const missing = await this.#missingRaces(races);

    if (missing.length === 0) {
      return;
    }

    this.#status.set(TrackSyncStatus.syncing);

    const dates = missing.map((race) => race.dateIso).sort();

    try {
      const runs = await this.#coros.queryRuns(account.token, dates[0], dates[dates.length - 1], account.region);

      for (const race of missing) {
        await this.#applyRace(race, runs, account);
      }

      await this.load();
      this.#status.set(TrackSyncStatus.idle);
    } catch (error) {
      this.#status.set(error instanceof CorosApiError ? TrackSyncStatus.expired : TrackSyncStatus.failed);

      if (error instanceof CorosApiError) {
        this.#accounts.expire();
      }
    }
  }

  /** Races worth asking about: raced, not here yet, not already given up on, and not in the future. */
  async #missingRaces(races: RaceDay[]): Promise<RaceDay[]> {
    const stored = await readTracks();
    const checks = await readChecks();
    const held = new Set(stored.map((track) => track.slug));
    const attempts = new Map(checks.map((check) => [check.dateIso, check.attempts]));
    const todayIso = isoToday();

    this.#tracks.set(stored);

    return races.filter(
      (race) => !held.has(race.slug) && race.dateIso <= todayIso && (attempts.get(race.dateIso) ?? 0) < TRACK_CHECK_ATTEMPT_LIMIT,
    );
  }

  async #applyRace(race: RaceDay, runs: CorosActivity[], account: WatchAccount): Promise<void> {
    const match = runs.find(
      (run) => run.dateIso === race.dateIso && run.distanceM >= RACE_DISTANCE_MIN_M && run.distanceM <= RACE_DISTANCE_MAX_M,
    );

    if (match === undefined) {
      await saveCheck({
        dateIso: race.dateIso,
        source: account.source,
        checkedAtIso: new Date().toISOString(),
        attempts: (await this.#attemptsOf(race.dateIso)) + 1,
      });

      return;
    }

    const gpx = await this.#coros.downloadGpx(account.token, match.labelId, account.region);

    await saveTrack({
      slug: race.slug,
      source: account.source,
      activityId: match.labelId,
      dateIso: race.dateIso,
      distanceM: match.distanceM,
      totalTimeS: match.totalTimeS,
      gpxGzip: gzipSync(strToU8(gpx)),
      savedAtIso: new Date().toISOString(),
    });
  }

  async #attemptsOf(dateIso: string): Promise<number> {
    const checks = await readChecks();

    return checks.find((check) => check.dateIso === dateIso)?.attempts ?? 0;
  }
}
