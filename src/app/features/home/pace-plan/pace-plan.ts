import { Location } from '@angular/common';
import { DOCUMENT, Component, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { formatDuration, parseDuration } from '../../../core/time/duration';
import { type AthleteRecord } from '../../../core/models/athlete-history.interface';
import { type PacePlan as Plan } from '../../../core/pace/pace-plan.interface';
import { PACE_PLAN_EVEN_INDEX, PACE_PLAN_NEGATIVE_INDEX } from '../../../core/pace/pace-plan.constant';
import { planFromFinish, planFromPace } from '../../../core/pace/pace-plan';
import { CourseTrack } from '../course-track/course-track';
import {
  PACE_PLAN_FOOTER_TEXT,
  PACE_PLAN_NEGATIVE_SPLIT_VALUE,
  PACE_PLAN_POINTS,
  PACE_PLAN_PER_KM_TEXT,
  PACE_PLAN_POSTER_FALLBACK,
  PACE_PLAN_POSTER_TOKENS,
  PACE_PLAN_PRESETS,
  PACE_PLAN_SPLIT_PARAM,
  PACE_PLAN_TARGET_PARAM,
  PACE_PLAN_TITLE_TEXT,
} from './pace-plan.constant';
import { type PacePlanRow } from './pace-plan.interface';
import { planTargets } from './plan-targets';
import { POSTER_FILE_NAME } from './plan-poster.constant';
import { type PosterPalette } from './plan-poster.interface';
import { buildPlanPoster } from './plan-poster';
import { PlanImageService } from './plan-image.service';

/**
 * The one thing on this site that is about a race not yet run.
 *
 * Everything else here reports: rankings, form, records, who you have raced. None of it is any use
 * at half past eight on a Sunday with three minutes to the start. This card asks for a target and
 * answers with the clock readings that go with it, pinned to the points of the course a runner can
 * actually recognise — and the map above is the answer, not an illustration of it.
 *
 * Two fields rather than a field and a mode switch. A finish time and a pace are the same fact
 * stated twice, and which one a person thinks in is not something worth making them declare: type
 * into either and the other fills itself in. The card holds no opinion about which is primary.
 */
@Component({
  selector: 'app-pace-plan',
  templateUrl: './pace-plan.html',
  styleUrl: './pace-plan.scss',
  imports: [CourseTrack],
})
export class PacePlan {
  readonly #document = inject(DOCUMENT);

  readonly #image = inject(PlanImageService);

  readonly #route = inject(ActivatedRoute);

  readonly #router = inject(Router);

  readonly #location = inject(Location);

  readonly #plan = signal<Plan | null>(null);

  /** The visitor's own history, when the header knows whose it is. Null is the ordinary case. */
  readonly self = input<AthleteRecord | null>(null);

  protected readonly plan = this.#plan.asReadonly();

  protected readonly presets = PACE_PLAN_PRESETS;

  /**
   * Ready-made goals for somebody the site recognises, formatted for the buttons.
   *
   * They replace the round presets rather than joining them: «22:00» is a good guess only for a
   * stranger, and a person with three years of Sundays behind them is being asked the wrong
   * question by it.
   */
  protected readonly targets = computed(() =>
    planTargets(this.self()).map((target) => ({ ...target, text: formatDuration(target.finishMs) })),
  );

  /** The closing 2,7 км planned quicker than the opening 2,3 км — the protocol's «Негативный сплит». */
  protected readonly negative = signal(false);

  protected readonly finishText = signal('');

  protected readonly paceText = signal('');

  /** True once a field has been typed into and rejected — silence until then, so an empty card
   * is not scolding anybody for not having started. */
  protected readonly invalid = signal(false);

  protected readonly saving = signal(false);

  /**
   * How much a kilometre of the second lap is quicker than one of the first, or null when there is
   * no split to talk about — no target yet, or an even plan.
   *
   * Shown rather than asked for. The card takes one decision from the visitor — speed up or hold —
   * and answers with the seconds that decision costs and buys, because «на 8 секунд быстрее» is
   * checkable on the run and «индекс 0,97» is not.
   */
  protected readonly legGapText = computed(() => {
    const plan = this.#plan();

    return plan === null || !this.negative() ? null : formatDuration(plan.firstLegPaceMs - plan.secondLegPaceMs);
  });

  /** The map's own view of the plan: metres to clock reading, which is all it needs. */
  protected readonly splits = computed(() => new Map(this.#plan()?.splits.map((split) => [split.meters, formatDuration(split.ms)]) ?? []));

  /** The same readings as a list — the card's own, and the accessible form of a map drawn for
   * screen readers as decoration. */
  protected readonly rows = computed<PacePlanRow[]>(
    () => this.#plan()?.splits.map((split, index) => ({ ...PACE_PLAN_POINTS[index], time: formatDuration(split.ms) })) ?? [],
  );

  constructor() {
    // After the first browser render, never during it: `/` is prerendered without a query string,
    // so adopting `?target=` any earlier would hand hydration a card the static HTML does not have.
    afterNextRender(() => this.#adoptFromUrl());
  }

  protected onFinishInput(value: string): void {
    this.finishText.set(value);

    const plan = this.#adopt(value, planFromFinish);

    this.paceText.set(plan ? formatDuration(plan.paceMs) : '');
    this.#writeUrl();
  }

  protected onPaceInput(value: string): void {
    this.paceText.set(value);

    const plan = this.#adopt(value, planFromPace);

    this.finishText.set(plan ? formatDuration(plan.finishMs) : '');
    this.#writeUrl();
  }

  protected usePreset(preset: string): void {
    this.onFinishInput(preset);
  }

  /**
   * Flips the plan between even pace and a quicker second lap, keeping the target.
   *
   * The pace field is left alone on purpose: it states the average over five kilometres, and that
   * is the same number whichever way the target is spent. Only the readings along the way move.
   */
  protected toggleNegative(): void {
    this.negative.update((on) => !on);

    const plan = this.#plan();

    if (plan !== null) {
      this.#plan.set(planFromFinish(plan.finishMs, this.#index()));
    }

    this.#writeUrl();
  }

  /**
   * Draws the plan as a picture and hands it over.
   *
   * Guarded against a second press rather than debounced: rasterising takes a beat, and on a phone
   * the share sheet takes considerably longer than that — two sheets stacked on one tap is a mess
   * only the operating system can get out of.
   */
  protected async save(): Promise<void> {
    const plan = this.#plan();

    if (!plan || this.saving()) {
      return;
    }

    this.saving.set(true);

    try {
      const poster = buildPlanPoster({
        title: PACE_PLAN_TITLE_TEXT,
        finishText: formatDuration(plan.finishMs),
        paceText: `${formatDuration(plan.paceMs)} ${PACE_PLAN_PER_KM_TEXT}`,
        rows: this.rows(),
        splits: this.splits(),
        footer: PACE_PLAN_FOOTER_TEXT,
        palette: readPalette(this.#document.documentElement),
      });

      await this.#image.save(poster, POSTER_FILE_NAME);
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Reads one field and makes whatever it says the plan.
   *
   * The complaint is tied to the field that was typed into, not to the pair: clearing a field is
   * how you start over, and a card that answered that with «не похоже на время» would be telling
   * people off for backspacing.
   */
  #adopt(value: string, build: (ms: number, index: number) => Plan | null): Plan | null {
    const ms = parseDuration(value);
    const plan = ms === null ? null : build(ms, this.#index());

    this.#plan.set(plan);
    this.invalid.set(plan === null && value.trim() !== '');

    return plan;
  }

  #index(): number {
    return this.negative() ? PACE_PLAN_NEGATIVE_INDEX : PACE_PLAN_EVEN_INDEX;
  }

  /** A shared link opens as the plan it was sent, both fields filled and the toggle where it was. */
  #adoptFromUrl(): void {
    const params = this.#route.snapshot.queryParamMap;

    this.negative.set(params.get(PACE_PLAN_SPLIT_PARAM) === PACE_PLAN_NEGATIVE_SPLIT_VALUE);
    this.onFinishInput(params.get(PACE_PLAN_TARGET_PARAM) ?? '');
  }

  /**
   * Keeps the address bar equal to the card, so sharing a plan is copying the URL.
   *
   * `replaceState`, not a navigation: nothing on the page depends on these parameters after the
   * first read, and a router trip per keystroke would fill the back button with every half-typed
   * target on the way to 22:00.
   */
  #writeUrl(): void {
    const plan = this.#plan();
    const tree = this.#router.createUrlTree([], {
      relativeTo: this.#route,
      queryParams: {
        [PACE_PLAN_TARGET_PARAM]: plan === null ? null : formatDuration(plan.finishMs),
        [PACE_PLAN_SPLIT_PARAM]: plan !== null && this.negative() ? PACE_PLAN_NEGATIVE_SPLIT_VALUE : null,
      },
      queryParamsHandling: 'merge',
    });

    this.#location.replaceState(this.#router.serializeUrl(tree));
  }
}

/**
 * The map's colours as literal values, because a saved picture leaves the page that defines them
 * and a `var(--map-paper)` in a downloaded PNG is simply black.
 */
function readPalette(root: HTMLElement): PosterPalette {
  // Unguarded: this runs from a button press, and a button press means a browser.
  const styles = getComputedStyle(root);
  const read = (token: string): string => {
    // A token that has not resolved reads as the empty string rather than as missing — a
    // stylesheet the page has not applied yet does exactly that — and there is nothing to draw
    // that colour with either way.
    const value = styles.getPropertyValue(token).trim();

    return value === '' ? PACE_PLAN_POSTER_FALLBACK : value;
  };

  return {
    paper: read(PACE_PLAN_POSTER_TOKENS.paper),
    ink: read(PACE_PLAN_POSTER_TOKENS.ink),
    inkSoft: read(PACE_PLAN_POSTER_TOKENS.inkSoft),
    route: read(PACE_PLAN_POSTER_TOKENS.route),
    routeCasing: read(PACE_PLAN_POSTER_TOKENS.routeCasing),
    mark: read(PACE_PLAN_POSTER_TOKENS.mark),
    accent: read(PACE_PLAN_POSTER_TOKENS.accent),
    border: read(PACE_PLAN_POSTER_TOKENS.border),
  };
}
