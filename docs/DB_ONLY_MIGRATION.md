# План: `sundayrun.db` — единственный источник истины, JSON удалить

Цель: убрать `data/index.json`, `data/athletes.json`, все `data/events/*/results.json` и
сделать `sundayrun.db` единственным источником данных. `version.json` остаётся (это указатель
на SHA, а не данные). `site-meta.json` — отдельное решение (см. Фазу 6).

Статус на момент написания (2026-07-11): чтение уже **db-first с JSON-фолбэком** во всех трёх
сервисах (`archive.service`, `athletes.service`, `results.service`). Этот план убирает
JSON-фолбэк и переносит две оставшиеся роли JSON (пререндер + канонический источник) на БД.

---

## Почему JSON вообще ещё нужен (что закрываем)

| Роль JSON                       | Где                                        | Чем заменяем                                                                 |
| ------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| Рантайм-фолбэк при сбое range   | `*.service.ts` `catch → fetch json`        | авто-ретрай range → иначе error-state с reload (Фаза 3)                      |
| Пререндер (SSG в Node)          | build-time чтение                          | Node-адаптер `ProtocolDb`, читает локальный `.db` (Фаза 1–2)                 |
| Канонический источник / rebuild | `scripts/build-db.ts` строит `.db` из JSON | `.db` — источник; rebuild из git-истории `.db` или из `source.xlsx` (Фаза 6) |

Ключ: пререндер печёт HTML на билде **из локального файла** — range там не участвует, сбоить
нечему. Кнопка-reload нужна только клиентскому до-фетчу (свежесть + события, опубликованные
после последнего деплоя, которых нет в пререндере).

---

## Гардрейлы проекта (соблюдать во всех фазах)

- **Покрытие 100%** (istanbul, порог в `vitest-base.config.ts`) — каждая новая ветка покрыта.
- **Запрещён `as`** (`consistent-type-assertions: 'never'` в проде) — маппинг через `asString`/
  `asNumber`/`asNumberOrNull`/`asGender` из `protocol-db-row.ts`.
- **`no-restricted-globals`** — никаких глобальных `document`/`window`/`setTimeout`; инжектить
  `DOCUMENT`, брать таймеры из Angular-контекста.
- **`.mock.ts`** рядом с тестом (`import { vi } from 'vitest'`), никаких inline-моков в спеках.
- **`vi.mock` только для пакетов**, не для относительных импортов (Angular unit-test это
  запрещает) — зависимости подменять через DI (`useValue`).
- **Extraction rules** (`.claude/rules/ts-files.md`): константы → `.constant.ts`, интерфейсы →
  `.interface.ts`, типы → `.type.ts`.
- **Коммитит только пользователь** — не коммитить автоматически; в конце каждой фазы
  `bun run test` + `bun run check:code-quality` зелёные.
- Раннер — **bun** для скриптов; **ng build** гоняет пререндер в **Node** (важно для выбора
  SQLite-библиотеки, см. Фазу 1).

---

## Ключевые файлы (карта)

- Чтение (рантайм, браузер): `src/app/github/archive.service.ts`, `athletes.service.ts`,
  `results.service.ts`.
- БД-сервис (браузер, range): `src/app/github/protocol-db.service.ts`, интерфейс
  `protocol-db.interface.ts` (`ProtocolDb = { query }`), загрузчик `sqlite-http-loader.ts`.
- Запросы (переиспользуемые в любом адаптере): `src/app/github/protocol-db-queries.ts` +
  `.constant.ts`.
- Маппинг колонок: `src/app/github/protocol-db-row.ts`.
- Админ-чтение свежей истории: `src/app/github/history.service.ts` (авторизованный Contents API,
  сейчас читает `athletes.json`).
- Запись: `src/app/core/github/publish-event.ts`, `delete-event.ts`,
  `src/app/core/sqlite/protocol-db-write.ts`.
- Пути/схема JSON: `src/app/core/github/protocols-repo.constant.ts` (`INDEX_JSON_PATH`,
  `ATHLETES_JSON_PATH`), `event-paths.ts`, `results-file.ts`, `history-file.ts`,
  `archive-index.ts`.
