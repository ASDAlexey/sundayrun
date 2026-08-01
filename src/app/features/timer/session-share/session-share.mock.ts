import { Mock, vi } from 'vitest';

/** The slug of a measurement that already has a page of its own. */
export const SHARE_SLUG = '2026-07-26';

/** Where the message points when the race is published, and where it points before that. */
export const SHARE_RACE_LINK = 'https://asdalexey.github.io/sundayrun/races/2026-07-26';
export const SHARE_SITE_LINK = 'https://asdalexey.github.io/sundayrun';

/** What the stubbed builders hand back — the sheet only has to pass them on to `openWindow`. */
export const SHARE_TELEGRAM_URL = 'https://t.me/share/url?stub';
export const SHARE_MAX_URL = 'https://max.ru/:share?stub';

/** The workbook name of the mocked measurement, as «Мои замеры» spells it. */
export const SHARE_FILE_NAME = 'sundayrun-2026-07-26.xlsx';

/** A transient object url, so the download path never touches a real blob store. */
export const SHARE_OBJECT_URL = 'blob:share';

/** Every method of `ShareService` the sheet can reach, each one a spy the spec reads back. */
export interface ShareServiceMock {
  canShareFile: Mock<(file: File) => boolean>;
  shareFile: Mock<(file: File, title: string, text: string) => Promise<boolean>>;
  copyToClipboard: Mock<(text: string) => Promise<boolean>>;
  buildTelegramShareUrl: Mock<(url: string, text: string) => string>;
  buildMaxShareUrl: Mock<(text: string) => string>;
  openWindow: Mock<(url: string) => void>;
}

export function shareServiceMock(): ShareServiceMock {
  return {
    canShareFile: vi.fn<(file: File) => boolean>().mockReturnValue(true),
    shareFile: vi.fn<(file: File, title: string, text: string) => Promise<boolean>>().mockResolvedValue(true),
    copyToClipboard: vi.fn<(text: string) => Promise<boolean>>().mockResolvedValue(true),
    buildTelegramShareUrl: vi.fn<(url: string, text: string) => string>().mockReturnValue(SHARE_TELEGRAM_URL),
    buildMaxShareUrl: vi.fn<(text: string) => string>().mockReturnValue(SHARE_MAX_URL),
    openWindow: vi.fn<(url: string) => void>(),
  };
}
