# Аудит кодовой базы

Список проверенных дефектов и улучшений с точными ссылками на файлы; каждый пункт самодостаточен — берите любой раздел и правьте, не перечитывая проект целиком.

## Статус (01.08.2026)

Разобраны **44 пункта из 47**. Тесты: 729 зелёных, покрытие 100 % по всем четырём метрикам; `tsc` (app + spec + scripts), eslint, stylelint и madge чистые; продакшн-сборка пререндерит 287 маршрутов.

Не сделано — по решению владельца вынесено в отдельные задачи:

- **28** — PAT остаётся в `localStorage`. Уход в память означает ввод токена при каждой перезагрузке.
- **46** — `/athletes/:key` и `/vs/*` по-прежнему отдают 404. Перевод дуэлей на query-параметры ломает уже расшаренные ссылки.
- **29** — разделение на data-репозиторий. Документная половина пункта (текст `docs/ADMIN_TOKEN.md`, срок токена 90 → 30 дней) сделана.

Три решения, принятых по ходу и отличных от буквы аудита:

- **12, частично.** `@defer (hydrate on viewport)` получил только `course-track` на главной. Для `watch-sync`, `badge-catalog`, `bump-chart` и `photo-strip` отложенная загрузка означала бы, что компонент больше нигде не используется эагерно — тогда AOT генерирует загрузчик зависимостей, а он ложится на объявление класса как функция, недостижимая ни одним тестом (проверено: не покрывается ни `getDeferBlocks().render()`, ни настоящим нажатием). Цена — снятие с покрытия целого файла страницы; 13–18 КБ этого не стоят. Тот же артефакт маппинга уже описан для `viewChild` в `vitest-base.config.ts`. Аудит сам предлагал «замерить дельту, потом решать по остальным» — замерили, решили.
- **7.** Индекс сплитов сделан, но пункт был обусловлен профилированием на целевом телефоне, которого не было; изменение чисто внутреннее и поведение не меняет.
- **6, SW-половина.** Sha-именованная БД в service worker не кладётся: копия создаётся в CI уже после сборки, поэтому в hash-таблицу ngsw не попадает, а плоское имя изменчиво. Главное из пункта — отказ от сотен range-запросов — решено транспортом из п. 9.

Измеренный эффект по весу (пп. 9 + 6 + 10):

| Что                       | Было                                        | Стало                                 |
| ------------------------- | ------------------------------------------- | ------------------------------------- |
| Код чтения БД             | 3,4 МБ wasm + 530 КБ воркеров (1,9 МБ gzip) | 845 КБ wasm (391 КБ gzip)             |
| Запросов на чтение архива | сотни range-запросов по 4 КБ                | 2 (wasm + БД целиком, 255 КБ gzip)    |
| Прекеш service worker     | ~3,9 МБ                                     | 1,76 МБ (2,11 МБ переведено в `lazy`) |

## Кратко

| #   | Приоритет | Что                                                                                                               | Где                                                                                            | Трудозатраты |
| --- | --------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------ |
| 34  | P0        | Четыре CSS-переменные используются, но нигде не объявлены — ломается рамка кнопки, фон карточки /vs, красный тост | `race-page.scss:156`, `versus-page.scss:222`, `styles.scss:204`, `db-freshness-banner.scss:35` | trivial      |
| 28  | P0        | PAT организатора лежит в localStorage на origin, общем с тремя другими Pages-сайтами                              | `github/admin-token.constant.ts:4`                                                             | medium       |
| 14  | P0        | Уход из гонки «←» не отпускает wake lock и не гасит таймер: effect живёт в компоненте                             | `timer/session-clock/session-clock.ts:91`                                                      | small        |
| 20  | P0        | `pointercancel` оставляет фантомную отсечку — скролл сетки пишет круг случайному участнику                        | `timer/runner-tile/runner-tile.ts:117`                                                         | small        |
| 3   | P0        | `#write` пишет в localStorage до `set()` и без try/catch — QuotaExceeded теряет отсечку                           | `state/timer-session.service.ts:109`                                                           | trivial      |
| 2   | P0        | «Только круг» проигрывает счётчику тапов: сошедший публикуется финишёром 5 км                                     | `core/timer/session-to-participants.ts:28`                                                     | trivial      |
| 9   | P1        | 3,4 МБ неоптимизированного sqlite3.wasm на каждом обращении к БД                                                  | `scripts/build-sqlite-assets.ts:127`                                                           | medium       |
| 6   | P1        | Клиентские маршруты качают БД сотнями 4 КБ range-запросов в один воркер                                           | `github/protocol-db.service.constant.ts:12`                                                    | medium       |
| 45  | P1        | Все 271 протокол отдают og:url корня сайта и одинаковый description                                               | `src/index.html:153`                                                                           | medium       |
| 5   | P1        | Холодное открытие /timer = ~120 последовательных range-запросов                                                   | `state/timer-roster.service.ts:59`                                                             | medium       |
| 15  | P1        | «Экспорт треков» ревокает blob-url синхронно — Safari отменяет скачивание                                         | `athlete/watch-sync/watch-sync.ts:110`                                                         | trivial      |
| 1   | P1        | Участник с `totalMs`, но без сплитов молча исчезает из протокола                                                  | `core/protocol/protocol-builder.ts:53`                                                         | small        |
| 46  | P1        | `/athletes/:key` и `/vs/*` отдают HTTP 404 и теряют ссылку без sessionStorage                                     | `.github/workflows/ci.yml:185`                                                                 | medium       |
| 35  | P1        | Прибитая шапка протокола не липнет: `overflow-x` делает обёртку скроллпортом                                      | `race/race-page.scss:191`                                                                      | medium       |
| 21  | P1        | Четыре шторки таймера — самодельные div: нет фокуса, ловушки и работающего Escape                                 | `timer/runner-picker/runner-picker.html:1`                                                     | medium       |
| 22  | P1        | Плитки «сошёл»/«финишировал» дают контраст 1,5:1 и 1,9:1                                                          | `timer/runner-tile/runner-tile.scss:199`                                                       | small        |
| 11  | P1        | /races материализует 272 карточки — 1,64 МБ HTML в пререндере                                                     | `races/races-page.html:50`                                                                     | medium       |
| 10  | P1        | SW прокачивает 2,2 МБ чанков (pdfmake, pdfjs, chart.js, Swiper) первому же гостю                                  | `ngsw-config.json:13`                                                                          | medium       |
| 40  | P1        | pre-push не гоняет eslint и тесты — main регулярно красный                                                        | `.husky/pre-push:1`                                                                            | small        |
| 29  | P1        | Документация обещает безопасность токена, который может задеплоить произвольный JS                                | `core/github/protocols-repo.constant.ts:4`                                                     | large        |
| 16  | P2        | После публикации из /timer черновик остаётся в root-сторе — /preview и /result «заряжены»                         | `state/timer-publish.service.ts:120`                                                           | small        |
| 36  | P2        | Сетка колонок протокола скопирована в /races и /preview байт в байт                                               | `race/race-page.scss:12`                                                                       | medium       |
| 30  | P2        | БД качается по `?ref=main`, а коммит родится от прочитанного позже sha                                            | `core/github/github-commit.ts:44`                                                              | medium       |
| 31  | P2        | `permissions` объявлены на уровне workflow — job `quality` держит push-токен                                      | `.github/workflows/ci.yml:12`                                                                  | trivial      |
| 12  | P2        | Ни одного `@defer` — тяжёлые виджеты ниже сгиба едут в основном чанке                                             | `home/home-page.html:95`                                                                       | medium       |
| 38  | P2        | Подтверждение удаления в /admin — fixed div, страница скроллится под ним                                          | `admin/admin-page.scss:400`                                                                    | medium       |
| 41  | P2        | `scripts/` не типизируется и не линтуется: 17 ошибок tsc прямо сейчас                                             | `tsconfig.scripts.json:1`                                                                      | small        |
| 47  | P2        | sitemap.xml рекламирует URL, который отдаёт 404, и не знает про 271 протокол                                      | `public/sitemap.xml:19`                                                                        | small        |
| 24  | P2        | Табы кокпита не связаны с панелью, `aria-selected` врёт при открытом журнале                                      | `timer/timer-page.html:4`                                                                      | medium       |
| 33  | P2        | Регион Coros не сверяется с enum — токен часов уходит на свой же origin                                           | `state/watch-account.service.ts:85`                                                            | trivial      |
| 32  | P2        | Неограниченный индекс колонки xlsx вешает вкладку по OOM                                                          | `core/xlsx/xlsx-reader.ts:72`                                                                  | trivial      |
| 42  | P2        | Smoke-check не проверяет, что параметризованные маршруты пререндерились                                           | `.github/workflows/ci.yml:170`                                                                 | small        |
| 4   | P3        | `clockText` не защищён от отрицательного значения — рисует `0:-1`                                                 | `core/time/duration.ts:72`                                                                     | trivial      |
| 7   | P3        | `runnerSplits` фильтрует и сортирует весь журнал 4N раз на тап                                                    | `core/timer/session-splits.ts:19`                                                              | small        |
| 8   | P3        | Широкоэкранный lap-board считается на телефоне под `display: none`                                                | `timer/timer-page.html:134`                                                                    | small        |
| 13  | P3        | `hammerjs` не импортируется, но висит в зависимостях и в allowlist                                                | `angular.json:30`                                                                              | trivial      |
| 17  | P3        | Машина ожидания деплоя продублирована в компоненте и в сервисе                                                    | `result/result-page.ts:190`                                                                    | medium       |
| 18  | P3        | `AthletePage` рассыпает один payload по 15 сигналам                                                               | `athlete/athlete-page.ts:119`                                                                  | medium       |
| 19  | P3        | `DeleteDurationService` — построчная копия `PublishDurationService`                                               | `github/delete-duration.service.ts:14`                                                         | trivial      |
| 23  | P3        | Карточка участника и «сошёл» доступны только жестом                                                               | `timer/runner-tile/runner-tile.ts:126`                                                         | medium       |
| 25  | P3        | Главные часы гонки помечены `aria-hidden` поверх `role="timer"`                                                   | `timer/session-clock/session-clock.html:3`                                                     | trivial      |
| 26  | P3        | «×» на плитке 32 px и закрытие карточки 36 px против собственного правила 44 px                                   | `timer/runner-tile/runner-tile.scss:148`                                                       | trivial      |
| 27  | P3        | Единственный live-region — `assertive` + `role="status"`, деструктив молчит                                       | `timer/timer-page.html:176`                                                                    | small        |
| 37  | P3        | В ландшафте «ОТСЕЧКА» 48 px против круглой клавиши 64 px                                                          | `timer/tape-controls/tape-controls.scss:272`                                                   | trivial      |
| 39  | P3        | Два одинаковых спиннера и два одинаковых блика с длительностями вне токенов                                       | `db-freshness-banner.scss:24`                                                                  | small        |
| 43  | P3        | Бамп версии пушится до сборки — main рекламирует незадеплоенную версию                                            | `.github/workflows/ci.yml:136`                                                                 | small        |
| 44  | P3        | `bun run jscpd` не вызывается ниоткуда и не имеет порога                                                          | `package.json:19`                                                                              | medium       |

