/** One draft's generated protocol artifacts, cached so paging between drafts never re-renders the PDF. */
export interface GeneratedProtocol {
  blob: Blob;
  url: string;
  description: string;
  imageBlob: Blob | null;
}
