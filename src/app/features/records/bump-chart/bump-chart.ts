import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ATHLETES_PAGE_LINK } from '../../../app.constant';
import { SeasonPositionLine, SeasonPositions } from '../../../core/history/season-positions.interface';
import { formatDuration } from '../../../core/time/duration';
import { formatRussianDateLong } from '../../../core/time/russian-date';
import { RUSSIAN_MONTHS_SHORT } from '../../../core/time/russian-date.constant';
import {
  BUMP_DOT_HIT_RADIUS,
  BUMP_DOT_RADIUS,
  BUMP_NAME_GAP,
  BUMP_NAME_WIDTH,
  BUMP_PAD_BOTTOM,
  BUMP_PAD_LEFT,
  BUMP_PAD_TOP,
  BUMP_PALETTE_SIZE,
  BUMP_RANK_GAP,
  BUMP_ROW_HEIGHT,
  BUMP_STEP_X,
  BUMP_TICK_OFFSET,
  BUMP_TOOLTIP_FLIP_Y,
  BUMP_TOOLTIP_MIN_X,
  BUMP_TOOLTIP_OFFSET,
  ISO_DAY_START,
  ISO_MONTH_END,
  ISO_MONTH_START,
} from './bump-chart.constant';
import { BumpChartView, BumpDotView, BumpLineView, BumpRowView, BumpTooltipView } from './bump-chart.interface';

/**
 * The standings race as an SVG bump chart: one line per ranked athlete, one column per event,
 * the row = the standings position after that event. Hovering a line (or its name) dims the rest
 * and floats the name at the cursor, hovering a dot pins a tooltip with the athlete, the date,
 * the position and the season best — the right-edge names scroll away on long seasons, the
 * tooltip does not. The `highlighted` keys (the page's «find yourself» picks) keep their lines
 * lit while everything else fades. The names are links to the athlete pages. The chart scrolls
 * horizontally on long seasons — the geometry is fixed-step, never squeezed.
 */
