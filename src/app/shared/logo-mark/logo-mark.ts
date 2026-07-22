import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The site's own brand mark: the course's two laps drawn as two broken rings with the start
 * point in the opening — a route, a stopwatch and a finish target at once. The rings follow
 * `currentColor` so the context picks the ink; the start dot is always the signature accent.
 */
@Component({
  selector: 'app-logo-mark',
  templateUrl: './logo-mark.html',
  styleUrl: './logo-mark.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoMark {}
