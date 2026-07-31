/** One photograph of an event's wall post, as `event_photo` stores it. */
export interface EventPhoto {
  /** The thumbnail the protocol's strip renders — a VK CDN url, fetched and cached by the browser. */
  previewUrl: string;
  /** The rendition the viewer opens; same CDN, one size up. */
  largeUrl: string;
  /** The permanent `vk.com/photo…` page — the escape hatch when a signed CDN url stops resolving. */
  photoUrl: string;
}
