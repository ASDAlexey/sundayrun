import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ProtocolPdfService } from '../../../pdf/protocol-pdf.service';
import { EXPECTED_RACE_ITEMS } from '../races-page.mock';
import { RaceCard } from './race-card';

describe('RaceCard', () => {
  const download = vi.fn();
  const item = EXPECTED_RACE_ITEMS[0];

  let fixture: ComponentFixture<RaceCard>;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ProtocolPdfService, useValue: { download } }],
    });
    fixture = TestBed.createComponent(RaceCard);
    fixture.componentRef.setInput('race', item);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('spins while generating the protocol for its slug and clears the state when done', async () => {
    download.mockResolvedValue(undefined);

    const card = fixture.componentInstance;
    const pending = card.downloadPdf();

    expect(card.pdfLoading()).toBe(true);

    await pending;

    expect(download).toHaveBeenCalledExactlyOnceWith(item.slug);
    expect(card.pdfLoading()).toBe(false);
    expect(card.pdfFailed()).toBe(false);
  });

  it('ignores a second click while a download is already in flight', async () => {
    let release: () => void = () => undefined;

    download.mockReturnValue(new Promise<void>((resolve) => (release = resolve)));

    const card = fixture.componentInstance;
    const first = card.downloadPdf();

    await card.downloadPdf();
    release();
    await first;

    expect(download).toHaveBeenCalledOnce();
  });

  it('flags the failure and drops the spinner when generation throws', async () => {
    download.mockRejectedValue(new Error('boom'));

    const card = fixture.componentInstance;

    await card.downloadPdf();

    expect(card.pdfFailed()).toBe(true);
    expect(card.pdfLoading()).toBe(false);
  });
});
