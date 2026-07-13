import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ProtocolDropzone } from './protocol-dropzone/protocol-dropzone';

/** The /upload page: a card around the shared protocol intake zone. */
@Component({
  selector: 'app-upload-page',
  imports: [ProtocolDropzone],
  templateUrl: './upload-page.html',
  styleUrl: './upload-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadPage {}
