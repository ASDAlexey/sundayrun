import { TestBed } from '@angular/core/testing';

import { FormatDurationPipe } from './format-duration.pipe';
import { EMPTY_DURATION_TEXT } from './format-duration.pipe.constant';
import { SAMPLE_MS, SAMPLE_TEXT } from './format-duration.pipe.mock';

describe('FormatDurationPipe', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FormatDurationPipe] });
  });

  it('formats milliseconds and maps null to an empty string', () => {
    const pipe = TestBed.inject(FormatDurationPipe);

    expect(pipe.transform(SAMPLE_MS)).toBe(SAMPLE_TEXT);
    expect(pipe.transform(null)).toBe(EMPTY_DURATION_TEXT);
  });
});
