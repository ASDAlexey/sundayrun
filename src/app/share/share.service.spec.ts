import { TestBed } from '@angular/core/testing';

import { SHARE_WINDOW_TARGET } from './share-urls.constant';
import { ShareService } from './share.service';
import {
  CLIPBOARD_ERROR_MESSAGE,
  EXPECTED_MAX_URL,
  EXPECTED_TELEGRAM_URL,
  EXPECTED_VK_URL,
  EXPECTED_WHATSAPP_URL,
  SHARE_ERROR_MESSAGE,
  SHARE_FILE_MOCK,
  SHARE_RAW_URL_MOCK,
  SHARE_TEXT_MOCK,
  SHARE_TITLE_MOCK,
} from './share.service.mock';

describe('ShareService', () => {
  let service: ShareService;

  beforeEach(() => {
    service = TestBed.inject(ShareService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('canShareFile delegates to navigator.canShare and falls back to false without the API', () => {
    const canShare = vi.fn(() => true);

    vi.stubGlobal('navigator', { canShare });

    expect(service.canShareFile(SHARE_FILE_MOCK)).toBe(true);
    expect(canShare).toHaveBeenCalledWith({ files: [SHARE_FILE_MOCK] });

    vi.stubGlobal('navigator', {});

    expect(service.canShareFile(SHARE_FILE_MOCK)).toBe(false);
  });

  it('shareFile resolves true on success and false when rejected or unavailable', async () => {
    const share = vi.fn(() => Promise.resolve());

    vi.stubGlobal('navigator', { share });

    await expect(service.shareFile(SHARE_FILE_MOCK, SHARE_TITLE_MOCK, SHARE_TEXT_MOCK)).resolves.toBe(true);
    expect(share).toHaveBeenCalledWith({ files: [SHARE_FILE_MOCK], title: SHARE_TITLE_MOCK, text: SHARE_TEXT_MOCK });

    share.mockRejectedValueOnce(new Error(SHARE_ERROR_MESSAGE));

    await expect(service.shareFile(SHARE_FILE_MOCK, SHARE_TITLE_MOCK, SHARE_TEXT_MOCK)).resolves.toBe(false);

    vi.stubGlobal('navigator', {});

    await expect(service.shareFile(SHARE_FILE_MOCK, SHARE_TITLE_MOCK, SHARE_TEXT_MOCK)).resolves.toBe(false);
  });

  it('copyToClipboard resolves true on success and false when denied or unavailable', async () => {
    const writeText = vi.fn(() => Promise.resolve());

    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(service.copyToClipboard(SHARE_TEXT_MOCK)).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith(SHARE_TEXT_MOCK);

    writeText.mockRejectedValueOnce(new Error(CLIPBOARD_ERROR_MESSAGE));

    await expect(service.copyToClipboard(SHARE_TEXT_MOCK)).resolves.toBe(false);

    vi.stubGlobal('navigator', {});

    await expect(service.copyToClipboard(SHARE_TEXT_MOCK)).resolves.toBe(false);
  });

  it('builds encoded share urls and opens windows via the global open', () => {
    expect(service.buildVkShareUrl(SHARE_RAW_URL_MOCK, SHARE_TITLE_MOCK)).toBe(EXPECTED_VK_URL);
    expect(service.buildTelegramShareUrl(SHARE_RAW_URL_MOCK, SHARE_TEXT_MOCK)).toBe(EXPECTED_TELEGRAM_URL);
    expect(service.buildWhatsappShareUrl(SHARE_TEXT_MOCK)).toBe(EXPECTED_WHATSAPP_URL);
    expect(service.buildMaxShareUrl(SHARE_TEXT_MOCK)).toBe(EXPECTED_MAX_URL);

    const open = vi.fn();

    vi.stubGlobal('open', open);
    service.openWindow(EXPECTED_VK_URL);

    expect(open).toHaveBeenCalledWith(EXPECTED_VK_URL, SHARE_WINDOW_TARGET);
  });
});
