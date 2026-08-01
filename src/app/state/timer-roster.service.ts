import { DOCUMENT, Service, inject, signal } from '@angular/core';

import { GenderType } from '../core/models/gender.enum';
import { AthleteRecord } from '../core/models/athlete-history.interface';
import { buildLapStats } from '../core/timer/lap-stats';
import { AthletesService } from '../github/athletes.service';
import { TIMER_ROSTER_SSR_NOOP_STORAGE, TIMER_ROSTER_SSR_NOW_MS, TIMER_ROSTER_STORAGE_KEY } from './timer-roster.constant';
import { TimerRosterStatus, TimerRosterStatusType } from './timer-roster.enum';
import { TimerRosterSnapshot } from './timer-roster.interface';
import { readTimerRosterCache, serializeTimerRosterCache, toMinimalRecord } from './timer-roster.storage';
import { TimerStorage } from './timer-storage.type';

/**
 * The athlete directory behind the «Атлеты» sheet, kept warm for a park with no signal. The
 * constructor starts from the localStorage cache, so the sheet has names the moment the page opens;
 * `load` then refreshes it from the archive db and writes the cache back. A failed read leaves both
 * the records and the cached date alone and only raises `error` — offline is a normal Sunday, not a
 * broken screen. `load` never rejects, and a second call while one is in flight joins the first.
 */
@Service()
export class TimerRosterService {
  readonly #athletes = inject(AthletesService);
  readonly #view = inject(DOCUMENT).defaultView;
  readonly #cache = readTimerRosterCache(this.#storage.getItem(TIMER_ROSTER_STORAGE_KEY));
  readonly #records = signal<AthleteRecord[]>(this.#cache.records);
  readonly #expectedLapMs = signal<ReadonlyMap<string, number>>(this.#cache.expectedLapMs);
  readonly #bestLapMs = signal<ReadonlyMap<string, number>>(this.#cache.bestLapMs);
  readonly #appearanceCount = signal<ReadonlyMap<string, number>>(this.#cache.appearanceCount);
  readonly #courseRecordLapMs = signal<Readonly<Record<GenderType, number | null>>>(this.#cache.courseRecordLapMs);
  readonly #cachedAtMs = signal<number | null>(this.#cache.savedAtMs);
  readonly #status = signal<TimerRosterStatusType>(this.#cache.savedAtMs === null ? TimerRosterStatus.idle : TimerRosterStatus.ready);

  readonly records = this.#records.asReadonly();
  /** Athlete key → median first lap; the order the tiles are laid out in before the start. */
  readonly expectedLapMs = this.#expectedLapMs.asReadonly();
  /** Athlete key → fastest first lap ever; the «быстрее своего лучшего круга» mark of the «Круг» table. */
  readonly bestLapMs = this.#bestLapMs.asReadonly();
  /** Athlete key → timed first laps in the archive; how the roster sheet knows the regulars. */
  readonly appearanceCount = this.#appearanceCount.asReadonly();
  /** Fastest first lap of the archive per gender; the record the «Круг» table watches the leader against. */
  readonly courseRecordLapMs = this.#courseRecordLapMs.asReadonly();
  readonly status = this.#status.asReadonly();
  /** When the directory in hand was fetched — the «актуально на» line of the offline indicator. */
  readonly cachedAtMs = this.#cachedAtMs.asReadonly();

  #pending: Promise<void> | null = null;

  load(): Promise<void> {
    this.#pending ??= this.#loadFresh().finally(() => {
      this.#pending = null;
    });

    return this.#pending;
  }

  async #loadFresh(): Promise<void> {
    this.#status.set(TimerRosterStatus.loading);

    try {
      const roster = await this.#readRoster();
      const savedAtMs = this.#nowMs();

      this.#records.set(roster.records);
      this.#expectedLapMs.set(roster.expectedLapMs);
      this.#bestLapMs.set(roster.bestLapMs);
      this.#appearanceCount.set(roster.appearanceCount);
      this.#courseRecordLapMs.set(roster.courseRecordLapMs);
      this.#cachedAtMs.set(savedAtMs);
      this.#status.set(TimerRosterStatus.ready);
      this.#storage.setItem(TIMER_ROSTER_STORAGE_KEY, serializeTimerRosterCache({ ...roster, savedAtMs }));
    } catch {
      this.#status.set(TimerRosterStatus.error);
    }
  }

  /**
   * One keyed `meta` row where the archive carries the materialised directory, the two full scans
   * it always ran where it does not — an archive published by an earlier release still fills the
   * sheet, it just pays the ~130 range requests for it. Both branches end in the same four maps:
   * the publish path builds them with the very `buildLapStats` the fallback calls here, over the
   * very rows `loadPacingRows` returns, so which one answered is invisible from here on.
   */
  async #readRoster(): Promise<TimerRosterSnapshot> {
    const summary = await this.#athletes.loadTimerRoster();

    if (summary !== null) {
      return {
        records: summary.athletes.map(toMinimalRecord),
        expectedLapMs: summary.expectedLapMs,
        bestLapMs: summary.bestLapMs,
        appearanceCount: summary.appearanceCount,
        courseRecordLapMs: summary.courseRecordLapMs,
      };
    }

    const [records, pacingRows] = await Promise.all([this.#athletes.loadRecords(), this.#athletes.loadPacingRows()]);

    return { records, ...buildLapStats(pacingRows) };
  }

  #nowMs(): number {
    return this.#view?.Date.now() ?? TIMER_ROSTER_SSR_NOW_MS;
  }

  /** Live localStorage access, so specs can stub the global per scenario; absent during prerender. */
  get #storage(): TimerStorage {
    return typeof localStorage === 'undefined' ? TIMER_ROSTER_SSR_NOOP_STORAGE : localStorage;
  }
}
