import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

import { RaceListItem } from '../races-page.interface';

/** One published race as a card: number, date, place, participants and protocol links. */
@Component({
  selector: 'app-race-card',
  imports: [MatButtonModule, MatCardModule, RouterLink],
  templateUrl: './race-card.html',
  styleUrl: './race-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceCard {
  readonly race = input.required<RaceListItem>();
}
