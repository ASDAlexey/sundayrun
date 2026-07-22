import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';

import { ProtocolStateService } from '../../../state/protocol-state.service';
import { EMPTY_INPUT_VALUE, PREVIEW_ROUTE_COMMANDS, XLSX_EXTENSION, ZONE_ACTIVATION_KEYS } from './protocol-dropzone.constant';
import { FileDropEvent, PreventableEvent, ZoneKeyEvent } from './protocol-dropzone.interface';

/**
 * The protocol intake zone shared by /upload and /admin: accepts a timer xlsx
 * export via drag-drop or a file dialog and opens /preview on a successful import.
 */
@Component({
  selector: 'app-protocol-dropzone',
  templateUrl: './protocol-dropzone.html',
  styleUrl: './protocol-dropzone.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProtocolDropzone {
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
    await this.#importFiles(event.dataTransfer === null ? [] : toFileArray(event.dataTransfer.files));
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
    await this.#importFiles(files === null ? [] : toFileArray(files));
    this.fileInput().nativeElement.value = EMPTY_INPUT_VALUE;
  }

  /** Resets the store first, so a failed import never leaves stale data behind. All-or-nothing: one bad file fails the whole drop. */
  async #importFiles(files: File[]): Promise<void> {
    this.#store.reset();
    this.hasError.set(false);

    if (files.length === 0) {
      return;
    }

    if (files.some((file) => !file.name.toLowerCase().endsWith(XLSX_EXTENSION))) {
      this.hasError.set(true);

      return;
    }

    try {
      const sources = await Promise.all(files.map(async (file) => ({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) })));

      this.#store.importFiles(sources);
      await this.#router.navigate(PREVIEW_ROUTE_COMMANDS);
    } catch {
      this.#store.reset();
      this.hasError.set(true);
    }
  }
}

function toFileArray(files: ArrayLike<File>): File[] {
  return Array.from(files);
}