## Баги ядра

### 1. Участник с временем, но без сплитов исчезает из протокола

- **Где**: `src/app/core/protocol/protocol-builder.ts:53`
- **Проблема**: `orderProtocolParticipants` делит вход ровно на три корзины — финишёры 5 км (`lapsMs.length === 2`), 2,3 км (`=== 1`) и DNF (`totalMs === null`). Строка с реальным `totalMs` и `lapsMs: []` не попадает никуда и удаляется молча. JSDoc на строках 10–15 подаёт три корзины как исчерпывающие.
- **Почему это важно**: строка теряется до `buildProtocolRows`, то есть не доходит ни до БД, ни до PDF, ни до счётчиков; на /preview её тоже не видно (`participants-table.ts:70` рисует тот же массив). Триггер — правленый вручную или чужой xlsx.
- **Что сделать**: заменить третью корзину на дополнение к первым двум (всё, что не 5 км и не 2,3 км), тогда `ordered.length === participants.length` и индексная привязка `participants-table.ts:70-75` остаётся верной; `toDnfRow` уже умеет рисовать строку без места. Добавить спеку `buildProtocolRows(participants).length === participants.length`.

### 2. «Только круг» должен побеждать счётчик тапов

- **Где**: `src/app/core/timer/session-to-participants.ts:28`
- **Проблема**: `toParticipant` проверяет `timesMs.length >= MAX_SPLITS_PER_RUNNER` до ветки `TimerRunnerOutcome.lapOnly` (строка 34). Участник с двумя тапами и явным «сошёл» публикуется полноценным финишёром 5 км с местом в гендерном зачёте.
- **Почему это важно**: противоречит `runnerStage` (`session-splits.ts:44-47`, «слово организатора важнее счётчика тапов») и `bestFinishMs` (`session-splits.ts:103`). Экран показывает «сошёл», протокол — 19:24. Тот же путь кормит xlsx-экспорт (`session-list.ts:123`, `session-share.ts:71`).
- **Что сделать**: переставить ветки — сначала `outcome`, потом длина. Дополнительно в `grid-transitions.ts:28` заставить `retireOutcome` возвращать dnf/lapOnly только при ровно одном сплите и не трогать участника с двумя. Спека: сессия с `outcome: 'lapOnly'` и двумя сплитами → строка 2,3 км.

### 3. Сначала сигнал, потом хранилище — и никогда не бросать во время гонки

- **Где**: `src/app/state/timer-session.service.ts:109`
- **Проблема**: `#write` вызывает `this.#storage.setItem(...)` до `this.#state.set(state)` и не оборачивает ничего в try/catch. Исключение (QuotaExceededError, запрещённое хранилище) не даёт сигналу обновиться и всплывает тостом через `NotifyingErrorHandler`. Каждый следующий тап падает так же.
- **Почему это важно**: это самый горячий путь фичи — тап на финише. Соседний кеш делает ровно наоборот (`timer-roster.service.ts:63-72`: сигналы первыми, `setItem` последним внутри try/catch), а читающая сторона прямо документирует принцип (`timer-session.storage.ts:9-13`).
- **Что сделать**: `this.#state.set(state)` первой строкой, затем `try { this.#storage.setItem(...); this.#requestPersistence(); } catch { … }` с одноразовым уведомлением «не удалось сохранить на устройство». Спека: замокать `setItem` на throw и проверить, что `sessions()` обновился.

### 4. Защитить `clockText` от отрицательного аргумента

- **Где**: `src/app/core/time/duration.ts:72`
- **Проблема**: `%` сохраняет знак, `padStart` его не съедает: `formatDuration(-1500)` → `"0:-1"`, `formatRaceTime(-500)` → `"0:00,-50"`.
- **Почему это важно**: `formatDuration` считает дельты по стенным часам (`db-freshness-banner.ts:57`, `result-page.ts:245`), так что сдвиг системного времени назад во время ожидания деплоя рисует пользователю мусор.
- **Что сделать**: зажать в источнике — `this.#elapsedMs.set(Math.max(0, Date.now() - startedAtMs))` в обоих тикерах (это заодно чинит `#publishedInMs` и процент прогресса в `result-page.ts:154`). Дополнительно можно зажать один раз внутри `clockText` — он общий хвост всех трёх публичных форматтеров.

## Производительность

### 5. Материализовать сводку ростера таймера в `meta`

- **Где**: `src/app/state/timer-roster.service.ts:59`
- **Проблема**: `#loadFresh` безусловно гоняет `loadRecords()` и `loadPacingRows()` — два полных скана. `selectPacingRows` (`protocol-db-pacing.ts:18-26`) сканирует `results` с `ORDER BY slug, idx`, `selectAthleteRecords` (`protocol-db-queries.ts:134-145`) — `runs` с `ORDER BY dateIso`. Индексов под эти сортировки нет. По `dbstat`: results 50 страниц + autoindex 14, runs 40 + `runs_athlete_key` 23, athletes 6 + 4; при `maxPageSize: 4096` и `PROTOCOL_DB_WORKER_COUNT = 1` это ~110–140 последовательных range-запросов.
- **Почему это важно**: /timer — единственный маршрут, спроектированный под парк без связи. Кеш спасает повторные визиты (`timer-roster.service.ts:23-31`), но первое открытие на устройстве платит полностью.
- **Что сделать**: писать одну строку `meta` в `syncDbToState` при публикации — имена + пол + четыре карты `buildLapStats` — и читать её в `#loadFresh` одним keyed-запросом. Из `AthleteRecord` таймеру нужны только `key`, `displayName`, `gender` (`runner-picker.ts:128,170`), так что полный скан хронологии `runs` не нужен вовсе.

### 6. Клиентские маршруты не должны листать БД по 4 КБ

- **Где**: `src/app/github/protocol-db.service.constant.ts:12`
- **Проблема**: `/athletes/:key` и `/vs/:left/:right` рендерятся на клиенте (нет пререндера, нет `trustBaked`) и выпускают 14 параллельных архивных запросов (`athlete-page.ts:426-439`), большинство — полные сканы. `PROTOCOL_DB_HTTP_OPTIONS = { maxPageSize: 4096 }` при одном воркере превращает это в сотни последовательных round-trip'ов ради ~255 КБ данных, которые в гзипе едут одним запросом. Кешировать нечего: Pages отдаёт `max-age=600`, а `ngsw-config.json:41` справедливо исключает `/data/**` (SW не умеет `cache.put` для 206).
- **Почему это важно**: страница атлета и дуэль — самые расшариваемые ссылки; на мобильной сети это единицы секунд ожидания на каждом визите старше десяти минут.
- **Что сделать**: добавить второй транспорт рядом с range-VFS: один `fetch(pinnedProtocolDbPath(ref))` в `deserializeDbInto` (`src/app/core/sqlite/deserialize-db.ts` уже есть, путь записи им пользуется), включать его на не-пререндеренных маршрутах, деградировать обратно к range-чтению при размере файла > ~3 МБ. Sha-именованный URL иммутабелен и отдаёт 200 — его можно положить в `assetGroup` в `ngsw-config.json`.

### 7. Индексировать сплиты по участнику (только по профилю на телефоне)

