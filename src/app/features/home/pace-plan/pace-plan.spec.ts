import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/core';

import { PACE_PLAN_METERS } from '../../../core/pace/pace-plan.constant';
import { PACE_PLAN_POINTS, PACE_PLAN_POSTER_FALLBACK } from './pace-plan.constant';
import { POSTER_FILE_NAME } from './plan-poster.constant';
import { PlanImageService } from './plan-image.service';
import { PacePlan } from './pace-plan';

const saveSpy = vi.fn<(svg: string, fileName: string) => Promise<boolean>>();

describe('PACE_PLAN_POINTS', () => {
  it('lists the same points as the plan, in the same order — the card reads them off position', () => {
    expect(PACE_PLAN_POINTS.map((point) => point.meters)).toEqual([...PACE_PLAN_METERS]);
    expect(
      PACE_PLAN_POINTS.filter((point) => point.lap).map((point) => point.meters),
      'both crossings of the one line',
    ).toEqual([2300, 4600]);
  });
});

describe('PacePlan', () => {
  let fixture: ComponentFixture<PacePlan>;

  beforeEach(() => {
    saveSpy.mockReset().mockResolvedValue(true);
    TestBed.overrideProvider(PlanImageService, { useValue: { save: saveSpy } });
    fixture = TestBed.createComponent(PacePlan);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  function type(selector: string, value: string): void {
    const field: HTMLInputElement = fixture.nativeElement.querySelector(selector);

    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  const fields = (): HTMLInputElement[] => [...fixture.nativeElement.querySelectorAll('.pace-plan__input')];
  const rows = (): string[] =>
    [...fixture.nativeElement.querySelectorAll('.pace-plan__split')].map((row: Element) => row.textContent.trim());
  const captions = (): string[] =>
    [...fixture.nativeElement.querySelectorAll('.course-track__caption')].map((node: Element) => node.textContent.trim());

  it('opens on an empty form and a map with no times on it', () => {
    expect(fields().map((field) => field.value)).toEqual(['', '']);
    expect(rows()).toEqual([]);
    expect(captions(), 'until somebody has a target, the map is just the course').toEqual([]);
    expect(fixture.nativeElement.querySelector('.pace-plan__note'), 'and nobody is being told off for not having started').toBeNull();
  });

  it('answers a finish time with the pace, the readings, and the same readings on the map', () => {
    type('.pace-plan__input', '22:00');

    expect(fields()[1].value, 'the other field is the same fact restated').toBe('4:24');
    expect(rows()).toEqual([
      '1 км4:24',
      '2 км8:48',
      'круг · 2,3 км10:07',
      '3 км13:12',
      '4 км17:36',
      'круг · 4,6 км20:14',
      'финиш · 5 км22:00',
    ]);
    expect(captions(), 'both crossings of the lap line, and every kilometre post the course does not have').toEqual([
      '10:07',
      '20:14',
      '8:48',
      '13:12',
      '4:24',
      '17:36',
    ]);
    expect(fixture.nativeElement.querySelector('.course-track__chip-time').textContent, 'the target itself rides the finish chip').toBe(
      '22:00',
    );
  });

  it('reads the pace field just as readily, so neither one is the primary', () => {
    type('.pace-plan__field:last-of-type .pace-plan__input', '4:24');

    expect(fields()[0].value).toBe('22:00');
    expect(rows()).toHaveLength(7);
  });

  it('fills itself in from a preset, which is also how you find out what it does', () => {
    fixture.nativeElement.querySelectorAll('.pace-plan__preset')[1].click();
    fixture.detectChanges();

    expect(fields()[0].value).toBe('25:00');
    expect(fields()[1].value).toBe('5:00');
  });

  it('complains about a typo and goes quiet again when the field is cleared', () => {
    type('.pace-plan__input', '2200');

    expect(fixture.nativeElement.querySelector('.pace-plan__note')).not.toBeNull();
    expect(rows(), 'and shows no plan built on it').toEqual([]);

    type('.pace-plan__input', '');
    expect(fixture.nativeElement.querySelector('.pace-plan__note'), 'backspacing is how you start over').toBeNull();
  });

  it('refuses a target outside the range a five-kilometre plan makes sense in, from either field', () => {
    type('.pace-plan__input', '2200:00');

    expect(rows()).toEqual([]);
    expect(fields()[1].value).toBe('');

    type('.pace-plan__field:last-of-type .pace-plan__input', 'по-быстрому');

    expect(rows(), 'the pace field is held to the same standard as the finish one').toEqual([]);
    expect(fields()[0].value).toBe('');
  });

  it('saves the plan as a picture, once per press', async () => {
    type('.pace-plan__input', '22:00');

    const button = fixture.nativeElement.querySelector('.pace-plan__save');

    button.click();
    button.click();
    await fixture.whenStable();

    expect(saveSpy, 'a second sheet stacked on the first is a mess only the OS can undo').toHaveBeenCalledOnce();
    expect(saveSpy.mock.calls[0][1]).toBe(POSTER_FILE_NAME);
    expect(saveSpy.mock.calls[0][0], 'the poster carries the plan, not a screenshot of the form').toContain('>22:00<');
    expect(saveSpy.mock.calls[0][0]).toContain('>10:07<');
  });

  it('draws the poster in the theme the visitor is looking at, and in ink where a token is silent', async () => {
    const root = TestBed.inject(DOCUMENT).documentElement;

    root.style.setProperty('--map-paper', 'rgb(1, 2, 3)');
    type('.pace-plan__input', '22:00');
    fixture.nativeElement.querySelector('.pace-plan__save').click();
    await fixture.whenStable();
    root.style.removeProperty('--map-paper');

    expect(saveSpy.mock.calls[0][0], 'the page’s own paper, not a guess at it').toContain('fill="rgb(1, 2, 3)"');
    expect(saveSpy.mock.calls[0][0], 'and plain ink for the tokens this runtime resolves to nothing').toContain(
      `fill="${PACE_PLAN_POSTER_FALLBACK}"`,
    );
  });

  it('has nothing to save before there is a plan', async () => {
    expect(fixture.nativeElement.querySelector('.pace-plan__save'), 'the button is not there to be pressed').toBeNull();
  });
});
