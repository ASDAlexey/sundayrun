import { COURSE_VIEW_BOX } from '../course-track/course-geometry.constant';
import { POSTER_INPUT_MOCK, POSTER_PALETTE_MOCK } from './plan-poster.mock';
import { POSTER_BALLOON_RADIUS, POSTER_DISC_RING_WIDTH, POSTER_ROW_HEIGHT, POSTER_WIDTH } from './plan-poster.constant';
import { buildPlanPoster } from './plan-poster';

describe('buildPlanPoster', () => {
  const poster = buildPlanPoster(POSTER_INPUT_MOCK);

  it('is a standalone document sized to the phone it will be looked at on', () => {
    expect(poster.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(poster.endsWith('</svg>')).toBe(true);
    expect(poster).toContain(`width="${POSTER_WIDTH}"`);
    expect(poster, 'the course arrives at its own scale, so its coordinates are used unchanged').toContain(`viewBox="${COURSE_VIEW_BOX}"`);
    expect(poster, 'no external file — the picture has to survive a park with no signal').not.toContain('href=');
  });

  it('prints the target, the pace and every row it was given', () => {
    expect(poster).toContain('>22:00<');
    expect(poster).toContain('>4:24 / км<');
    expect(poster).toContain('>круг · 2,3 км<');
    expect(poster).toContain('>Воскресный забег<');
  });

  it('pins each reading to the mark it belongs to, stacking the lap line’s two', () => {
    // 4:24 is a kilometre and appears once as a caption and once in the table; 10:07 and 20:14
    // are the two crossings of the one lap line and both have to be on the map.
    expect(poster.match(/>10:07</g)).toHaveLength(2);
    expect(poster, 'the second crossing is a caption only — the table row for it was not passed').toContain('>20:14<');
  });

  it('grows with the table rather than clipping it', () => {
    const taller = buildPlanPoster({
      ...POSTER_INPUT_MOCK,
      rows: [...POSTER_INPUT_MOCK.rows, { label: '2 км', time: '8:48', lap: false }],
    });

    expect(height(taller) - height(poster)).toBe(POSTER_ROW_HEIGHT);
  });

  it('draws nothing when there is no plan, and escapes whatever text it is handed', () => {
    const bare = buildPlanPoster({ ...POSTER_INPUT_MOCK, rows: [], splits: new Map(), footer: 'A & B <c>' });

    expect(bare).toContain('>A &amp; B &lt;c&gt;<');
    expect(bare, 'no captions without a plan — the map is back to being a map').not.toContain('>10:07<');
    // The lap balloon is drawn and then nothing else is: no `<text>` follows it, only the next
    // circle. A stopwatch glyph would need a font the saved file cannot carry.
    expect(bare, 'and the lap balloon carries no glyph a saved file might not have a font for').toContain(
      `r="${POSTER_BALLOON_RADIUS}" fill="${POSTER_PALETTE_MOCK.mark}" stroke="${POSTER_PALETTE_MOCK.paper}" ` +
        `stroke-width="${POSTER_DISC_RING_WIDTH}"/><circle`,
    );
  });
});

function height(poster: string): number {
  return Number(/height="(\d+(?:\.\d+)?)"/.exec(poster)?.[1]);
}
