import { DOCUMENT, Component, computed, inject, signal } from '@angular/core';

import { formatDuration, parseDuration } from '../../../core/time/duration';
import { type PacePlan as Plan } from '../../../core/pace/pace-plan.interface';
import { planFromFinish, planFromPace } from '../../../core/pace/pace-plan';
import { CourseTrack } from '../course-track/course-track';
import {
  PACE_PLAN_FOOTER_TEXT,
  PACE_PLAN_POINTS,
  PACE_PLAN_PER_KM_TEXT,
  PACE_PLAN_POSTER_FALLBACK,
  PACE_PLAN_POSTER_TOKENS,
  PACE_PLAN_PRESETS,
  PACE_PLAN_TITLE_TEXT,
} from './pace-plan.constant';
import { type PacePlanRow } from './pace-plan.interface';
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

  readonly #plan = signal<Plan | null>(null);

  protected readonly plan = this.#plan.asReadonly();

  protected readonly presets = PACE_PLAN_PRESETS;

  protected readonly finishText = signal('');

  protected readonly paceText = signal('');

  /** True once a field has been typed into and rejected — silence until then, so an empty card
   * is not scolding anybody for not having started. */
  protected readonly invalid = signal(false);

  protected readonly saving = signal(false);

  /** The map's own view of the plan: metres to clock reading, which is all it needs. */
  protected readonly splits = computed(() => new Map(this.#plan()?.splits.map((split) => [split.meters, formatDuration(split.ms)]) ?? []));

  /** The same readings as a list — the card's own, and the accessible form of a map drawn for
   * screen readers as decoration. */
  protected readonly rows = computed<PacePlanRow[]>(
    () => this.#plan()?.splits.map((split, index) => ({ ...PACE_PLAN_POINTS[index], time: formatDuration(split.ms) })) ?? [],
  );

  protected onFinishInput(value: string): void {
    this.finishText.set(value);

    const plan = this.#adopt(value, planFromFinish);

    this.paceText.set(plan ? formatDuration(plan.paceMs) : '');
  }

  protected onPaceInput(value: string): void {
    this.paceText.set(value);

    const plan = this.#adopt(value, planFromPace);

    this.finishText.set(plan ? formatDuration(plan.finishMs) : '');
  }

  protected usePreset(preset: string): void {
    this.onFinishInput(preset);
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
  #adopt(value: string, build: (ms: number) => Plan | null): Plan | null {
    const ms = parseDuration(value);
    const plan = ms === null ? null : build(ms);

    this.#plan.set(plan);
    this.invalid.set(plan === null && value.trim() !== '');

    return plan;
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
