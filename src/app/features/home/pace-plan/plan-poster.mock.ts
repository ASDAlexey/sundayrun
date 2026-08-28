import { type PosterInput, type PosterPalette } from './plan-poster.interface';

export const POSTER_PALETTE_MOCK: PosterPalette = {
  paper: '#fdfcf8',
  ink: '#1b1b1b',
  inkSoft: '#6b6b6b',
  route: '#e8730a',
  routeCasing: '#a04d00',
  mark: '#d21f1f',
  accent: '#0a5ad6',
  border: '#e2e2e2',
};

export const POSTER_INPUT_MOCK: PosterInput = {
  title: 'РАСКЛАДКА НА 5 КМ',
  finishText: '22:00',
  paceText: '4:24 / км',
  rows: [
    { label: '1 км', time: '4:24', lap: false },
    { label: 'круг · 2,3 км', time: '10:07', lap: true },
    { label: 'финиш · 5 км', time: '22:00', lap: false },
  ],
  splits: new Map([
    [1000, '4:24'],
    [2300, '10:07'],
    [4600, '20:14'],
  ]),
  footer: 'Воскресный забег',
  palette: POSTER_PALETTE_MOCK,
};
