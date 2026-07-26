import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COURSE_RUN_PATH } from './course-geometry.constant';
import { COURSE_TOTAL_METERS } from './course-track.constant';
import { CourseTrack } from './course-track';

describe('CourseTrack', () => {
  let fixture: ComponentFixture<CourseTrack>;

  afterEach(() => fixture.destroy());

  it('shows the whole course at rest and plays a run on demand', async () => {
    fixture = TestBed.createComponent(CourseTrack);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const root = host.querySelector<HTMLElement>('.course-track');
    const play = host.querySelector<HTMLButtonElement>('.course-track__play');

    expect(host.querySelector('.course-track__alleys'), "the park's own paths sit under the route").not.toBeNull();
    expect(host.querySelectorAll('.course-track__base'), 'two big laps and the short one').toHaveLength(3);
    // Three ribbons, each drawn twice: an orange body and the yellow core inside it.
    expect(host.querySelectorAll('.course-track__trace')).toHaveLength(6);

    expect(host.querySelector('.course-track__meters-static')?.textContent, 'the declared 5 km, never what the GPS measured').toBe(
      String(COURSE_TOTAL_METERS),
    );

    // Wayfinding, and the reason anyone opens the map: where to stand, where the line is, which
    // way round it goes. The lap balloon has to be off the start disc or one of them is a rumour.
    expect(host.querySelector('.course-track__point_start'), 'the start is a disc of its own').not.toBeNull();
    expect(host.querySelector('.course-track__point_finish')?.getAttribute('fill'), 'the finish wears the chequer').toBe(
      'url(#course-finish-check)',
    );
    expect(host.querySelector('.course-track__meeting-arrow'), 'the bars point at the line').not.toBeNull();
    expect(host.querySelectorAll('.course-track__arrow').length, 'and the route says which way round').toBeGreaterThan(0);

    const lapBalloon = host.querySelector<SVGCircleElement>('.course-track__mark_lap .course-track__balloon');
    const startDisc = host.querySelector<SVGCircleElement>('.course-track__point_start');
    const apart = Math.hypot(
      Number(lapBalloon?.getAttribute('cx')) - Number(startDisc?.getAttribute('cx')),
      Number(lapBalloon?.getAttribute('cy')) - Number(startDisc?.getAttribute('cy')),
    );

    expect(apart, 'the split balloon sits beside the start, not under it').toBeGreaterThan(
      Number(lapBalloon?.getAttribute('r')) + Number(startDisc?.getAttribute('r')),
    );

    expect(root?.classList.contains('course-track_playing'), 'nothing moves until asked').toBe(false);
    expect(play?.textContent?.trim()).toBe('Посмотреть, как по ней бежать');

    play?.click();
    fixture.detectChanges();

    expect(root?.classList.contains('course-track_playing')).toBe(true);
    expect(root?.classList.contains('course-track_take-b'), 'a fresh take, so the keyframes restart').toBe(true);

    const runner = host.querySelector<SVGCircleElement>('.course-track__runner');

    expect(runner?.style.offsetPath, "the marker's route reaches CSS as a value").toContain(COURSE_RUN_PATH.slice(0, 24));

    runner?.dispatchEvent(new Event('animationend'));
    fixture.detectChanges();

    expect(root?.classList.contains('course-track_playing'), 'the finished picture is the resting one').toBe(false);
    expect(host.querySelector('.course-track__play')?.textContent?.trim(), 'and the button offers another run').toBe('Ещё раз');
  });
});