- **Где**: `src/app/core/timer/session-splits.ts:19`
- **Проблема**: `runnerSplits` делает `filter` + `sort` по всему журналу на каждый вызов; `finishDoneCount` (строка 72) достаёт его ~4N раз через `countRunnersWithSplits` (152), `queuedLapCount` (157) и `owedFinishCount` (162). Эти счётчики независимо читают пять потребителей на тап: `session-clock.ts:47,53,85`, `timer-page.view.ts:19-20`, `timer-race.service.ts:69`, `timer-farewell.service.ts:41`.
- **Почему это важно**: при реальных 15–30 участниках это ~0,1 мс на тап — ниже порога заметности. Значимо только на полях 60–100 человек.
- **Что сделать**: не вводить модульный `WeakMap` (глобальный кеш в файле чистых функций + `sort` на месте = алиасинг). Построить локальный `Map<string | null, TimerSplit[]>` внутри тех функций, которые и так обходят ростер (`buildLapBoard`, `buildTimerTileViews`, `tapsOwed`/`countRunnersWithSplits`), и передавать индекс параметром. Делать только после профиля на целевом телефоне.

### 8. Не инстанцировать широкоэкранный lap-board на телефоне

- **Где**: `src/app/features/timer/timer-page.html:134`
- **Проблема**: `<app-timer-lap-board />` внутри `.timer__aside` отрисован безусловно и вне `@switch`, поэтому сосуществует с экземпляром из `@case (tabs.lap)` (строка 126). `timer-page.scss:247` прячет aside по умолчанию, `:441` — ещё раз при открытой вкладке «Круг». `display: none` не отменяет вычислений: `lap-board.ts:29-41` пересобирает `buildLapBoard` на каждое изменение сессии.
- **Почему это важно**: на телефоне это 100 % бесполезной работы на каждый тап, на широком экране — дублирующий расчёт той же доски.
- **Что сделать**: обернуть aside в `@if (tab() !== tabs.lap)` — ровно то, что уже говорит правило `&__body_lap &__aside { display: none; }`. Медиазапрос в TS не тащить: комментарий `timer-page.scss:245-246` намеренно держит адаптив чисто в CSS. Если профиль покажет, что скрытая сборка на телефоне ощутима — вынести общий `computed` в маленький `TimerLapBoardService`.

## Бандл и загрузка

### 9. Заменить неоптимизированный 3,4 МБ sqlite3.wasm

- **Где**: `scripts/build-sqlite-assets.ts:127`
- **Проблема**: строка копирует `node_modules/sqlite-wasm-http/deps/dist/sqlite3.wasm` — 3 611 929 Б (code-секция 3 456 460 Б, custom-секции `name` нет, то есть это кодоген, а не отладка). Рядом репозиторий уже кладёт `public/sqlite3.wasm` из `@sqlite.org/sqlite-wasm` — 864 752 Б. Разница в гзипе: 1 735 528 против 399 968 Б.
- **Почему это важно**: 1,7 МБ гзипа — вчетверо больше всего начального JS (399 846 Б). Это не first-paint (публичные маршруты пререндерятся и главная идёт с `trustBaked: true`), но любой переход на страницу атлета или /vs платит.
- **Что сделать**: выполнить план, уже записанный в `docs/SQLITE_DB.md:225` («Шаг 2»): `data/sundayrun.db` = 848 КБ, то есть меньше самого VFS-бинаря, поэтому заменить `createSQLiteHTTPPool` в `protocol-db.service.ts` на один гзип-fetch в `ArrayBuffer` и `sqlite3.oo1.DB` из уже собранного `public/sqlite3.wasm`. Это снимает и 3,4 МБ, и ~530 КБ воркеров `sqlite-http/*.js`, и патч `patchSizeProbe`; токен `PROTOCOL_DB` сохраняется, `protocol-db-queries.ts` не трогается. Если range-VFS остаётся — только `wasm-opt` над `deps/dist/sqlite3.wasm`: glue и wasm связаны таблицей символов, поменять одно без другого нельзя.

### 10. Разделить prefetch: инициальные чанки против чанков по требованию

- **Где**: `ngsw-config.json:13`
- **Проблема**: assetGroup `app` — `installMode: prefetch` по `/*.js`, то есть все 17 `chunk-*.js`. Сверх инициальных 1,56 МБ SW тянет ещё 2 221 140 Б сырых / 722 606 Б гзипа: pdfmake 1 028 072, pdfjs-dist 427 041, sqlite deserialize 214 774, Swiper 182 832, chart.js 207 061.
- **Почему это важно**: 3,78 МБ JS в кеш первому же гостю. При этом деление «админское/публичное» не работает: pdfmake зовут `races/race-card/race-card.ts:18` и `race/race-page.ts:90` (любой посетитель качает PDF), chart.js — `athlete/progress-chart.ts:16`, Swiper — публичная фотомодалка. Реально организаторские только pdfjs и sqlite deserialize.
- **Что сделать**: включить `namedChunks: true` в production-конфигурации `angular.json`, оставить в prefetch main/polyfills/styles/index и шесть чанков из `modulepreload` в `index.csr.html` (`chunk-4AX4OU5M`, `LKTC2YTE`, `ONZSPOEG`, `R2W6SUUJ`, `VV55OXDZ`, `X65MIFTU`), а pdfmake, pdfjs, chart.js, Swiper и sqlite deserialize вынести во вторую группу с `installMode: lazy` / `updateMode: prefetch`. Все пять всё равно требуют сети для своих данных, offline-сценарии не страдают.

### 11. Инкрементальная гидрация для /races

- **Где**: `src/app/features/races/races-page.html:50`
- **Проблема**: `@for (group of yearGroups()) { @for (race of group.races) { <app-race-card /> } }` без окна: `dist/parkrun/browser/races/index.html` = 1 714 105 Б на диске (1 635 593 символа), из них ng-state 288 848. В документе 271 экземпляр `<app-race-card>`.
- **Почему это важно**: по проводу это «всего» 62 929 Б гзипа, но парсинг HTML и гидрация 271 компонента — это работа основного потока на архивной странице.
- **Что сделать**: добавить `withIncrementalHydration()` в `provideClientHydration` (`app.config.ts:40`) и обернуть каждую секцию года, кроме свежайшей, в `@defer (hydrate on viewport)` в `races-page.html:51`. Именно инкрементальная: обычный `@defer (on viewport)` вычистил бы карточки из пререндера, который `app.routes.server.ts:15` создаёт намеренно. `/records` не трогать — там вес в `records.data` (855 016 Б JSON), а не в разметке.

### 12. Отложить тяжёлые виджеты ниже сгиба

- **Где**: `src/app/features/home/home-page.html:95`
- **Проблема**: `grep -rn '@defer' src/app` не находит ничего. Эагерные поддеревья (ts+html+scss): `home/course-track` 62 326 Б (плюс тянет `public/course-basemap.svg`, 76 КБ, из `course-track.html:56`), `records/bump-chart` 18 301, `race/photo-strip` 17 609, `athlete/badge-catalog` 15 138, `athlete/watch-sync` 13 269. Точки использования: `home-page.html:95`, `records-page.html:772/792`, `race-page.html:79`, `athlete-page.html:21/141`.
- **Почему это важно**: комментарий `app.routes.ts:15` отвергает ленивые маршруты из-за перерисовки шелла — у `@defer` с равным по размеру `@placeholder` этой проблемы нет. Но выигрыш размазан по четырём маршрутам, и пока действует prefetch из пункта 10, байты SW всё равно скачает.
- **Что сделать**: начать с `course-track` в `home-page.html:95` и только с `@defer (hydrate on viewport)` при `withIncrementalHydration()` — `/`, `/records`, `/races/:slug` стоят в `app.routes.server.ts` как `RenderMode.Prerender` ради LCP и SEO. Замерить дельту эагерного графа, потом решать по остальным. Исключение — `watch-sync` (`athlete-page.html:21`): личный инструмент, краулеру не нужен, ему подходит обычный `@defer (on interaction)`.

### 13. Убрать `hammerjs`

- **Где**: `angular.json:30`
- **Проблема**: `"allowedCommonJsDependencies": ["hammerjs", "pdfmake/build/pdfmake"]`, `hammerjs` в `dependencies` (`package.json:43`), `@types/hammerjs` в `devDependencies` (`:65`), при этом импорта нет: единственное упоминание в `src` — комментарий `timer/runner-tile/runner-tile.ts:22`.
- **Почему это важно**: на вес бандла не влияет (неимпортированное не собирается), но allowlist глушит предупреждение, если hammerjs когда-нибудь придёт транзитивно.
- **Что сделать**: сократить `angular.json:30` до `["pdfmake/build/pdfmake"]`, удалить обе записи из `package.json`, переписать комментарий `runner-tile.ts:22` — его посылка («hammerjs в проекте есть, но в жестах не участвует») перестанет быть правдой; написать, что жесты читаются с обычных pointer-событий.

## Архитектура

### 14. Перенести реакцию на жизненный цикл гонки в `TimerRaceService`