@Component({
  selector: 'app-bump-chart',
  imports: [RouterLink],
  templateUrl: './bump-chart.html',
  styleUrl: './bump-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BumpChart {
  // The geometry depends on the data alone, so a hover or a pick never re-plots the paths.
  readonly #geometry = computed(() => toChartView(this.data()));

  readonly data = input.required<SeasonPositions>();
  readonly highlighted = input<readonly string[]>([]);
  readonly hovered = signal<string | null>(null);
  readonly tooltip = signal<BumpTooltipView | null>(null);
  readonly view = computed(() => withStates(this.#geometry(), this.hovered(), this.highlighted()));

  protected readonly dotRadius = BUMP_DOT_RADIUS;
  protected readonly dotHitRadius = BUMP_DOT_HIT_RADIUS;

  onHover(key: string | null): void {
    this.hovered.set(key);

    if (key === null) {
      this.tooltip.set(null);
    }
  }

  /** A between-the-dots line hover floats the bare name at the cursor, in canvas coordinates. */
  onLineMove(line: BumpLineView, event: MouseEvent): void {
    const svg = event.currentTarget instanceof Element ? event.currentTarget.closest('svg') : null;

    if (svg === null) {
      return;
    }

    const rect = svg.getBoundingClientRect();

    this.tooltip.set(toTooltip(line, event.clientX - rect.left, event.clientY - rect.top, null));
  }

  onDotEnter(line: BumpLineView, dot: BumpDotView): void {
    this.tooltip.set(toTooltip(line, dot.x, dot.y, dot.label));
  }

  onDotLeave(): void {
    this.tooltip.set(null);
  }
}

/** The shared tooltip placement: clamped off the left edge, flipped below near the top. */
function toTooltip(line: BumpLineView, x: number, y: number, label: string | null): BumpTooltipView {
  const below = y < BUMP_TOOLTIP_FLIP_Y;

  return {
    x: Math.max(x, BUMP_TOOLTIP_MIN_X),
    y: below ? y + BUMP_TOOLTIP_OFFSET : y - BUMP_TOOLTIP_OFFSET,
    below,
    name: line.displayName,
    label,
    colorVar: line.colorVar,
  };
}

/** The hover/pick overlay: the hovered line wins, otherwise the picked set keeps its lines lit. */
function withStates(geometry: BumpChartView, hovered: string | null, highlighted: readonly string[]): BumpChartView {
  if (hovered === null && highlighted.length === 0) {
    return geometry;
  }

  const lit = hovered === null ? new Set(highlighted) : new Set([hovered]);
  const lines = geometry.lines.map((line) => ({ ...line, active: lit.has(line.key), dimmed: !lit.has(line.key) }));

  // Light up the left-gutter place of every lit line, in that line's colour, so «which place
  // am I on now» reads at a glance against the tangle of lines.
  const activePlaces = new Map(lines.filter((line) => line.active).map((line) => [line.finalPlace, line.colorVar]));

  return {
    ...geometry,
    rows: geometry.rows.map((row) => {
      const colorVar = activePlaces.get(row.place);

      return colorVar === undefined ? row : { ...row, active: true, colorVar };
    }),
    lines,
  };
}

function toChartView(data: SeasonPositions): BumpChartView {
  const rows = buildRows(data.rankedCount);
  const lastX = eventX(Math.max(data.eventDates.length - 1, 0));
  const plotBottom = BUMP_PAD_TOP + rows.length * BUMP_ROW_HEIGHT;
  const nameX = lastX + BUMP_NAME_GAP;

  return {
    width: nameX + BUMP_NAME_WIDTH,
    height: plotBottom + BUMP_PAD_BOTTOM,
    gridX1: BUMP_PAD_LEFT,
    gridX2: lastX,
    rankX: BUMP_PAD_LEFT - BUMP_RANK_GAP,
    tickY: plotBottom + BUMP_TICK_OFFSET,
    nameX,
    ticks: data.eventDates.map((dateIso, index) => ({ x: eventX(index), label: tickLabel(dateIso) })),
    rows,
    lines: data.lines.map((line, index) => toLineView(line, index, data.eventDates)),
  };
}

/** Rank rows 1..N — one per ranked athlete, so everyone fits on the chart. */
function buildRows(rowCount: number): BumpRowView[] {
  return Array.from({ length: rowCount }, (_, index) => ({
    y: rowY(index + 1),
    label: `${index + 1}`,
    place: index + 1,
    active: false,
    colorVar: null,
  }));
}

function toLineView(line: SeasonPositionLine, index: number, eventDates: string[]): BumpLineView {
  const dots = line.points.flatMap<BumpDotView>((point, eventIndex) => {
    if (point === null) {
      return [];
    }

    return [
      {
        x: eventX(eventIndex),
        y: rowY(point.position),
        label: `${formatRussianDateLong(eventDates[eventIndex])} · №${point.position} · ${formatDuration(point.bestMs)}`,
      },
    ];
  });

  return {
    key: line.key,
    displayName: line.displayName,
    athleteLink: [ATHLETES_PAGE_LINK, line.key],
    colorVar: `var(--chart-${(index % BUMP_PALETTE_SIZE) + 1})`,
    path: toPath(dots),
    dots,
    finalPlace: index + 1,
    labelY: rowY(index + 1),
    active: false,
    dimmed: false,
  };
}

/** A smooth step curve: every segment eases through the horizontal midpoint of its columns. */
function toPath(dots: BumpDotView[]): string {
  return dots
    .map((dot, index) => {
      if (index === 0) {
        return `M${dot.x} ${dot.y}`;
      }

      const previous = dots[index - 1];
      const midX = (previous.x + dot.x) / 2;

      return `C${midX} ${previous.y} ${midX} ${dot.y} ${dot.x} ${dot.y}`;
    })
    .join(' ');
}

function eventX(index: number): number {
  return BUMP_PAD_LEFT + index * BUMP_STEP_X;
}

function rowY(row: number): number {
  return BUMP_PAD_TOP + (row - 0.5) * BUMP_ROW_HEIGHT;
}

/** '2025-04-06' → '6 апр' — compact enough for the fixed column step. */
function tickLabel(dateIso: string): string {
  return `${Number(dateIso.slice(ISO_DAY_START))} ${RUSSIAN_MONTHS_SHORT[Number(dateIso.slice(ISO_MONTH_START, ISO_MONTH_END)) - 1]}`;
}
