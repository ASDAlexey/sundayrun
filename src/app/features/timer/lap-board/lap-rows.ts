import { formatDuration } from '../../../core/time/duration';
import { LapBoardRow } from '../../../core/timer/session-lap-board.interface';
import { FIRST_POSITION, NO_GAP_MS } from '../../../core/timer/timer-session.constant';
import { TimerRunner } from '../../../core/timer/timer-session.interface';
import { TIMER_LAP_GAP_PREFIX, TIMER_LAP_NO_GAP_TEXT, TIMER_LAP_NO_STEPS, TIMER_LAP_ONE_STEP } from './lap-board.constant';
import { TimerLapMark, TimerLapMarkType } from './lap-board.enum';
import { MarkedLapRow, TimerLapRow, TimerLapRowsInput } from './lap-board.interface';
import { unnamedLapText } from './lap-board.text';

/**
 * The live «Первый круг» table as the template renders it.
 *
 * The rows come out in **roster order**, not in the order of the lap, and each one carries the move
 * that takes it to its place. That is the FLIP of the design spec (§4): a runner who overtakes another
 * does not make Angular rebuild the list — the two rows slide past each other while their DOM nodes
 * stay put.
 *
 * The move is counted in **rows**, never in pixels. A line travels `rowSteps` rows and crosses
 * `noteSteps` archive marks; `lap-board.scss` owns what each of those is worth and multiplies them in
 * a `calc()`. So the heights live in exactly one place, the table can be resized in the stylesheet
 * alone, and the whole thing stays a pure function of the session with nothing ever measured.
 */
export function buildLapRows(input: TimerLapRowsInput): TimerLapRow[] {
  const byRunner = new Map(input.board.map((row) => [row.runnerId, row]));
  const named = input.runners.reduce<MarkedLapRow[]>((rows, runner) => {
    const row = byRunner.get(runner.id);

    return row === undefined ? rows : [...rows, { mark: markOf(row, runner, input), row }];
  }, []);

  // The queued times have no place in the roster, so they close the DOM order and travel to their
  // places like everybody else. The archive says nothing about a line with no name on it.
  const queued = input.board.reduce<MarkedLapRow[]>((rows, row) => (row.runnerId === null ? [...rows, { mark: null, row }] : rows), []);
  const flow = [...named, ...queued];

  const byPlace = [...flow].sort((left, right) => left.row.position - right.row.position);
  const placeNotes = cumulativeNotes(byPlace);
  const flowNotes = cumulativeNotes(flow);

  return flow.map((entry, index) => {
    const placeIndex = entry.row.position - FIRST_POSITION;

    return toLapRow(entry, placeIndex - index, placeNotes[placeIndex] - flowNotes[index]);
  });
}

/**
 * A lap under the course record of the runner's gender is the loudest thing the archive can say; a lap
 * under his own best comes next. A newcomer, somebody whose gender is still unknown and anybody the
 * archive holds no first lap for get no mark at all — the split is missing for roughly a third of the
 * archived finishes, and silence is honest.
 */
function markOf(row: LapBoardRow, runner: TimerRunner, input: TimerLapRowsInput): TimerLapMarkType | null {
  const { athleteKey, gender } = runner;

  if (athleteKey === null) {
    return null;
  }

  const record = gender === null ? null : input.courseRecordLapMs[gender];

  if (record !== null && row.lapMs < record) {
    return TimerLapMark.courseRecord;
  }

  const best = input.bestLapMs.get(athleteKey);

  return best !== undefined && row.lapMs < best ? TimerLapMark.personalBest : null;
}

/** How many marked rows of the given order come before every index — the second unit of the move. */
function cumulativeNotes(entries: readonly MarkedLapRow[]): number[] {
  const notes: number[] = [];
  let seen = TIMER_LAP_NO_STEPS;

  for (const entry of entries) {
    notes.push(seen);
    seen += entry.mark === null ? TIMER_LAP_NO_STEPS : TIMER_LAP_ONE_STEP;
  }

  return notes;
}

function toLapRow(entry: MarkedLapRow, rowSteps: number, noteSteps: number): TimerLapRow {
  const { row } = entry;

  return {
    fullName: row.fullName ?? unnamedLapText(),
    gapText: row.gapMs === NO_GAP_MS ? TIMER_LAP_NO_GAP_TEXT : `${TIMER_LAP_GAP_PREFIX}${formatDuration(row.gapMs)}`,
    id: row.splitId,
    mark: entry.mark,
    named: row.fullName !== null,
    moved: rowSteps !== TIMER_LAP_NO_STEPS || noteSteps !== TIMER_LAP_NO_STEPS,
    noteSteps,
    place: row.position,
    rowSteps,
    runnerId: row.runnerId,
    timeText: formatDuration(row.lapMs),
  };
}
