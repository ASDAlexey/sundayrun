import { loadSwiper } from './swiper-loader';
import { SWIPER_REGISTER_MOCK } from './swiper-loader.mock';

vi.mock('swiper/element/bundle', async () => {
  const mock = await import('./swiper-loader.mock');

  return { register: mock.SWIPER_REGISTER_MOCK };
});

describe('loadSwiper', () => {
  it('registers Swiper’s custom elements once and hands every later opening the same promise', async () => {
    const first = loadSwiper();

    expect(loadSwiper(), 'a second opening rides the first import').toBe(first);
    await expect(first).resolves.toBeUndefined();
    expect(SWIPER_REGISTER_MOCK, 'defining the elements twice would throw').toHaveBeenCalledTimes(1);
    await expect(loadSwiper(), 'and the settled latch stays the answer').resolves.toBeUndefined();
    expect(SWIPER_REGISTER_MOCK).toHaveBeenCalledTimes(1);
  });
});
