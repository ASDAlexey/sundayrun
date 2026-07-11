import { vi } from 'vitest';

export const PROTOCOL_PDF_INPUT_MOCK = new Blob(['%PDF-1.7'], { type: 'application/pdf' });

export const PROTOCOL_IMAGE_BLOB_MOCK = new Blob(['png-bytes'], { type: 'image/png' });

/** Fractional size on purpose: the service must `Math.ceil` it onto the canvas. */
export const VIEWPORT_MOCK = { width: 100.4, height: 141.2 };

export const GET_VIEWPORT_MOCK = vi.fn(() => VIEWPORT_MOCK);

export const RENDER_MOCK = vi.fn(() => ({ promise: Promise.resolve() }));

export const GET_PAGE_MOCK = vi.fn(() => Promise.resolve({ getViewport: GET_VIEWPORT_MOCK, render: RENDER_MOCK }));

export const GET_DOCUMENT_MOCK = vi.fn(() => ({ promise: Promise.resolve({ getPage: GET_PAGE_MOCK }) }));