- Сборка `.db`: `scripts/build-db.ts`; бэкфилл индекса: `scripts/regenerate-index.ts`.
- Пререндер/сервер-конфиг Angular: `src/app/app.config.server.ts` (или аналог), `angular.json`
  (`outputMode: static`), `main.server.ts`.
- Данные: `data/index.json`, `data/athletes.json`, `data/events/*/results.json` (удаляем);
  `data/sundayrun.db`, `data/version.json` (оставляем); `data/site-meta.json` (Фаза 6).

---

## Фаза 1 — Node-адаптер `ProtocolDb` (чтение локального `.db`)

Цель: реализация `ProtocolDb { query(sql, params) }`, читающая **локальный файл**
`data/sundayrun.db` в Node, чтобы `protocol-db-queries.ts` работал и на билде.

Выбор библиотеки (важно — пререндер в Node, не в bun):

- Предпочтительно **`better-sqlite3`** (синхронный, стабильный, ставится на CI). Либо
  **`node:sqlite`** (встроен с Node 22.5+, экспериментальный) — проверить версию Node в CI.
  `bun:sqlite` НЕ подходит: `ng build` гоняет пререндер в Node-процессе.
- Читает файл целиком с диска (~780 КБ) — для билда это ок, никакого HTTP/range.

Шаги:

1. `src/app/github/protocol-db-node.ts` — фабрика `ProtocolDb`, открывающая файл по пути из
   env/конфига (по умолчанию `data/sundayrun.db` от корня). `query` мапит `$param` → нативные
   плейсхолдеры, возвращает `ProtocolDbRow[]` (тот же контракт, что браузерный сервис).
   - Не тянуть в клиентский бандл: файл только для сервер/скрипт-контекста (проверить, что
     `better-sqlite3` не попадает в браузерную сборку — держать за server-only импортом).
2. Спека + мок: поднять реальную мини-БД из `PROTOCOL_DB_SCHEMA_STATEMENTS`, вставить пару
   строк, прогнать `query` — покрыть маппинг параметров и пустой результат.

Acceptance: `selectArchiveEvents`/`selectEventResults`/`selectAthleteRecord` работают поверх
Node-адаптера в юнит-тесте; `better-sqlite3` не в браузерном чанке (`ng build`, проверить, что
lazy/initial чанки его не содержат).

---

## Фаза 2 — Пререндер на Node-адаптере

Цель: SSG-сборка читает данные из локального `.db`, а не из JSON.

Шаги:

1. В серверном DI (`app.config.server.ts`) переопределить провайдер `ProtocolDbService`
   (или общий токен `ProtocolDb`) на Node-адаптер из Фазы 1. Браузерный DI не трогаем.
   - Возможно, стоит ввести `InjectionToken<ProtocolDb>` и инжектить его в сервисы вместо
     конкретного `ProtocolDbService`, чтобы подмена в server-конфиге была чистой.
2. Убедиться, что пути к динамическим маршрутам (`/races/:slug`, `/athletes/:key`, `/records`)
   для пререндера берутся из БД (getPrerenderParams / роут-конфиг) — сейчас, вероятно, из JSON.
3. Прогнать `bun run build`, проверить, что HTML пререндера **непустой** и совпадает с данными
   (grep по имени атлета/номеру пробега в `dist/**/index.html`).

Acceptance: `dist/parkrun/browser/ru/**/index.html` для главной, `/records`, примера
`/races/<slug>` содержат реальные данные (не только скелет гидратации). Lighthouse-проверка
локально: CLS 0 / контент в SSR сохранён.

---

## Фаза 3 — Рантайм-устойчивость вместо JSON-фолбэка

Цель: убрать `catch → fetch json`, заменить на авто-ретрай range → иначе честный error-state.

Шаги:

1. Обёртка ретрая над `ProtocolDbService.query` (или над вызовами в сервисах): 1–2 повтора с
   короткой паузой на транзиентный сбой range. Пауза — через Angular-безопасный таймер (не
   глобальный `setTimeout`; см. гардрейлы).