- **Где**: `src/app/features/timer/session-clock/session-clock.ts:91`
- **Проблема**: `constructor() { effect(() => this.#race.sync(this.#sessions.active())); }` — единственный вызов `TimerRaceService.sync()` во всём проекте, и он живёт во вью-эффекте презентационного компонента внутри `@if (session(); as current)`. При «←» `timer-page.ts:142` зовёт `closeActive()`, `@if` схлопывается, LView с эффектом уничтожается в том же проходе шаблона — эффект никогда не отработает с `null`, поэтому `#idle()` (`timer-race.service.ts:97`) не вызывается.
- **Почему это важно**: `WakeLockService.release()` не происходит (экран телефона держится включённым), 30 мс `setInterval` в `TimerClockService` продолжает тикать, `#ticking` остаётся `true` и при открытии другой уже идущей сессии часы стартуют от протухшей базы. Оба сервиса — root-синглтоны, их `ngOnDestroy` не наступает.
- **Что сделать**: удалить эффект из конструктора `TimerClock` и поставить `constructor() { effect(() => this.sync(this.#sessions.active())); }` в `TimerRaceService` — ровно как уже сделано в `RaceGuardService` (`race-guard.service.ts:24-42`). Сервис должен остаться лениво создаваемым (его инжектит только фича таймера). Спека: авто-стоп по `isRaceComplete` теперь сработает и при закрытом кокпите — зафиксировать это тестом.

### 15. `WatchSync.exportTracks` должен звать `triggerBlobDownload`

- **Где**: `src/app/features/athlete/watch-sync/watch-sync.ts:110`
- **Проблема**: строки 113–120 повторяют общий хелпер и делают именно те две ошибки, от которых он защищает: ревокают object url в том же синхронном такте, что и `.click()`, и не добавляют якорь в документ. `pdf/blob-download.ts:3-8` документирует опасность прямым текстом, реализация (`:9-21`) добавляет якорь в `doc.body` и откладывает revoke на `BLOB_URL_REVOKE_DELAY_MS`.
- **Почему это важно**: единственная резервная копия локальной коллекции треков может не скачаться. Три других места скачивания хелпером пользуются (`result-page.ts:278`, `session-list.ts:86` и `:101`, `protocol-pdf.service.ts:43`).
- **Что сделать**: заменить блок одной строкой `triggerBlobDownload(this.#document, new Blob([new Uint8Array(buildTrackArchive(this.tracks()))], { type: 'application/zip' }), TRACK_EXPORT_FILE_NAME);`, сохранив комментарий `watch-sync.ts:111-112` про копию вывода fflate — причина копии не изменилась.

### 16. Сбрасывать `ProtocolStateService` после публикации из таймера

- **Где**: `src/app/state/timer-publish.service.ts:120`
- **Проблема**: `#store.importSession(...)` заменяет `#drafts` целиком (`protocol-state.service.ts:113-117`) и автозаполняет событие; пол приходит с `GenderConfidence.high` (`session-to-participants.ts:47-49`), поэтому `isDraftReady` и `canGenerate` остаются истинными. `ProtocolStateService.reset()` (`:218`) из пути таймера не зовётся никогда, а `TimerPublishService.reset()` (`:106`) чистит только своё.
- **Почему это важно**: `previewGuard` и `resultGuard` пропускают, и переход на /preview в той же сессии показывает уже опубликованную гонку живым визардом. Симметрично: публикация из таймера уничтожает мультифайловую партию, которую организатор набрал в визарде загрузки.
- **Что сделать**: звать `this.#store.reset()` на обоих выходах `#commit` (после `#recordUploads` и в ветке `#fail`) и в `TimerPublishService.reset()`. Не сбрасывать в начале `#buildInputs` — `importSession` обязан дожить до `buildPublishInputs`. Более чистый вариант, чинящий и обратное направление: отдельный экземпляр `ProtocolStateService` для потока таймера.

### 17. Вынести ожидание деплоя из `ResultPage`

- **Где**: `src/app/features/result/result-page.ts:190`
- **Проблема**: `result-page.ts:230-241` (цикл `#pendingArchive.addUpload`) байт в байт совпадает с `timer-publish.service.ts:174-189`; реакция на `DbFreshness` написана дважды (`result-page.ts:189-202` и `timer-publish.service.ts:70-84`), хотя охранные условия там разные — общая только пятистрочная лестница Updating/Updated/healed-Fresh. Тикер «прошло m:ss» существует ещё в двух местах (`admin-page.ts:352`, `db-freshness-banner.ts:57`).
- **Почему это важно**: пользователь ничего не замечает; цена — любое изменение детекции приземлившегося деплоя надо вносить дважды.
- **Что сделать**: дешёвая и однозначная половина — перенести цикл в `PendingArchiveService.addUploads(inputs)`. Общий `DeployWaitService` не является drop-in: /result моделирует прогресс булевыми сигналами + тикером, `TimerPublishService` — enum'ом шага. `AdminPage` в это не втягивать: там нет машины ожидания, только реакция на `Updated` (`admin-page.ts:185`).

### 18. Свернуть 15 сигналов `AthletePage` в один

- **Где**: `src/app/features/athlete/athlete-page.ts:119`
- **Проблема**: строки 118–133 объявляют 15 приватных сигналов, 381–396 присваивают их по одному, 409–456 деструктурируют те же 14 имён из `Promise.all` и перечисляют их снова в литерале, 461–478 повторяют в `emptyAthleteState()`. Интерфейс `AthletePageState` уже существует, `#resolveState()` уже возвращает один объект. Соседняя страница делает правильно: `race-page.ts:97-98` держит один `race = signal<RaceView | null>(null)`.
- **Почему это важно**: добавление одного поля требует правки в пяти местах. Влияния на пользователя нет.
- **Что сделать**: заменить 14 атомарных сигналов на `readonly #state = signal<AthletePageState>(emptyAthleteState(AthleteStatus.loading))` плюс `computed`-аксессоры. `#weatherRows` оставить отдельным — его исключение из состояния намеренно и задокументировано в `athlete-page.ts:375-376`. Охрану от устаревшей навигации `key !== this.#key` (`:378`) не менять.

### 19. Слить два сервиса длительностей в один

- **Где**: `src/app/github/delete-duration.service.ts:14`
- **Проблема**: строки 14–36 повторяют `publish-duration.service.ts:17-38` построчно — тот же сигнал из `readStoredDurations`, тот же `averageMs`, тот же `record()`, тот же геттер `#storage`. Дублирование явное: файл уже импортирует `PUBLISH_DURATIONS_MAX_ENTRIES`, `PUBLISH_DURATION_SSR_NOOP_STORAGE` (строка 5) и `PublishDurationStorage` (строка 6) из чужого модуля.
- **Почему это важно**: ~20 строк копии и межмодульная связность, влияния на пользователя нет.
- **Что сделать**: положить фабрику в существующий `github/duration-history.ts` рядом с `readStoredDurations` и перенести туда же `PUBLISH_DURATIONS_MAX_ENTRIES`, SSR-заглушку и тип `PublishDurationStorage` — иначе связность переживёт рефакторинг. `#storage` оставить геттером: обе спеки подменяют глобальный `localStorage` по сценариям и рассчитывают на перечитывание.

## Доступность и мобильный UX

### 20. Откатывать отсечку, когда браузер отбирает указатель

- **Где**: `src/app/features/timer/runner-tile/runner-tile.ts:117`
- **Проблема**: `tap` эмитится на `pointerdown` (строки 81–93) — до того, как браузер решил, тап это или скролл. `onPointerCancel` (117–119) только обнуляет `#press`, оставляя уже записанную отсечку. Сетка скроллится начиная с `TIMER_SCROLL_MIN_RUNNERS = 33` (`runner-grid.constant.ts:14`, `runner-grid.scss:84` — `overflow: hidden auto`), а вся поверхность скролла состоит из плиток.
- **Почему это важно**: первое же вертикальное протягивание на полном поле пишет фантомный круг или финиш случайной фамилии. Свайп-откат не спасёт (`onPointerUp` выйдет рано, `#press` уже `null`, и вертикальный жест всё равно провалит `TIMER_SWIPE_MAX_DRIFT_PX`), остаётся глобальная «Отменить», которая снимает новейшую отсечку сессии, а не эту. Класс сам декларирует обратный принцип в доке `runner-tile.ts:26-29`.
- **Что сделать**: не эмитить голый `undo` из `onPointerCancel` — `tap` летит даже когда сетка его отвергает (`runner-grid.ts:137-142` выходит рано для `finished`/`retired` и вне записи), и флаг «тап был» удалил бы настоящий финиш. Либо (a) сетка возвращает id записанной отсечки, и отмена удаляет ровно её, либо (b) фиксировать метку времени на `pointerdown`, а коммитить отсечку только после `pointerup` в пределах `TIMER_SWIPE_MAX_DRIFT_PX` без `pointercancel` — точность `atMs` при этом сохраняется. `runner-tile.spec.ts:120-124` уже проверяет «сто пикселей вниз — это скролл» для пути `pointerup`; покрыть оба.

### 21. Дать шторкам таймера фокус, ловушку и работающий Escape

