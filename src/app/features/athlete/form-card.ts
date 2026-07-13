import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { athleteForm } from '../../core/history/form';
import { FORM_WINDOW_SIZE, PEAK_PERCENT } from '../../core/history/form.constant';
import { AthleteForm, FormPoint } from '../../core/history/form.interface';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateLong, formatRussianMonthPrepositional } from '../../core/time/russian-date';
import {
  COORD_TENTHS_BASE,
  FORM_CHART_HEIGHT,
  FORM_CHART_PAD,
  FORM_CHART_WIDTH,
  TOOLTIP_BELOW_MAX_TOP_PERCENT,
  TOOLTIP_EDGE_PERCENT,
} from './form-card.constant';
import { FormChartDot, FormChartPoint, FormTooltipAlign, FormView } from './form-card.interface';

/**
 * The «Форма» card: the rolling median of the last five 5 km finishes against the athlete's
 * best-ever window — «сейчас — 94% от пика», the peak month, and the whole curve as a sparkline.
 * Fewer finishes than one window hide the card entirely.
 */
@Component({
  selector: 'app-form-card',
  templateUrl: './form-card.html',
  styleUrl: './form-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormCard {
  /** The athlete's full 5 km history; the order never matters. */
  readonly runs = input.required<AthleteRun[]>();
  /** The archive's newest event day — a newest finish older than 90 days from it goes «stale». */
  readonly anchorIso = input.required<string>();
  readonly view = computed(() => toFormView(athleteForm(this.runs(), this.anchorIso())));

  protected readonly formWindowSize = FORM_WINDOW_SIZE;
  protected readonly chartViewBox = `0 0 ${FORM_CHART_WIDTH} ${FORM_CHART_HEIGHT}`;
}

function toFormView(form: AthleteForm | null): FormView | null {
  if (form === null) {
    return null;
  }

  const dots = toDots(form.points);
  const peakIndex = form.points.indexOf(form.peak);
  const lastIndex = form.points.length - 1;
  const points: FormChartPoint[] = dots.map((dot, index) => ({
    ...dot,
    tooltip: pointTooltip(form.points[index]),
    isPeak: index === peakIndex,
    isCurrent: index === lastIndex,
  }));

  return {
    currentPercent: form.current.percent,
    // A stale athlete never «cheers»: the break outweighs a last window that happened to top out.
    isAtPeak: !form.isStale && form.current.percent === PEAK_PERCENT,
    isStale: form.isStale,
    peakMonthText: formatRussianMonthPrepositional(form.peak.dateIso),
    linePoints: dots.map((dot) => `${dot.x},${dot.y}`).join(' '),
    points,
  };
}

/** «3 авг 2025 · 30:00 · 80%» — the window's end date, its median time and its percent of the peak. */
function pointTooltip(point: FormPoint): string {
  return `${formatRussianDateCompact(point.dateIso)} · ${formatDuration(point.medianMs)} · ${point.percent}%`;
}

/** Windows spread evenly along the x axis; y spans the seen percent range, so the curve always fills the box. */
function toDots(points: FormPoint[]): FormChartDot[] {
  const lowestPercent = Math.min(...points.map((point) => point.percent));
  const percentSpan = PEAK_PERCENT - lowestPercent;
  const step = points.length === 1 ? 0 : (FORM_CHART_WIDTH - 2 * FORM_CHART_PAD) / (points.length - 1);

  return points.map((point, index) => ({
    // A single window sits in the middle; a flat all-peak curve rests on the centre line, not the edge.
    x: roundCoord(points.length === 1 ? FORM_CHART_WIDTH / 2 : FORM_CHART_PAD + index * step),
    y: roundCoord(
      percentSpan === 0
        ? FORM_CHART_HEIGHT / 2
        : FORM_CHART_PAD + ((PEAK_PERCENT - point.percent) * (FORM_CHART_HEIGHT - 2 * FORM_CHART_PAD)) / percentSpan,
    ),
  }));
}

function roundCoord(value: number): number {
  return Math.round(value * COORD_TENTHS_BASE) / COORD_TENTHS_BASE;
}
