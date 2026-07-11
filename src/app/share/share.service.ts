import { Injectable } from '@angular/core';

import {
  MAX_SHARE_URL_BASE,
  SHARE_WINDOW_TARGET,
  TELEGRAM_SHARE_TEXT_PARAM,
  TELEGRAM_SHARE_URL_BASE,
  VK_SHARE_TITLE_PARAM,
  VK_SHARE_URL_BASE,
  WHATSAPP_SHARE_URL_BASE,
} from './share-urls.constant';

/** Thin wrapper over the Web Share / Clipboard APIs and the social share URL templates. */
@Injectable({ providedIn: 'root' })
export class ShareService {
  canShareFile(file: File): boolean {
    return this.canShareFiles([file]);
  }

  canShareFiles(files: File[]): boolean {
    return this.#nav.canShare?.({ files }) ?? false;
  }

  /** False when the API is unavailable or the user dismissed the share sheet. */
  async shareFile(file: File, title: string, text: string): Promise<boolean> {
    return this.shareFiles([file], title, text);
  }

  /** Shares several files at once (e.g. the protocol image plus a run photo) through one sheet. */
  async shareFiles(files: File[], title: string, text: string): Promise<boolean> {
    try {
      await this.#nav.share({ files, title, text });

      return true;
    } catch {
      return false;
    }
  }

  /** False when the Clipboard API is unavailable or the write was denied. */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await this.#nav.clipboard.writeText(text);

      return true;
    } catch {
      return false;
    }
  }

  buildVkShareUrl(url: string, title: string): string {
    return `${VK_SHARE_URL_BASE}${encodeURIComponent(url)}${VK_SHARE_TITLE_PARAM}${encodeURIComponent(title)}`;
  }

  buildTelegramShareUrl(url: string, text: string): string {
    return `${TELEGRAM_SHARE_URL_BASE}${encodeURIComponent(url)}${TELEGRAM_SHARE_TEXT_PARAM}${encodeURIComponent(text)}`;
  }

  buildWhatsappShareUrl(text: string): string {
    return `${WHATSAPP_SHARE_URL_BASE}${encodeURIComponent(text)}`;
  }

  buildMaxShareUrl(text: string): string {
    return `${MAX_SHARE_URL_BASE}${encodeURIComponent(text)}`;
  }

  openWindow(url: string): void {
    globalThis.open(url, SHARE_WINDOW_TARGET);
  }

  /** Live navigator access, so specs can stub the global per scenario. */
  get #nav(): Navigator {
    return navigator;
  }
}
