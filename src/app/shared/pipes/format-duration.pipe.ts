import { Pipe, PipeTransform } from '@angular/core';

import { formatDuration } from '../../core/time/duration';
import { EMPTY_DURATION_TEXT } from './format-duration.pipe.constant';

/** Renders integer milliseconds as 'm:ss' / 'h:mm:ss'; null (no result) becomes an empty string. */
@Pipe({ name: 'formatDuration' })
export class FormatDurationPipe implements PipeTransform {
  transform(ms: number | null): string {
    return ms === null ? EMPTY_DURATION_TEXT : formatDuration(ms);
  }
}
