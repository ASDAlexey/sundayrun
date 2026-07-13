import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';

import { ProtocolPdfService } from '../../../pdf/protocol-pdf.service';
import { RaceListItem } from '../races-page.interface';

/** One published race as a card: number, date, the dynamics-chart hero, the М/Ж times and protocol links. */
@Component({
  selector: 'app-race-card',
  imports: [MatCardModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './race-card.html',
  styleUrl: './race-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceCard {
  readonly #protocolPdf = inject(ProtocolPdfService);

  readonly race = input.required<RaceListItem>();

  readonly pdfLoading = signal(false);
  readonly pdfFailed = signal(false);

  /** Generates the protocol PDF from the stored data and downloads it, spinning the button meanwhile. */
  async downloadPdf(): Promise<void> {
    if (this.pdfLoading()) {
      return;
    }

    this.pdfLoading.set(true);
    this.pdfFailed.set(false);

    try {
      await this.#protocolPdf.download(this.race().slug);
    } catch {
      this.pdfFailed.set(true);
    } finally {
      this.pdfLoading.set(false);
    }
  }
}