2. В `archive/athletes/results.service.ts` убрать JSON-ветку: при финальном провале — пробросить
   ошибку, страница показывает существующий error-state (`role="alert"`) + кнопку «Перезагрузить»
   (reload через инжектнутый `DOCUMENT.defaultView.location.reload()` или router-navigation).
3. Обновить/добавить UI кнопки reload на страницах, где её ещё нет (races, athletes, records,
   result). i18n-ключи для текста ошибки/кнопки.
4. Тесты: сбой range с успешным ретраем (ошибки не видно), сбой всех ретраев → error-state +
   кнопка; проверить, что `fetch` JSON больше не вызывается нигде.

Acceptance: ни один рантайм-путь не обращается к `*.json`; сбой БД показывает error + reload;
ретрай покрывает транзиент.

---

## Фаза 4 — Запись без JSON

Цель: `publishEvent`/`deleteEvent` пишут только `source.xlsx` + `sundayrun.db` (+ `version.json`);
перестают писать/удалять `index.json`, `athletes.json`, `results.json`.

Шаги:

1. `publish-event.ts`: убрать сборку и коммит `index.json`/`athletes.json`/`results.json` из
   `CommitFile[]`. Оставить `source.xlsx`, `sundayrun.db`, обновление `version.json`.
2. `delete-event.ts`: убрать удаление трёх JSON; удалять `source.xlsx` события, переписывать
   `.db` (in-place, как уже делает `protocol-db-write.ts` `rewriteResults`/rollup), бампать
   `version.json`.
3. `protocol-db-write.ts`: убедиться, что весь rollup (`athletes`/`runs`/`participations`/
   `events`) и агрегаты индекса (`finisher_count`/`avg_time_ms`/`best_*`) считаются в БД —
   раньше часть жила в `buildIndexEntry` для `index.json`. Перенести недостающее в SQL/запись.
4. Обновить фикстуры/спеки публикации и удаления (сейчас ждут N JSON-файлов в коммите).

Acceptance: коммит публикации содержит только `source.xlsx` + `sundayrun.db` + `version.json`;
удаление — зеркально; все агрегаты, что раньше писались в `index.json`, теперь в таблице
`events`.

---

## Фаза 5 — Админ-импорт (`history.service`) на БД

Цель: серийный доимпорт старых забегов читает свежую историю из `.db`, а не из `athletes.json`.

Контекст: `history.service.ts` читает `athletes.json` через **авторизованный Contents API**
(не CDN — при серийной заливке CDN отдаёт устаревшее). Нужен эквивалент поверх `.db`.

Шаги:

1. Читать `data/sundayrun.db` через авторизованный Contents API (binary → base64 → байты), открыть
   in-memory (браузерный sqlite-wasm, тот что уже используется на запись в `protocol-db-write`),
   выполнить нужные select'ы (история атлета для авто-примечаний).
2. Заменить `parseAthletesHistory(...)` на select'ы из открытой БД. Переиспользовать
   `protocol-db-queries` где возможно.
3. Тесты: доимпорт от старых к новым остаётся идемпотентным; авто-примечания считаются от истории
   «до даты», как сейчас.

Acceptance: `/preview` авто-примечания и порядок доимпорта работают без `athletes.json`.

---

## Фаза 6 — `site-meta.json` и rebuild-источник (решения)

**`site-meta.json`** (объявление организатора, ~70 байт, читается напрямую):

- Вариант A (проще): оставить как отдельный крошечный JSON — он не участвует в дублировании
  архива, к «единственному источнику данных архива» отношения не имеет.
- Вариант B (чистый single-source): перенести в таблицу `meta` БД (`publish-site-meta.ts`,
  `site-meta.service.ts` → select/upsert). Больше кода.
- Рекомендация: **A** (оставить), если цель — убрать дублирование данных архива.

**rebuild-источник** (без JSON `.db` — единственный источник; что если побьётся):