- **Где**: `src/app/features/timer/runner-picker/runner-picker.html:1`
- **Проблема**: четыре оверлея — самодельные `div` вместо нативного `<dialog>`, который проект использует в других местах. Единственный `.focus()` во всей фиче — `handout-sheet.ts:34`. Оверлеи: `runner-picker.html:1`, `session-list.html:62-69`, `session-history.html:1-8`, `runner-details.html:1`. `<app-timer-picker>` рендерится соседом `.timer timer_race` (`timer-page.html:197-199`), поэтому `keydown` с кнопки-открывашки `.timer__roster` (`:153-163`) через хост шторки не всплывает, и `(keydown.escape)` не срабатывает, пока пользователь сам не сфокусируется внутри.
- **Почему это важно**: `docs/TIMER.md:807-810` прямо объясняет, зачем брали нативный `<dialog>` («платформа сама рисует подложку, ловит фокус … Escape и возврат фокуса») — эти четыре просто разошлись с решением.
- **Что сделать**: перевести `runner-picker`, экшен-шит `session-list` и `session-history` на `dialog[appTimerSheet]` + `showModal()`, убрав у них кнопки `__scrim` и `aria-modal`. `runner-details` не конвертировать: это `role="group"` (`runner-details.html:1`), намеренно неблокирующий (`timer-page.ts:200-207`); ему — фокус при открытии и Escape на хосте.

### 22. Поднять контраст плиток «сошёл» и «финишировал»

- **Где**: `src/app/features/timer/runner-tile/runner-tile.scss:199`
- **Проблема**: `&_done { color: var(--text-muted); opacity: 0.55 }` (189–197) и `&_out { … opacity: 0.4 }` (199–207) поверх `--bg-subtle` на `--bg`. Токены `_tokens.scss:7,9,18` (`#6e6e76`, `#0e0e10`, `#060607`) дают 1,89:1 и 1,50:1 при требуемых 4,5:1; фамилия наследует цвет (`runner-tile.scss:87`).
- **Почему это важно**: это ровно те плитки, по которым организатор ищет ошибку, на телефоне при дневном свете. Сошедшие остаются в сетке навсегда (`runner-grid.ts:177-180`).
- **Что сделать**: убрать `opacity` с элемента и гасить части явно: фамилия — `--text-secondary` на `--bg-subtle` (~7,5:1), время — на ступень тусклее. Не заводить локальный override `--text-muted` и не писать hex: либо `color-mix(in srgb, var(--text-secondary) …, var(--bg))`, либо новый токен в `src/styles/_tokens.scss`.

### 23. Дать беспальцевый путь к карточке участника

- **Где**: `src/app/features/timer/runner-tile/runner-tile.ts:126`
- **Проблема**: `runner-tile.html:10-15` привязывает только `contextmenu`, `keydown.enter`, `keydown.space` и pointer-события; `onKeyCut` (`:127-131`) эмитит один `tap`. `details` летит только из `onPointerUp` (`:112`), `retire` — только из `#onSwipe` (`:141`). «Поменять местами с…» живёт исключительно в карточке (`runner-details.html:65`), а карточка открывается только точным долгим нажатием.
- **Почему это важно**: замена — единственное лечение самой частой ошибки кокпита (тап по чужой фамилии) и единственный ремонт без альтернативы; исходы (`session-history.html:79-113`) и удаление из ростера с клавиатуры доступны.
- **Что сделать**: добавить строку «Карточка» на каждого участника в секции «Кто как закончил» (`session-history.html`) — список уже есть и уже достижим с клавиатуры, новых горячих клавиш придумывать не надо. Не вешать «⋮» на плитку во время гонки: `runner-grid.ts:105-110` объясняет, почему этот угол пуст.

### 24. Починить ARIA-структуру табов кокпита

- **Где**: `src/app/features/timer/timer-page.html:4`
- **Проблема**: `role="tablist"` (`:70`) без `aria-label`; три `role="tab"` (`:71-108`) без `id` и `aria-controls`; `role="tabpanel"` (`:111-116`) без `id`/`aria-labelledby`. При открытом журнале (`:117-118`) содержимое панели подменяется, а `tab()` и все `aria-selected` не меняются (`timer-page.ts:180-182` трогает только `historyOpen`) — разметка утверждает ложь.
- **Почему это важно**: непривязанная панель и врущий `aria-selected` дезориентируют экранного диктора сильнее, чем полное отсутствие ролей.
- **Что сделать**: добавить i18n-`aria-label` на tablist, `id` + `aria-controls` на каждый таб и `id` + `aria-labelledby` на панель; сделать `aria-selected` честным при `historyOpen()` — либо всем трём `false`, либо вынести `<app-timer-history>` из панели. `role="application"` на `:4` не снимать и `<main id="main">` не вводить: решение задокументировано в комментарии `timer-page.html:2-3` (там же признано, что скип-линк `app.ts:57-60` в кокпите ни на что не наводится).

### 25. Перестать прятать время гонки от вспомогательных технологий

- **Где**: `src/app/features/timer/session-clock/session-clock.html:3`
- **Проблема**: на одном элементе стоят `aria-hidden="true"` и `role="timer"`; `aria-hidden` побеждает, роль недостижима. Альтернатив нет: вежливая строка (`:20-44`) даёт только счётчики, прогрессбар (`:51-58`) — `finishDone` из `total`.
- **Почему это важно**: главное состояние кокпита не экспонировано вообще, при нулевой цене исправления.
- **Что сделать**: убрать `aria-hidden="true"`, оставить `role="timer"` (он подразумевает `aria-live="off"`, лишнего чтения на тик не появится). Если сотые мешают — оставить `aria-hidden` только на вложенном `.timer-clock__fraction`.

### 26. Довести «×» на плитке и закрытие карточки до собственных 44 px

- **Где**: `src/app/features/timer/runner-tile/runner-tile.scss:148`
- **Проблема**: `&__remove` — 32×32 (146–150), `runner-details.scss:41-48` — 36×36. При этом правило 44 px в той же фиче заявлено комментариями (`timer-page.scss:101-103`, `runner-grid.scss:149-150`), и все прочие контролы таймера ему следуют.
- **Почему это важно**: WCAG 2.5.8 AA (24 px) обе цифры проходят, так что это внутренняя несогласованность, а не провал доступности.
- **Что сделать**: для плитки взять прозрачное расширение (`::before { position: absolute; inset: -6px; }`), сохранив нарисованную плотность глифа — она обоснована в `runner-tile.ts:46-52` и `runner-tile.scss:135-139`. Для `runner-details.scss:41-48` поставить честные 44×44, места хватает. Подтверждение на `onRemove` не добавлять: решение задокументировано в `runner-grid.ts:186-194`.

### 27. Убрать `assertive` с единственного live-region

- **Где**: `src/app/features/timer/timer-page.html:176`
- **Проблема**: `<p aria-live="assertive" class="timer__announcer" role="status">` совмещает явный assertive с подразумеваемым polite; кормится только из `onAnnounce` (`timer-page.ts:185-187`), чей единственный источник — круг/финиш/отмена из сетки (`runner-grid.ts:152-156, 173`). Четыре деструктивных действия (`timer-page.ts:223-228`, `:231-239`, `runner-details.ts:106`, удаление из журнала) не объявляют ничего.
- **Почему это важно**: каждая рядовая отсечка перебивает чтение; при этом все деструктивные пути уже проходят через диалог подтверждения, который называет точные числа.
- **Что сделать**: удалить `aria-live="assertive"`, оставить `role="status"`. Отдельный assertive-узел не заводить; если деструктив всё же должен звучать — переиспользовать этот же регион и строки, уже посчитанные диалогом (`resetNoteText`/`clearRosterNoteText`).

## Безопасность и публикация

### 28. Убрать PAT организатора с origin, общего с тремя другими приложениями

- **Где**: `src/app/github/admin-token.constant.ts:4`
- **Проблема**: `ADMIN_TOKEN_STORAGE_KEY = 'parkrun.github-token'`, `AdminTokenService` (`admin-token.service.ts:16-19`) кладёт сырой PAT в `localStorage` навсегда, без срока. `localStorage` привязан к origin, а `https://asdalexey.github.io` — один origin на все Pages-проекты аккаунта (проверено: `has_pages: true` у `ASDAlexey.github.io`, `litely`, `sundayrun`, `vitest-auto-spy`; `/litely/` и `/vitest-auto-spy/` отвечают 200).
- **Почему это важно**: одна скомпрометированная npm-зависимость в любом из соседних проектов читает `localStorage.getItem` и получает токен, который умеет пушить в репозиторий и, как следствие, деплоить произвольный JS на живой сайт (см. пункт 29).
- **Что сделать**: не хранить PAT вовсе — держать его в in-memory сигнале на время сессии публикации и переспрашивать при перезагрузке (публикация раз в неделю). Если хранение обязательно: перенести сайт на собственный origin (кастомный домен или отдельный `<name>.github.io`). Промежуточная мера — `sessionStorage` с ключом, включающим путь деплоя, плюс сохранённый `expiresAtMs`, который `AdminTokenService` проверяет при чтении.

### 29. Честно описать область действия PAT (и продумать data-only репозиторий)

- **Где**: `src/app/core/github/protocols-repo.constant.ts:4`
- **Проблема**: `PROTOCOLS_REPO_NAME = 'sundayrun'` — тот же репозиторий, который `.github/workflows/ci.yml` собирает и деплоит на Pages при каждом пуше в `main` (`:1-9`, `:106-215`). Значит fine-grained PAT с `Contents: read/write`, который организатор вставляет в браузер телефона, умеет менять `src/**`. CI-гейт не преграда: линт, тесты и 100 % покрытия пройдут и у кода, который заодно эксфильтрирует.
- **Почему это важно**: `docs/ADMIN_TOKEN.md:29-30` говорит про другие репозитории и настройки аккаунта — это правда, но неполная: единственный доступный репозиторий и есть тот, что отдаёт сайт.
- **Что сделать**: сейчас — дописать в `docs/ADMIN_TOKEN.md:24-33` фразу, что токен даёт запись и в исходники самого сайта, и снизить рекомендованный срок с 90 до 30 дней. Разделение на data-репозиторий вести отдельной задачей: оно обязано сохранить сборку БД внутрь Pages-артефакта (`ci.yml:150-168` объясняет, почему нужен same-origin для range-чтений) и семантику указателя `version.json`, добавив `repository_dispatch`.

