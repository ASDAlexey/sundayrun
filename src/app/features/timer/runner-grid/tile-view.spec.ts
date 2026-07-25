import { TimerRunnerStage } from '../../../core/timer/timer-session.enum';
import { KUZNETSOV_RUNNER_ID, TIMER_SESSION, TROILIN_RUNNER_ID } from '../../../core/timer/timer-session.mock';
import { TIMER_TILE_EMPTY_TIME } from './runner-grid.constant';
import { VIEW_ORDER, VIEW_TROILIN_GIVEN, VIEW_TROILIN_SURNAME, VIEW_TROILIN_TIME_TEXT } from './runner-grid.mock';
import { buildTimerTileViews, tileTimeText } from './tile-view';

describe('buildTimerTileViews', () => {
  it('draws the frozen order, prints the newest time and skips an id nobody answers to', () => {
    const views = buildTimerTileViews(TIMER_SESSION, VIEW_ORDER, true);

    expect(views.map((view) => view.runner.id)).toEqual([TROILIN_RUNNER_ID, KUZNETSOV_RUNNER_ID]);
    expect(views[0].surname).toBe(VIEW_TROILIN_SURNAME);
    expect(views[0].givenName).toBe(VIEW_TROILIN_GIVEN);
    expect(views[0].timeText).toBe(VIEW_TROILIN_TIME_TEXT);
    expect(views[0].stage).toBe(TimerRunnerStage.finished);
    expect(views[1].timeText, 'nobody has tapped Кузнецов yet').toBe(TIMER_TILE_EMPTY_TIME);
    expect(views[1].stage).toBe(TimerRunnerStage.waitingLap);
  });
});

describe('tileTimeText', () => {
  it('shows the last time recorded, and nothing at all before the first one', () => {
    expect(tileTimeText(TIMER_SESSION, TROILIN_RUNNER_ID)).toBe(VIEW_TROILIN_TIME_TEXT);
    expect(tileTimeText(TIMER_SESSION, KUZNETSOV_RUNNER_ID)).toBe(TIMER_TILE_EMPTY_TIME);
  });
});
