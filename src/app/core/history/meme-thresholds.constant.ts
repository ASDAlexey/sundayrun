import { MemeThreshold } from './meme-thresholds.interface';

/**
 * The meme ladder, fastest first. Track benchmarks are real 5000 m results; marathon benchmarks
 * are the runner's best marathon pace held over 5 km (time × 5 / 42.195, rounded to a second) —
 * the classic «beat Oprah» yardstick. The hippo caps the ladder so even the course record chases
 * something.
 */
export const MEME_THRESHOLDS: readonly MemeThreshold[] = [
  {
    key: 'hippo',
    name: $localize`:@@memes.hippoName:Бегемот на рывке`,
    note: $localize`:@@memes.hippoNote:разгоняется до 30 км/ч — правда, ненадолго`,
    timeMs: 600000,
  },
  {
    key: 'cheptegei',
    name: $localize`:@@memes.cheptegeiName:Джошуа Чептегей`,
    note: $localize`:@@memes.cheptegeiNote:мировой рекорд на 5000 м — 12:35.36 (Монако, 2020)`,
    timeMs: 755360,
  },
  {
    key: 'tsegay',
    name: $localize`:@@memes.tsegayName:Гудаф Цегай`,
    note: $localize`:@@memes.tsegayNote:мировой рекорд на 5000 м среди женщин — 14:00.21 (Юджин, 2023)`,
    timeMs: 840210,
  },
  {
    key: 'kiptum',
    name: $localize`:@@memes.kiptumName:Кельвин Киптум`,
    note: $localize`:@@memes.kiptumNote:темп его мирового рекорда в марафоне — 2:00:35 (Чикаго, 2023)`,
    timeMs: 857000,
  },
  {
    key: 'ramsay',
    name: $localize`:@@memes.ramsayName:Гордон Рамзи`,
    note: $localize`:@@memes.ramsayNote:темп его марафона 3:30:37 (Лондон, 2004)`,
    timeMs: 1497000,
  },
  {
    key: 'bush',
    name: $localize`:@@memes.bushName:Джордж Буш-младший`,
    note: $localize`:@@memes.bushNote:темп его марафона 3:44:52 (Хьюстон, 1993)`,
    timeMs: 1599000,
  },
  {
    key: 'ferrell',
    name: $localize`:@@memes.ferrellName:Уилл Феррелл`,
    note: $localize`:@@memes.ferrellNote:темп его марафона 3:56:12 (Бостон, 2003)`,
    timeMs: 1679000,
  },
  {
    key: 'oprah',
    name: $localize`:@@memes.oprahName:Опра Уинфри`,
    note: $localize`:@@memes.oprahNote:темп её марафона 4:29:15 (Marine Corps, 1994)`,
    timeMs: 1914000,
  },
  {
    key: 'anderson',
    name: $localize`:@@memes.andersonName:Памела Андерсон`,
    note: $localize`:@@memes.andersonNote:темп её марафона 5:41:03 (Нью-Йорк, 2013)`,
    timeMs: 2425000,
  },
];