### 30. Пинить скачивание БД к коммиту, который станет родителем

- **Где**: `src/app/core/github/github-commit.ts:44`
- **Проблема**: `const outcome = await attemptCommit(fetchFn, token, await buildFiles(), message);` — аргументы вычисляются слева направо, поэтому вся выкачка и перезапись БД завершаются до чтения head ref на строке 58. Сама БД тянется по `?ref=main` (`protocol-db-file.ts:16` → `repo-contents.ts:73` → `github-api.constant.ts:23`), то есть по состоянию на момент запроса, а не по родительскому sha.
- **Почему это важно**: публикация, приземлившаяся во время выкачки, fast-forward'ится без конфликта, а дерево несёт БД, собранную из старых байт — чужое событие исчезает без ошибки. Комментарий `github-commit.ts:29-31` обещает гарантию, которой порядок не даёт. Организатор один, так что окно узкое, и потеря лечится повторной публикацией даты (source.xlsx в дереве уцелеет).
- **Что сделать**: внутри `attemptCommit` сначала читать `headSha`, потом звать `buildFiles(headSha)`, а `buildProtocolDbCommitFile`/`fetchRepoFileBytes` научить принимать ref, чтобы url был `?ref=<headSha>`. Более дешёвый вариант: перечитать ref после `buildFiles` и считать сдвинувшийся head отклонённой попыткой, переиспользовав ретрай 409/422. В любом случае поправить комментарий `:29-31`.

### 31. Раздать права CI по джобам

- **Где**: `.github/workflows/ci.yml:12`
- **Проблема**: `permissions: contents: write / pages: write / id-token: write` объявлены на уровне workflow, поэтому джоб `quality` (`:78`), который делает `bun install --frozen-lockfile` (`:90`) и гоняет линтеры и тесты, держит токен, умеющий пушить в `main` и выпускать Pages OIDC. `actions/checkout@v4` по умолчанию оставляет учётку в `.git/config`. Реально `contents: write` нужен только `build` (пуш бампа на `:145`), а `pages`/`id-token` — только `deploy` (`:227`).
- **Почему это важно**: для PR из форков GitHub и так выдаёт read-only токен, так что окно — ветки внутри репозитория и push-события; но принцип наименьших привилегий здесь бесплатен.
- **Что сделать**: поставить `permissions: contents: read` на уровне workflow (не пустой объект — `actions/checkout` аутентифицируется GITHUB_TOKEN), добавить `permissions: contents: write` джобу `build` и `permissions: pages: write / id-token: write` джобу `deploy`, а в `quality` и `changes` — `persist-credentials: false` на шаге checkout. Заодно исправить комментарий `:13`: бамп пушит `build`, а не `deploy`.

### 32. Ограничить индекс колонки xlsx

- **Где**: `src/app/core/xlsx/xlsx-reader.ts:72`
- **Проблема**: `columnIndexOf` (`:83-103`) накапливает base-26 по неограниченной последовательности букв, `readRow` (`:72-74`) добивает массив `while (cells.length < columnIndex)`. `'AAAAAAAA1'` → 8 353 082 582 итераций. Вкладка виснет и умирает по памяти, поэтому `try/catch` в `protocol-dropzone.ts:71-79` не отрабатывает.
- **Почему это важно**: это не атака — `/upload` за `adminGuard` (`app.routes.ts:84-87`), файл несёт сам организатор. Но вместо «неверный файл» он получает мёртвую вкладку.
- **Что сделать**: добавить `export const MAX_XLSX_COLUMN_INDEX = 16383;` в `xlsx-reader.constant.ts` (реальный максимум Excel) и возвращать `fallbackIndex` из `columnIndexOf`, если расчёт его превысил. Именно зажимать, а не бросать — остальной ридер деградирует мягко.

### 33. Проверять сохранённый регион Coros по значению

- **Где**: `src/app/state/watch-account.service.ts:85`
- **Проблема**: `isWatchAccount` (`:76-86`) сужает объект из localStorage до `WatchAccount`, проверяя только `typeof region === 'string'`. `COROS_REGION_API_URLS` — `Record<CorosRegionType, string>` (`coros-api.constant.ts:7-11`), промах даёт `undefined`, и шаблонные литералы (`coros-api.ts:36, 71, 102`) собирают относительный url `undefined/activity/query?…`.
- **Почему это важно**: `fetch` разрешит его от базы документа, и токен сессии Coros уйдёт заголовком `accesstoken` на `asdalexey.github.io`, то есть в логи GitHub, а ошибка покажется обычным сбоем API вместо «перепривяжите часы». Док `watch-account.service.ts:57` уже обещает деградацию в «не привязано».
- **Что сделать**: заменить проверку на членство в значениях без обмана типов: `(Object.values(CorosRegion) as string[]).includes(region as string)`. Не писать `includes(region as CorosRegionType)` — это каст до проверки.

## Стили

### 34. Объявить четыре используемые, но несуществующие CSS-переменные

- **Где**: `src/app/features/race/race-page.scss:156`, `src/app/features/versus/versus-page.scss:222`, `src/styles.scss:204`, `src/app/shared/db-freshness-banner/db-freshness-banner.scss:35`
- **Проблема**: `--card-border`, `--card-bg`, `--red`, `--text-tertiary` нигде в `src/` не объявлены (`_tokens.scss:6-60` даёт `--border`, `--surface`, `--text-muted`, `--green` и никаких аналогов). Нерезолвнутый `var()` делает невалидным всё объявление целиком, а не откатывает к предыдущему.
- **Почему это важно**: три из четырёх видны на живых страницах. `race-page.scss:156` — сбрасывается весь шорткат `border`, кнопка «Фото с забега» на каждом протоколе теряет рамку, а `:hover { border-color: var(--accent-line) }` (`:165`) становится бесполезным. `versus-page.scss:214-222` — невалидный `background` перебивает `@include c.card`, карточка счёта дуэли становится полностью прозрачной и теряет оба радиальных градиента. `styles.scss:204` — тост ошибки остаётся без красной подложки, но с чернилами `--accent-contrast: #1a0e02` (`:205`), то есть нечитаем. `db-freshness-banner.scss:35` — таймер «прошло m:ss» теряет приглушённость.
- **Что сделать**: добавить в `src/styles/_tokens.scss` `--red` (второй потребитель — `versus-page.scss:118`), `--text-tertiary`, `--card-bg`, `--card-border`; либо, если карточные токены задумывались алиасами, заменить потребителей на `--surface`/`--border`. Проверить после правки грепом, что потребителей без объявления не осталось.

### 35. Прибитая шапка протокола не может липнуть

- **Где**: `src/app/features/race/race-page.scss:191`
- **Проблема**: `.race__thead-row` — `position: sticky; top: 0` (190–202), но её скроллпорт — `.race__table-wrap` (`:184-188`, `overflow-x: auto` без ограничения высоты). По CSS Overflow 3 `visible` в другой оси вычисляется в `auto`, так что обёртка становится скролл-контейнером с вечным `scrollTop: 0`, а прокручивается страница (`scrollWindow`, см. `:216-220`). Та же конструкция в `preview/participants-table.scss:14-32`.
- **Почему это важно**: на протоколе в 300 строк заголовки колонок уезжают после первого экрана — ровно то, чего комментарий обещает не допустить.
- **Что сделать**: не ломать документированную схему virtual scroll. Ограничить `overflow-x: auto` шириной, где он действительно нужен (`@media (width <= 900px) { &__table-wrap { overflow-x: auto } }`) — тогда на десктопе обёртка перестаёт быть скроллпортом. Одновременно заменить `top: 0` на высоту шапки: `.shell-header` — `position: sticky; z-index: 50` (`app.scss:8-9`) и перекрыла бы строку. Если такой размен не нужен — удалить `position: sticky` и оба комментария, которые обещают закрепление.

### 36. Разделить шаблон колонок протокола

- **Где**: `src/app/features/race/race-page.scss:12`
- **Проблема**: `$race-columns` и `$columns` в `preview/participants-table.scss:9` идентичны, кроме шестого трека (44 px против 62 px под шире гендерные переключатели); скопированы и комментарии над ними (`race-page.scss:8-11` / `participants-table.scss:5-8`), и строки шапки (`race-page.scss:191-202` / `participants-table.scss:20-31`), и ячейки (`:204-214` / `:34-46`). При этом `src/styles/_virtual-table.scss:2-4` объявляет себя единым источником для этих самых таблиц, а импортирует его один файл — `athlete-page.scss:5`.
- **Почему это важно**: колонка, добавленная в /races, молча разъезжается с /preview.
- **Что сделать**: в общий `src/styles/_protocol-cells.scss` (его уже подключают оба файла) добавить `@function columns($gender: 44px)` с одиннадцатью треками и миксины `header-row`, `header-cell`, `row` с общими grid/padding/gap. `race-page.scss` использует `p.columns()`, `participants-table.scss` — `p.columns(62px)`. Высоты строк не трогать: обе таблицы `autosize` с `padding: 10px 12px`, тогда как `vt.row` рассчитан на фиксированные 48 px.

