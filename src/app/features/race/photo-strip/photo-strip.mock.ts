import { EventPhoto } from '../../../core/models/event-photo.interface';
import { PHOTO_STRIP_VISIBLE_COUNT } from './photo-strip.constant';

/** Eight photographs — five more than the strip shows, so the «+N» counter has something to say. */
export const PHOTO_STRIP_PHOTOS: EventPhoto[] = Array.from({ length: 8 }, (_, index) => ({
  previewUrl: `https://sun9-1.userapi.com/impg/preview-${index}.jpg`,
  largeUrl: `https://sun9-1.userapi.com/impg/large-${index}.jpg`,
  photoUrl: `https://vk.com/photo-141369129_45724355${index}`,
}));

/** `PHOTO_STRIP_PHOTOS` minus the three tiles the strip renders. */
export const PHOTO_STRIP_EXPECTED_HIDDEN_COUNT = PHOTO_STRIP_PHOTOS.length - PHOTO_STRIP_VISIBLE_COUNT;

export const PHOTO_STRIP_POST_URL = 'https://vk.com/wall-141369129_1109';

/** A single photograph: the strip has nothing to collapse into a counter. */
export const PHOTO_STRIP_SINGLE_PHOTO: EventPhoto[] = [PHOTO_STRIP_PHOTOS[0]];

/** What `swiper-container` emits after a swipe: its instance rides in `detail[0]`. */
export const slideChangeEvent = (activeIndex: number): CustomEvent => new CustomEvent('swiperslidechange', { detail: [{ activeIndex }] });
