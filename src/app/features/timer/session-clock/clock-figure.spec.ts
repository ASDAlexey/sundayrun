import { formatTimerFigure, formatTimerFraction } from './clock-figure';
import { CLOCK_FIGURE_CASES } from './clock-figure.mock';

describe('formatTimerFigure', () => {
  it('keeps MM:SS at a constant width, grows an hour field past sixty minutes and truncates the hundredths', () => {
    expect(CLOCK_FIGURE_CASES.map((sample) => formatTimerFigure(sample.ms))).toEqual(CLOCK_FIGURE_CASES.map((sample) => sample.text));
    expect(CLOCK_FIGURE_CASES.map((sample) => formatTimerFraction(sample.ms))).toEqual(CLOCK_FIGURE_CASES.map((sample) => sample.fraction));
  });
});