### 37. Ландшафтная клавиша «ОТСЕЧКА» должна читать токен

- **Где**: `src/app/features/timer/tape-controls/tape-controls.scss:272`
- **Проблема**: базовая высота берётся из `var(--timer-floor-key)` (`:230`, комментарий `:224-225`), но в `@media (height <= 560px)` она переопределена литералом 48 px (`:272-276`), тогда как `timer-page.scss:396` в том же медиазапросе выставляет `--timer-floor-key: 64px` на `.timer__actions` — родителе `<app-timer-tape>` (`timer-page.html:151-172`). `.timer__actions` — `align-items: flex-end` (`timer-page.scss:284`), так что расхождение видно ступенькой.
- **Почему это важно**: телефон лёжа — обычная поза хронометриста; две самые нажимаемые клавиши гонки визуально разъезжаются. Комментарий `:270-271` про «вернуть восемь пикселей» писался под старую базу 56 px, то есть это дрейф, а не намерение.
- **Что сделать**: удалить блок `tape-controls.scss:270-276` — `height: var(--timer-floor-key)` на строке 230 внутри этого медиазапроса уже даёт 64 px.

### 38. Перевести подтверждение удаления в /admin на нативный `<dialog>`

- **Где**: `src/app/features/admin/admin-page.scss:400`
- **Проблема**: `admin-page.html:271-277` — `<div class="admin__modal-backdrop">` и `<div role="dialog" aria-modal="true">`, стилизованные `position: fixed; z-index: 100` (`admin-page.scss:400-419`). Глобальная блокировка скролла ловит только `body:has(dialog[open])` (`styles.scss:87-91`), поэтому список гонок продолжает скроллиться под неподвижным окном; нет `::backdrop`, top layer, ловушки фокуса и Escape. Ту же панель уже описывают `confirm-dialog.scss:9-22` (радиус `--radius`) и `badge-catalog.scss:3-14` (`--radius-md`) — радиусы уже разошлись.
- **Почему это важно**: /admin за авторизацией и им пользуется один человек, так что это раздражение, а не отказ.
- **Что сделать**: превратить разметку в настоящий `<dialog>` + `showModal()` по образцу `confirm-dialog.ts:51` — Escape, ловушка фокуса и существующая блокировка скролла достанутся бесплатно. Общий партиал `_dialog.scss` опционален; если делать, миксин должен вызываться из `:host` (у `confirm-dialog` диалогом является сам хост, `confirm-dialog.scss:9`).

### 39. Свести спиннеры и блики к токенам

- **Где**: `src/app/shared/db-freshness-banner/db-freshness-banner.scss:24`
- **Проблема**: `_tokens.scss:97` объявляет `--time-breathe: 2s` «единственными двумя бесконечными циклами, что мы разрешаем» (эхо в `home-page.scss:535`), а в проекте одиннадцать бесконечных анимаций на литеральных секундах. Две пары кейфреймов совпадают байт в байт: `db-freshness-banner-spin` (`:51-55`) и `race-pdf-spin` (`race-page.scss:372-376`); `race-pdf-sheen` (`race-page.scss:378-382`) и `photo-strip-sheen` (`photo-strip.scss:84-88`). Прочие сырые длительности: `race-page.scss:114` (1.4s), `:132` (900ms), `photo-strip.scss:51` (1.6s), `db-freshness-banner.scss:24` (900ms), `result-page.scss:154` (1.8s), `:199` (1.4s), `self-picker.scss:66` (2.4s).
- **Почему это важно**: видимого симптома нет, но правка одного спиннера не доедет до второго.
- **Что сделать**: завести `--time-spin` и `--time-sheen` в `_tokens.scss`, вынести по одной паре `@keyframes` в общий партиал, поправить устаревший комментарий про «два цикла». Спиннеры не взаимозаменяемы напрямую: баннер красится `--accent-line`/`--accent`, а кнопка PDF — `currentcolor`, потому что стоит на акцентной заливке, — общий миксин обязан принимать оттенок параметром. `--time-hold` (`_tokens.scss:96`) действительно не используется и удаляется; `--time-count-up` оставить — его зеркалит `count-up.constant.ts:1-2`.

## Тесты и инструменты

### 40. Гонять eslint (и опционально тесты) в pre-push

- **Где**: `.husky/pre-push:1`
- **Проблема**: хук делает только `bunx tsc -p tsconfig.app.json --noEmit`, то же для `tsconfig.spec.json` и `bun run stylelint:check`. Ни eslint, ни юнит-тестов. `package.json:20` определяет `check:code-quality` и не вызывается ниоткуда.
- **Почему это важно**: вся работа идёт прямо в `main` (в последних 40 запусках CI нет ни одного `pull_request`), и провал ловится уже после пуша: run 30630490281 упал на `Coverage for lines (99.93%) does not meet global threshold (100%)`, ещё два — на таймаутах тестов. Сайт при этом не ломается (красный `quality` просто не пускает деплой), так что это трение разработки.
- **Что сделать**: дописать в `.husky/pre-push` `bun run eslint` и `bun run madge` (оба быстрые и детерминированные; eslint в CI ~20 с). `bun run test:coverage` безусловно не добавлять — 60–70 с на каждый пуш; если добавлять, то с выключателем: `[ "$HUSKY_SKIP_TESTS" = "1" ] || bun run test:coverage`. Раннер использует `sh -e` (`.husky/_/h:17`), так что первая же ошибка прервёт хук.

### 41. Типизировать `scripts/`

- **Где**: `tsconfig.scripts.json:1`
- **Проблема**: конфиг перечислен как project reference в `tsconfig.json:33`, но никогда не собирается: ни хук, ни CI его не зовут, `scripts` в `.eslintignore:8`, а `.eslintrc.cjs:90` знает только про app и spec. Bun срезает типы без проверки. `bunx tsc -p tsconfig.scripts.json --noEmit` даёт 17 ошибок: 16 в `scripts/build-course-track.ts` (почти все — TS4111 из `noPropertyAccessFromIndexSignature`) и одна в `scripts/fix-handygo-name.ts` (разовая правка данных).
- **Почему это важно**: 13 скриптов импортируют `../src/app/core/**` и являются задокументированным ручным путём обслуживания БД (backfill-weather, verify-notes, backfill-vk-posts, вставки через `applyEventToDb`). Сейчас они компилируются чисто, но ничто не удержит их от гниения при смене интерфейсов. В CI работают `scripts/write-version.ts`, `scripts/bump-version.ts` (`ci.yml:138-139`) и `scripts/build-sqlite-assets.ts` с патчем HEAD-gzip, от которого зависит всё чтение БД.
- **Что сделать**: добавить `bunx tsc -p tsconfig.scripts.json --noEmit` в `.husky/pre-push` и в джоб `quality`, починить 17 ошибок (16 — механические переходы на доступ через скобки в одном файле). Снятие `scripts` с `.eslintignore` — отдельный шаг, не смешивать.

### 42. Проверять пререндер параметризованных маршрутов в CI

- **Где**: `.github/workflows/ci.yml:170`
- **Проблема**: smoke-check (`:170-178`) проверяет `index.html`, base href и наличие файла БД. Ни один гейт не смотрит на `app.routes.server.ts` — файл в `.eslintignore:20`, без спеки и вне отчёта покрытия, а `getPrerenderParams` на `:27` и `:32` строит списки слагов и годов запросом к БД.
- **Почему это важно**: бросающий `getPrerenderParams` уронит сборку громко, так что сценарий узкий — молча деградирует только запрос, легально вернувший ноль строк. Но тогда `/races/:slug` и `/year/:year` превращаются в отскок 404.html → index.csr.html: хуже LCP и нет краулимого HTML.
- **Что сделать**: дописать в тот же шаг `test "$(find dist/parkrun/browser/races -mindepth 2 -name index.html | wc -l)" -gt 0`, то же для `year/`, и `test -f dist/parkrun/browser/timer/index.html` (от него зависит холодный офлайн-старт, см. комментарий `app.routes.server.ts:20-21`). Сверку с числом событий в БД не делать — это дублирование проверяемого запроса на bash.

### 43. Пушить бамп версии после успешной сборки

- **Где**: `.github/workflows/ci.yml:136`
- **Проблема**: шаг «Bump version on code change» заканчивается `git push origin HEAD:main` (`:145`), а `Build` начинается на `:147`, sha-копия БД — `:158`, smoke-check — `:170`, загрузка артефакта — `:205`. Любой провал после пуша оставляет в `main` версию, которая никогда не деплоилась, а `[skip ci]` гарантирует, что ничто не перезапустится.
- **Почему это важно**: посетитель ничего не заметит (живой сайт продолжает отдавать прошлый бандл), расходятся только `package.json` / `app-version.constant.ts` в `main`; следующий зелёный прогон исправит. В последних 40 запусках такого не случалось.
- **Что сделать**: коммитить локально до сборки, а пушить отдельным шагом после `Upload Pages artifact`. Учесть гонку: между сборкой и пушем на `main` может приземлиться публикация, и `git push origin HEAD:main` отклонится non-fast-forward уже после загрузки артефакта. Поэтому либо `git pull --rebase --autostash origin main && git push`, либо `continue-on-error: true` на шаге пуша, чтобы потерянный бамп никогда не стоил деплоя.

