import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';

import { ProtocolStateService } from '../../state/protocol-state.service';
import { EMPTY_INPUT_VALUE, PREVIEW_ROUTE_COMMANDS, XLSX_EXTENSION, ZONE_ACTIVATION_KEYS } from './upload-page.constant';
import { FileDropEvent, PreventableEvent, ZoneKeyEvent } from './upload-page.interface';

/** The /upload page: accepts a timer xlsx export via drag-drop or a file dialog. */
@Component({
  selector: 'app-upload-page',
  templateUrl: './upload-page.html',
  styleUrl: './upload-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadPage {
  readonly #store = inject(ProtocolStateService);
  readonly #router = inject(Router);

  readonly isDragOver = signal(false);
  readonly hasError = signal(false);
  readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  onDragOver(event: PreventableEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  async onDrop(event: FileDropEvent): Promise<void> {
    event.preventDefault();
    this.isDragOver.set(false);
    await this.#importFile(event.dataTransfer === null ? null : firstFileOf(event.dataTransfer.files));
  }

  openFileDialog(): void {
    this.fileInput().nativeElement.click();
  }

  onZoneKeydown(event: ZoneKeyEvent): void {
    if (ZONE_ACTIVATION_KEYS.includes(event.key)) {
      event.preventDefault();
      this.openFileDialog();
    }
  }

  async onFileSelected(files: ArrayLike<File> | null): Promise<void> {
    await this.#importFile(files === null ? null : firstFileOf(files));
    this.fileInput().nativeElement.value = EMPTY_INPUT_VALUE;
  }

  /** Resets the store first, so a failed import never leaves stale data behind. */
  async #importFile(file: File | null): Promise<void> {
    this.#store.reset();
    this.hasError.set(false);

    if (file === null) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(XLSX_EXTENSION)) {
      this.hasError.set(true);

      return;
    }

    try {
      this.#store.importFile(file.name, new Uint8Array(await file.arrayBuffer()));
      await this.#router.navigate(PREVIEW_ROUTE_COMMANDS);
    } catch {
      this.#store.reset();
      this.hasError.set(true);
    }
  }
}

/** Only the first file of a multi-file drop or selection is taken. */
function firstFileOf(files: ArrayLike<File>): File | null {
  return files.length > 0 ? files[0] : null;
}
