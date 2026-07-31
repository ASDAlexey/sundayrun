import { EventPhoto } from '../../../core/models/event-photo.interface';

/** One thumbnail prepared for the template: the photo plus what the last tile has to say. */
export interface PhotoTileView {
  photo: EventPhoto;
  /** Index into the full list — `markBroken` needs it to drop exactly this photo. */
  index: number;
  /** «+7» on the last visible tile when the post holds more than the strip shows; 0 otherwise. */
  hiddenCount: number;
  /** Position among the live photos — the slide the viewer opens at. */
  livePosition: number;
  /** False while the thumbnail is still on the wire: the frame keeps its sheen until it lands. */
  loaded: boolean;
}

/**
 * What `swiper-container` hands over on `swiperslidechange`: its instance rides in `detail[0]`.
 * The template types a custom element's event as a bare `Event`, so the handler narrows to this.
 */
export type SwiperSlideChangeEvent = CustomEvent<[{ activeIndex: number }]>;
