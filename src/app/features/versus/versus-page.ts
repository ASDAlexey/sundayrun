import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { normalizeAthleteKey } from '../../core/history/athlete-key';
import { suggestAthletes } from '../../core/history/athlete-suggest';
import { AthleteFirstLap } from '../../core/history/first-lap.interface';
import { buildHeadToHead } from '../../core/history/head-to-head';
import { HeadToHead, HeadToHeadMeeting } from '../../core/history/head-to-head.interface';
import { meetingSplitLeads } from '../../core/history/pacing';
import { MeetingSplits } from '../../core/history/pacing.interface';
import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateShort } from '../../core/time/russian-date';
import { AthletesService } from '../../github/athletes.service';
import { ReloadButton } from '../../shared/reload-button/reload-button';
import { SelfAthleteService } from '../../state/self-athlete.service';
import { ATHLETES_PAGE_LINK, VERSUS_PAGE_LINK } from '../../app.constant';
import { NO_BEST_TIME_TEXT } from '../athlete/athlete-page.constant';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { DRAW_GAP_TEXT, LEFT_ROUTE_PARAM, RIGHT_ROUTE_PARAM, VERSUS_SUGGESTION_LIMIT } from './versus-page.constant';
import { DuelStatus, DuelStatusType, VersusStatus, VersusStatusType } from './versus-page.enum';
import { AthleteOptionView, DuelSideView, MeetingView, VersusDuelState } from './versus-page.interface';

/**
 * The duel page: pick two athletes and see how many times they ran the same 5 km race and who
 * finished ahead more often — «вы встречались 14 раз, счёт 9:5». `/vs/:left/:right` is a
 * shareable URL; the athlete page links here with its athlete preselected.
 */
