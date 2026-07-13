import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BumpChart } from './bump-chart';
import {
  BUMP_DATA,
  BUMP_SMALL_DATA,
  EXPECTED_BOTTOM_LINE_TOOLTIP,
  EXPECTED_BUMP_VIEW,
  EXPECTED_LINE_TOOLTIP,
  EXPECTED_SMALL_PATH,
  EXPECTED_TOP_TOOLTIP,
  HIGHLIGHTED_KEYS,
  HOVERED_KEY,
  LINE_MOVE_BOTTOM_CLIENT_Y,
  LINE_MOVE_CLIENT_X,
  LINE_MOVE_CLIENT_Y,
} from './bump-chart.mock';

describe('BumpChart', () => {
  let fixture: ComponentFixture<BumpChart>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(BumpChart);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('precomputes the whole geometry, dims the rest on hover or around the picked keys', () => {
    fixture.componentRef.setInput('data', BUMP_DATA);

    expect(fixture.componentInstance.view()).toEqual(EXPECTED_BUMP_VIEW);

    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelectorAll('.bump-chart__line').length).toBe(2);
    expect(element.querySelectorAll('.bump-chart__name').length, 'every line carries a right-edge name link').toBe(2);

    fixture.componentInstance.onHover(HOVERED_KEY);
    fixture.detectChanges();

    const [leader, chaser] = element.querySelectorAll('.bump-chart__line');

    expect(leader.classList.contains('bump-chart__line_active')).toBe(true);
    expect(chaser.classList.contains('bump-chart__line_dimmed')).toBe(true);
    expect(element.querySelectorAll(`.bump-chart__name_dimmed`).length, 'the other name dims along with its line').toBe(1);

    fixture.componentInstance.onHover(null);
    fixture.detectChanges();

    expect(element.querySelector('.bump-chart__line_dimmed'), 'leaving the line restores everyone').toBeNull();

    fixture.componentRef.setInput('highlighted', HIGHLIGHTED_KEYS);
    fixture.detectChanges();

    expect(leader.classList.contains('bump-chart__line_dimmed'), 'a pick dims everyone outside the set').toBe(true);
    expect(chaser.classList.contains('bump-chart__line_active')).toBe(true);

    fixture.componentInstance.onHover(HOVERED_KEY);
    fixture.detectChanges();

    expect(leader.classList.contains('bump-chart__line_active'), 'the hover outranks the picked set').toBe(true);
    expect(chaser.classList.contains('bump-chart__line_dimmed')).toBe(true);

    fixture.componentRef.setInput('highlighted', []);
    fixture.componentInstance.onHover(null);
  });

  it('pins a dot tooltip with the date, position and time, floats the bare name on a line hover', () => {
    fixture.componentRef.setInput('data', BUMP_DATA);

    const page = fixture.componentInstance;
    const [leaderLine] = page.view().lines;

    page.onDotEnter(leaderLine, leaderLine.dots[0]);

    expect(page.tooltip(), 'a top-row dot flips the tooltip below and clamps x off the left edge').toEqual(EXPECTED_TOP_TOOLTIP);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const tooltip = element.querySelector('.bump-chart__tooltip');

    expect(tooltip?.classList.contains('bump-chart__tooltip_below')).toBe(true);
    expect(tooltip?.textContent).toContain(EXPECTED_TOP_TOOLTIP.name);
    expect(tooltip?.textContent).toContain(EXPECTED_TOP_TOOLTIP.label);
    expect(element.querySelectorAll('.bump-chart__dot-hit').length, 'every dot carries an invisible hover target').toBe(5);

    page.onDotLeave();
    fixture.detectChanges();

    expect(element.querySelector('.bump-chart__tooltip'), 'leaving the dot hides the tooltip').toBeNull();

    element
      .querySelector('.bump-chart__hit')
      ?.dispatchEvent(new MouseEvent('mousemove', { clientX: LINE_MOVE_CLIENT_X, clientY: LINE_MOVE_CLIENT_Y }));

    expect(page.tooltip(), 'a between-the-dots hover shows the name at the cursor').toEqual(EXPECTED_LINE_TOOLTIP);

    fixture.detectChanges();

    expect(element.querySelector('.bump-chart__tooltip-label'), 'the name-only tooltip has no date row').toBeNull();

    element
      .querySelector('.bump-chart__hit')
      ?.dispatchEvent(new MouseEvent('mousemove', { clientX: LINE_MOVE_CLIENT_X, clientY: LINE_MOVE_BOTTOM_CLIENT_Y }));

    expect(page.tooltip(), 'past the flip line the tooltip stays above the cursor').toEqual(EXPECTED_BOTTOM_LINE_TOOLTIP);

    page.onLineMove(page.view().lines[0], new MouseEvent('mousemove'));

    expect(page.tooltip(), 'a synthetic event without a target leaves the tooltip alone').toEqual(EXPECTED_BOTTOM_LINE_TOOLTIP);

    page.onHover(null);
    fixture.detectChanges();

    expect(element.querySelector('.bump-chart__tooltip'), 'leaving the line clears the floating name').toBeNull();
  });

  it('sizes the rank gutter to the full ranked field and draws a dot-only path for a single event', () => {
    fixture.componentRef.setInput('data', BUMP_SMALL_DATA);

    const view = fixture.componentInstance.view();

    expect(view.rows.length, 'the gutter ranks the whole field, not only the drawn lines').toBe(2);
    expect(view.lines[0].path).toBe(EXPECTED_SMALL_PATH);
  });
});
