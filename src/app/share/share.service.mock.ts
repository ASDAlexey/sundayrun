export const SHARE_FILE_MOCK = new File(['%PDF-mock'], 'protokol-2020-09-20.pdf', { type: 'application/pdf' });

export const SHARE_TITLE_MOCK = 'run #160 & fun';

export const SHARE_TEXT_MOCK = 'line1\nline2';

export const SHARE_RAW_URL_MOCK = 'https://example.com/run?id=1';

export const SHARE_ERROR_MESSAGE = 'share dismissed';

export const CLIPBOARD_ERROR_MESSAGE = 'clipboard denied';

export const EXPECTED_VK_URL = 'https://vk.com/share.php?url=https%3A%2F%2Fexample.com%2Frun%3Fid%3D1&title=run%20%23160%20%26%20fun';

export const EXPECTED_TELEGRAM_URL = 'https://t.me/share/url?url=https%3A%2F%2Fexample.com%2Frun%3Fid%3D1&text=line1%0Aline2';

export const EXPECTED_WHATSAPP_URL = 'https://wa.me/?text=line1%0Aline2';

export const EXPECTED_MAX_URL = 'https://max.ru/:share?text=line1%0Aline2';