@Component({
  selector: 'app-versus-page',
  imports: [MatButtonModule, MatProgressSpinnerModule, ReloadButton, RouterLink],
  templateUrl: './versus-page.html',
  styleUrl: './versus-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersusPage {
  readonly #athletes = inject(AthletesService);
  readonly #router = inject(Router);
  readonly #selfAthlete = inject(SelfAthleteService);
  readonly #options = signal<AthleteRecord[]>([]);
  readonly #left = signal<AthleteRecord | null>(null);
  readonly #right = signal<AthleteRecord | null>(null);
  readonly #leftLaps = signal<AthleteFirstLap[]>([]);
  readonly #rightLaps = signal<AthleteFirstLap[]>([]);
  readonly #duel = computed(() => toDuel(this.#left(), this.#right()));
  // The lambda runs lazily, so referencing the record signals declared above is safe.
  readonly #pickedKeys = computed(() => [this.#left()?.key, this.#right()?.key]);
  readonly #duelMeetings = computed(() => this.#duel()?.meetings ?? []);
  /** Per meeting: both duelists' plausible first-lap splits, or null while either side lacks one. */
  readonly #splitLeads = computed(() => meetingSplitLeads(this.#duelMeetings(), this.#leftLaps(), this.#rightLaps()));

  readonly status = signal<VersusStatusType>(VersusStatus.loading);
  readonly duelStatus = signal<DuelStatusType>(DuelStatus.idle);
  readonly query = signal('');

  readonly leftSide = computed(() => toSideView(this.#left(), this.#duel()?.leftWins ?? 0));
  readonly rightSide = computed(() => toSideView(this.#right(), this.#duel()?.rightWins ?? 0));
  readonly meetingCount = computed(() => this.#duel()?.meetingCount ?? 0);
  readonly drawCount = computed(() => this.#duel()?.draws ?? 0);
  // `meetingSplitLeads` aligns with the meetings, so indexing into it is always in range.
  readonly meetings = computed(() => this.#duelMeetings().map((meeting, index) => toMeetingView(meeting, this.#splitLeads()[index])));
  /** «После первого круга впереди: 2 : 1» — null while no meeting carries both splits. */
  readonly splitLeadText = computed(() => toSplitLeadText(this.#splitLeads()));
  readonly suggestions = computed(() => suggest(this.#options(), this.query(), this.#pickedKeys()));
  /** The search box stays until both slots are filled; a settled duel needs no picking. */
  readonly pickerOpen = computed(() => this.duelStatus() === DuelStatus.idle);

  protected readonly statuses = VersusStatus;
  protected readonly duelStatuses = DuelStatus;
  protected readonly versusLink = VERSUS_PAGE_LINK;

  #leftKey = '';
  #rightKey = '';

  /** Only the very first (bare `/vs`) arrival auto-fills; clearing both slots later must stick. */
  #selfPrefillPending = true;

  constructor() {
    // Prerender bakes the calm loading state into static HTML; the directory arrives after hydration.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.#loadOptions();
    }

    // Same-route navigation reuses the component instance, so the pair is tracked reactively.
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.#leftKey = normalizeAthleteKey(params.get(LEFT_ROUTE_PARAM) ?? '');
        this.#rightKey = normalizeAthleteKey(params.get(RIGHT_ROUTE_PARAM) ?? '');

        // A duel against oneself is meaningless: the duplicated second key is dropped.
        if (this.#rightKey === this.#leftKey) {
          this.#rightKey = '';
        }

        if (this.#prefillSelf()) {
          return;
        }

        void this.#loadDuel(this.#leftKey, this.#rightKey);
      });
  }

  onQueryChange(query: string): void {
    this.query.set(query);
  }

  /** Fills the first free slot and navigates, so every duel lands on a shareable URL. */
  pick(key: string): void {
    this.query.set('');
    void this.#router.navigate(versusPath(this.#leftKey === '' ? key : this.#leftKey, this.#leftKey === '' ? this.#rightKey : key));
  }

  /** Clearing the first slot promotes the opponent into it: a lone athlete always sits left. */
  clearLeft(): void {
    void this.#router.navigate(versusPath(this.#rightKey, ''));
  }

  clearRight(): void {
    void this.#router.navigate(versusPath(this.#leftKey, ''));
  }

  /** Bare `/vs` with a picked self («Выбери себя») lands on `/vs/:self` — the visitor duels, not spectates. */
  #prefillSelf(): boolean {
    if (!this.#selfPrefillPending) {
      return false;
    }

    this.#selfPrefillPending = false;

    const self = this.#selfAthlete.self();

    if (this.#leftKey !== '' || this.#rightKey !== '' || self === null) {
      return false;
    }

    void this.#router.navigate(versusPath(self.key, ''), { replaceUrl: true });

    return true;
  }

  async #loadOptions(): Promise<void> {
    try {
      this.#options.set(await this.#athletes.loadRecords());
      this.status.set(VersusStatus.ready);
    } catch {
      this.status.set(VersusStatus.error);
    }
  }

  async #loadDuel(leftKey: string, rightKey: string): Promise<void> {
    this.#left.set(null);
    this.#right.set(null);
    this.#leftLaps.set([]);
    this.#rightLaps.set([]);

    if (leftKey === '' && rightKey === '') {
      this.duelStatus.set(DuelStatus.idle);

      return;
    }

    this.duelStatus.set(DuelStatus.loading);

    const next = await this.#resolveDuel(leftKey, rightKey);

    // A newer navigation may have taken over while the records were loading.
    if (leftKey !== this.#leftKey || rightKey !== this.#rightKey) {
      return;
    }

    this.#left.set(next.left);
    this.#right.set(next.right);
    this.#leftLaps.set(next.leftLaps);
    this.#rightLaps.set(next.rightLaps);
    this.duelStatus.set(next.status);
  }

  async #resolveDuel(leftKey: string, rightKey: string): Promise<VersusDuelState> {
    try {
      const [left, right, leftLaps, rightLaps] = await Promise.all([
        leftKey === '' ? null : this.#athletes.loadRecord(leftKey),
        rightKey === '' ? null : this.#athletes.loadRecord(rightKey),
        // The split leads are garnish: a failed lap read still settles the duel.
        leftKey === '' ? [] : this.#athletes.loadFirstLaps(leftKey).catch(() => []),
        rightKey === '' ? [] : this.#athletes.loadFirstLaps(rightKey).catch(() => []),
      ]);

      if ((leftKey !== '' && left === null) || (rightKey !== '' && right === null)) {
        return { status: DuelStatus.notFound, left: null, right: null, leftLaps: [], rightLaps: [] };
      }

      return { status: left !== null && right !== null ? DuelStatus.ready : DuelStatus.idle, left, right, leftLaps, rightLaps };
    } catch {
      return { status: DuelStatus.error, left: null, right: null, leftLaps: [], rightLaps: [] };
    }
  }
}

function toDuel(left: AthleteRecord | null, right: AthleteRecord | null): HeadToHead | null {
  return left === null || right === null ? null : buildHeadToHead(left.runs, right.runs);
}

function toSideView(record: AthleteRecord | null, wins: number): DuelSideView | null {
  if (record === null) {
    return null;
  }

  return { key: record.key, displayName: record.displayName, athleteLink: [ATHLETES_PAGE_LINK, record.key], wins };
}

/** Name matches for the free slot, already-picked athletes excluded. */
function suggest(options: AthleteRecord[], query: string, pickedKeys: (string | undefined)[]): AthleteOptionView[] {
  return suggestAthletes(options, query, pickedKeys, VERSUS_SUGGESTION_LIMIT).map(toOptionView);
}

function toOptionView(record: AthleteRecord): AthleteOptionView {
  return {
    key: record.key,
    displayName: record.displayName,
    bestTimeText: record.bestMs === null ? NO_BEST_TIME_TEXT : formatDuration(record.bestMs),
  };
}

function toMeetingView(meeting: HeadToHeadMeeting, splits: MeetingSplits | null): MeetingView {
  return {
    slug: meeting.slug,
    raceLink: [RACE_PAGE_BASE_LINK, meeting.slug],
    dateShort: formatRussianDateShort(meeting.dateIso),
    leftTimeText: formatDuration(meeting.leftMs),
    rightTimeText: formatDuration(meeting.rightMs),
    leftWon: meeting.leftMs < meeting.rightMs,
    rightWon: meeting.rightMs < meeting.leftMs,
    gapText: meeting.leftMs === meeting.rightMs ? DRAW_GAP_TEXT : formatDuration(Math.abs(meeting.leftMs - meeting.rightMs)),
    leftLedSplit: splits !== null && splits.leftLapMs < splits.rightLapMs,
    rightLedSplit: splits !== null && splits.rightLapMs < splits.leftLapMs,
  };
}

/** Counts who reached 2,3 км first across the split-bearing meetings; a lap dead heat counts neither. */
function toSplitLeadText(leads: (MeetingSplits | null)[]): string | null {
  const known = leads.filter((lead) => lead !== null);

  if (known.length === 0) {
    return null;
  }

  const leftLeads = known.filter((lead) => lead.leftLapMs < lead.rightLapMs).length;
  const rightLeads = known.filter((lead) => lead.rightLapMs < lead.leftLapMs).length;

  return $localize`:@@versus.splitLeads:После первого круга впереди: ${leftLeads}:left: : ${rightLeads}:right:`;
}

/** `/vs` plus the filled slots in order; a single athlete always occupies the first one. */
function versusPath(first: string, second: string): string[] {
  return [VERSUS_PAGE_LINK, ...(first === '' ? [] : [first]), ...(second === '' ? [] : [second])];
}