### 44. Определиться с jscpd

- **Где**: `package.json:19`
- **Проблема**: `"jscpd": "jscpd ./src"` не вызывается ни из `.github/workflows/`, ни из `.husky/`, конфигурации `.jscpd.json` нет, порога нет — упасть скрипт не может. Прогон `bunx jscpd ./src --min-lines 10 --min-tokens 70 --ignore '**/*.spec.ts,**/*.mock.ts'` даёт 38 клонов и 4,09 % дублирования SCSS; крупнейшие — `timer-page.scss` `[56:11-79:4]` ≡ `[119:11-142:4]` (24 строки) и пара сервисов длительностей из пункта 19.
- **Почему это важно**: мёртвый инструмент создаёт ложное ощущение гейта.
- **Что сделать**: сначала погасить два очага (плейсхолдер SCSS для кнопки-иконки 44 px в `timer-page.scss`; один сервис длительностей с ключом хранилища через InjectionToken). Жёсткий порог 5 при измеренных 4,09 % не ставить — 0,9 пункта запаса зарубит `main` на первом же законном похожем блоке. Либо запускать jscpd отчётом без блокировки, либо удалить скрипт.

## Пропущенные области

### 45. Дать каждой странице свои og-теги и description

- **Где**: `src/index.html:153`
- **Проблема**: Angular-сервиса `Meta` в проекте нет вообще (`CanonicalLinkService` правит только `<link rel=canonical>`, маршруты задают только `title`). `og:url` захардкожен корнем сайта (`:153`), `og:title`/`og:description` — `:148/151`, `description` — `:10`. Проверено на сборке: во всех 271 пререндеренных протоколах `og:url` = `https://asdalexey.github.io/sundayrun/`.
- **Почему это важно**: распространение сайта — это ссылки в Telegram/VK/WhatsApp (под это есть и `race-announcement`, и `share.service`), и каждая из них показывает превью главной и указывает краулерам на `/`.
- **Что сделать**: завести `PageMetaService` рядом с `CanonicalLinkService` в `shared/seo`: инжектит `Meta`, на `NavigationEnd` обновляет `og:url` (переиспользуя url, уже посчитанный каноническим сервисом), `og:title` из разрешённого title маршрута и `description`/`og:description` из строки страницы. `RacePage`, `YearPage`, `AthletePage`, `VersusPage` должны отдавать осмысленное предложение («Протокол №N от 26 июля 2026 — 12 финишёров, лучшее время 17:31,07»). Сервис работает и под пререндером, так что 271 статический файл получит теги на сборке.

### 46. Убрать 404 с маршрутов атлета и дуэли

- **Где**: `.github/workflows/ci.yml:185`
- **Проблема**: `app.routes.server.ts` оставляет `/athletes/:key` и `/vs/:left/:right` на `RenderMode.Client`, файла на Pages нет, отвечает `404.html` (heredoc `ci.yml:187-202`, в `<head>` только `<title>`). Проверено вживую: `/athletes/popov-aleksey` → 404, `/vs/a/b` → 404, все пререндеренные — 301→200. Восстановление маршрута в `src/index.html:225-236` завёрнуто в `try { … } catch {}`: при недоступном `sessionStorage` `replaceState` не случится, url останется `index.csr.html`, и `{ path: '**', redirectTo: '' }` высадит гостя на главной без объяснений.
- **Почему это важно**: это ровно те ссылки, которыми делятся («посмотри мой профиль», «наша дуэль»), и краулеры с превьюшниками видят по ним 404 без единого og-тега.
- **Что сделать**: добавить `getPrerenderParams` для `athletes/:key` — ключи перечислимы тем же способом, каким `AthletesService` обслуживает `loadEventSlugs`. `/vs/:left/:right` комбинаторен: перевести его на query-параметры (`/vs?left=…&right=…`) поверх уже пререндеренного `/vs`, что убирает путь 404 целиком. Минимальная мера, если ни то ни другое: скопировать og-теги сайта в `<head>` `404.html` и при недоступном `sessionStorage` передавать маршрут через фрагмент (`index.csr.html#/athletes/…`).

### 47. Починить sitemap.xml

- **Где**: `public/sitemap.xml:19`
- **Проблема**: в карте четыре URL, один из них — `/athletes`, который в `app.routes.ts:118` является клиентским `redirectTo: 'records'` без серверного маршрута, то есть отдаётся SPA-обработчиком 404 (проверено: HTTP 404). При этом 271 пререндеренный протокол и 8 обзоров года — фактический индексируемый контент — в карте отсутствуют.
- **Почему это важно**: 404 по адресу из sitemap — сигнал качества обхода против всего сайта. `docs/SEO.md:12-14` фиксирует пропуск как «идею на будущее», а `docs/SEO.md:69` до сих пор советует отправлять `…/ru/sitemap.xml` — путь, которого нет с переходом на `--base-href /sundayrun/`.
- **Что сделать**: удалить запись `/athletes` (или добавить `{ path: 'athletes', renderMode: RenderMode.Prerender }`, чтобы получился настоящий редирект). Генерировать sitemap на сборке из той же локальной БД, которую читает `getPrerenderParams`: маленький скрипт, по одному `<url>` на слаг события и на год, `<lastmod>` из `events.date_iso`, вызов рядом с `scripts/write-version.ts`. Заодно поправить `/ru/` в `docs/SEO.md:69`.

## Порядок работ

### Волна 1 — быстрые победы (~1 день)

34 (объявить CSS-переменные), 3 (порядок записи сессии), 2 (lapOnly), 15 (`triggerBlobDownload`), 4 (клэмп времени), 25 (`aria-hidden` с часов), 13 (hammerjs), 37 (`--timer-floor-key`), 33 (регион Coros), 32 (клэмп колонки xlsx), 27 (assertive), 31 (права CI), 40 (eslint в pre-push), 42 (smoke-check пререндера).

### Волна 2 — средние (~3–4 дня)

14 (перенос эффекта в `TimerRaceService`), 20 (`pointercancel`), 16 (сброс `ProtocolStateService`), 1 (потерянный участник протокола), 22 (контраст плиток), 26 (тап-таргеты), 24 (ARIA табов), 35 (липкая шапка), 36 (общая сетка колонок), 38 (нативный диалог /admin), 39 (спиннеры и блики), 41 (tsc для `scripts/`), 43 (порядок бампа версии), 47 (sitemap), 29 (текст `docs/ADMIN_TOKEN.md`), 19 (сервисы длительностей).

### Волна 3 — крупные (~1–2 недели)

9 (замена sqlite wasm) и 6 (цельная загрузка БД на клиентских маршрутах) — делать одной задачей, они решаются одним транспортом. Далее 5 (сводка ростера в `meta`), 45 (`PageMetaService`), 46 (пререндер атлета, query-based /vs), 10 (разделение prefetch в SW), 11 и 12 (инкрементальная гидрация и `@defer`), 21 (нативные шторки таймера), 28 (PAT вне общего origin) вместе с 29 (data-only репозиторий), 30 (пиннинг ref при коммите), 17, 18, 23, 44.

## Что проверить после каждой волны

```bash
# Типы и стиль (всё, что уже гоняет pre-push)
bunx tsc -p tsconfig.app.json --noEmit
bunx tsc -p tsconfig.spec.json --noEmit
bun run stylelint:check
bun run eslint
bun run madge

# Точечные тесты по затронутому участку.
# Флага --test-path-pattern у @angular/build:unit-test нет — область задаётся через --include,
# который принимает glob и повторяется столько раз, сколько нужно участков.
npx ng test --include='src/app/core/timer/**/*.spec.ts' --coverage=false --watch=false
npx ng test --include='src/app/features/timer/**/*.spec.ts' --coverage=false --watch=false
npx ng test --include='src/app/core/protocol/**/*.spec.ts' --coverage=false --watch=false
npx ng test --include='src/app/features/result/**/*.spec.ts' --coverage=false --watch=false

# Полный прогон с порогом покрытия — перед пушем волны целиком
bun run test:coverage

# Сборка и smoke по артефакту (волны 2 и 3)
bun run build
ls -l dist/parkrun/browser/index.html dist/parkrun/browser/data/sundayrun.db
find dist/parkrun/browser/races -mindepth 2 -name index.html | wc -l   # ожидается > 0
find dist/parkrun/browser/year -mindepth 2 -name index.html | wc -l    # ожидается > 0
test -f dist/parkrun/browser/timer/index.html                          # холодный офлайн-старт
# Число `<app-race-card>` в /races после п.11 НЕ падает и падать не должно: инкрементальная
# гидрация на то и инкрементальная, что разметка остаётся в статике, а откладывается гидрация.
# Проверять надо теги: `ngh=` на карточках и собственный og:url у протокола.
grep -o '<meta [^>]*property="og:url"[^>]*>' dist/parkrun/browser/races/*/index.html | head -1

# После правок в scripts/
bunx tsc -p tsconfig.scripts.json --noEmit

# После правок в CSS-токенах — не осталось потребителей без объявления
grep -rn -- '--card-border\|--card-bg\|--text-tertiary\|--red' src/ | grep -v '_tokens.scss'
```