- `scripts/build-db.ts` сейчас строит `.db` из JSON — после удаления JSON он лишается входа.
- Варианты пересборки: (1) из git-истории самих `.db` (откат к прошлому коммиту), (2) заново из
  `source.xlsx` всех событий (медленно, но `source.xlsx` остаётся в репо), (3) периодический
  экспорт `.db` → дамп `.sql` в артефакты CI как read-only бэкап.
- Рекомендация: сохранить `source.xlsx` (уже сохраняется) + добавить `scripts/build-db-from-xlsx.ts`
  как аварийный rebuild. Это заменяет роль JSON как «канонического» источника.

Acceptance: зафиксированы решения по site-meta и rebuild; при выборе B — миграция сделана и
покрыта.

---

## Фаза 7 — Git-чистка данных

Цель: физически удалить JSON из `data/`.

Шаги:

1. `git rm data/index.json data/athletes.json` и `git rm data/events/*/results.json`.
2. Обновить `.gitignore`/скрипты, если где-то ожидают эти файлы.
3. Purge jsDelivr по удалённым путям (или полагаться на новый `version.json` SHA — старые URL
   просто перестают запрашиваться).
4. Прогнать полный флоу локально: чистый чекаут → `bun run build` → пререндер непустой → dev-сервер
   отдаёт страницы из `.db`.

Acceptance: в `data/` только `sundayrun.db`, `version.json` (+ опц. `site-meta.json`); сайт и
пререндер работают.

---

## Фаза 8 — Уборка мёртвого кода JSON

Цель: удалить парсеры/схемы/фикстуры JSON, которые больше не нужны.

Кандидаты (проверить, что не используются после Фаз 3–5): `parseArchiveIndex`,
`parseAthletesHistory`, `parseEventResultsFile`, `buildEventResultsFile`, `history-file.ts`,
`results-file.ts`, `archive-index.ts` (парс-часть), связанные `.mock.ts`, константы путей
`INDEX_JSON_PATH`/`ATHLETES_JSON_PATH`, `jsDelivrFileUrl` вызовы для JSON.

Осторожно: часть форм (`ArchiveIndexEntry`, `EventResultsFile`, `AthleteRecord`) остаётся как
модель данных для UI/запросов — удалять только парсинг/фетч JSON, не сами интерфейсы.

Acceptance: `bun run madge` без циклов; нет неиспользуемых экспортов; 100% покрытие
(удалённый код не тянет за собой недостижимые ветки).

---

## Верификация (в конце каждой фазы и в конце)

```bash
bun run test                 # 100% покрытие
npx tsc --noEmit -p tsconfig.app.json
bun run check:code-quality   # prettier + eslint + stylelint
bun run build                # пререндер + сборка
bun run madge                # без циклов
# ручная проверка: dist/**/index.html содержит реальные данные (grep по имени/номеру)
```

Ручной smoke: `bun start`, открыть `/`, `/races`, `/races/<slug>`, `/athletes/<key>`, `/records`,
`/result` — данные грузятся из БД; сымитировать сбой range (throttle/DevTools) → error + reload.

---

## Риски и откат

- **Range на CDN у пользователя**: остаточный риск (Фаза 3 закрывает ретраем+ошибкой, не
  фолбэком). Мониторить.
- **`better-sqlite3` в CI**: нативная сборка — проверить, что ставится на раннере; иначе
  `node:sqlite` (проверить версию Node) или `sql.js` (WASM, чуть медленнее).
- **Пререндер-параметры динамических маршрутов**: если берутся из JSON — обязательно перевести на
  БД (Фаза 2), иначе часть страниц не запечётся.
- **Откат**: каждая фаза — отдельные коммиты; данные JSON лежат в git-истории, восстановимы
  `git checkout <sha> -- data/`. `.db` тоже версионируется в git.

---

## Порядок выполнения

1 → 2 (пререндер стабилен на БД) → 3 (рантайм без JSON-фолбэка) → 4 (запись без JSON) → 5 (админ)
→ 6 (решения) → 7 (git-чистка) → 8 (уборка кода). Не удалять JSON (Фаза 7) раньше, чем 1–5
зелёные — до этого JSON ещё несёт нагрузку.
