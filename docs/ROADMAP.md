# Дорожная карта

Статусы: ✅ сделано · 🔄 в работе · ⬜ не начато

Полный утверждённый план: см. [ARCHITECTURE.md](./ARCHITECTURE.md).

## Фаза 0 — Каркас ✅

- ✅ Angular 22 workspace: standalone, zoneless, OnPush, signals
- ✅ Дизайн-система Litely из portfolio: `src/styles/_tokens.scss`, `_typography.scss`, `_card.scss`, `_section.scss`
- ✅ Линтеры из portfolio: ESLint (+ кастомный `eslint-local-plugin`), Stylelint (+ `stylelint-rules`), Prettier
- ✅ Vitest с порогом покрытия 100% (`vitest-base.config.ts`)
- ✅ Husky-хуки (pre-commit: prettier; pre-push: tsc + stylelint), madge (циклические зависимости), jscpd
- ✅ i18n: source locale **ru** (приоритетный), en — перевод (`src/locale/messages.en.xlf`)
- ✅ CI/CD: `.github/workflows/ci.yml` — lint → тесты (100% coverage) → сборка ru+en → деплой на GitHub Pages с редиректом `/` → `/ru/`
- ✅ Проверено: `bun run check:code-quality`, `bun run test`, `bun run build` — зелёные

## Фаза 1 — Доменное ядро ✅

Чистый TS без Angular в `src/app/core/`, всё покрыто юнит-тестами на 100%.

- ✅ `models/` — Participant, RaceEvent, ProtocolRow, AthleteRecord/AthletesHistory, enum'ы пола
- ✅ `time/duration.ts` — парсинг `"0:19:03,028"` → целые мс, формат `m:ss` / `h:mm:ss`
- ✅ `gender/` — словарь русских имён + эвристики окончаний → пол с уровнем уверенности
- ✅ `protocol/protocol-builder.ts` — места по полу (5 км), сортировка, DNF в конец
- ✅ `history/notes-builder.ts` — авто-примечания: «Первое участие», «ЛР (было X)», «Лучший результат YYYY г.»
- ✅ `history/athletes-rollup.ts` — сводная история спортсменов (все забеги, лучшие за всё время и по годам)

## Фаза 2 — Парсинг Excel ✅

- ✅ `xlsx/xlsx-reader.ts` — распаковка xlsx (fflate) + DOMParser, sharedStrings/inlineStr, пропуски ячеек
- ✅ `xlsx/timer-export-parser.ts` — строки листа → участники; скип блока «NOTE!», DNF, недостающие круги
- ✅ Фикстуры-тесты на реальных файлах `assets/14.06.2026.xlsx` и `assets/24.05.2026.xlsx`

## Фаза 3 — Состояние и загрузка ✅

- ✅ `state/protocol-state.service.ts` — signal store (участники, событие, шаг мастера)
- ✅ Страница `/upload` — drag-drop xlsx
- ✅ Роутинг `/upload → /preview → /result` + `/archive`, guards по состоянию

## Фаза 4 — Предпросмотр и правка ✅

- ✅ Таблица участников: подсветка неуверенно определённого пола, тумблер М/Ж
- ✅ Редактирование примечаний (авто-подстановка из истории)
- ✅ Форма события: № пробега, дата, город, парк, клуб, председатель
- ✅ Кнопка «Сгенерировать» заблокирована, пока есть участники с неопределённым полом

## Фаза 5 — Генерация PDF ✅

- ✅ `core/pdf/protocol-doc-definition.ts` — чистая функция → структура pdfmake (шапка, таблица с двойными колонками Время/Место, сокращения, подпись)
- ✅ `pdf/pdf.service.ts` — динамический импорт pdfmake, шрифт PT Serif (кириллица), Blob
- ✅ Страница `/result`: предпросмотр (iframe), скачать, поделиться (Web Share)
- ✅ **Публикация в ВК**: авто-описание (`core/share/race-announcement.ts` — № пробега, дата, число участников, победители М/Ж), редактируемый textarea, «Скопировать описание», «Открыть репост ВК» (`vk.com/share.php`); на мобильном — Web Share с PDF-файлом
- ✅ Сверка структуры с образцом `assets/20.09.2020.pdf` (шапка, интро, двухрядная шапка таблицы, DNF/DSQ, подпись)

## Фаза 6 — Публикация и архив ✅

- ✅ `github/github-storage.service.ts` — атомарный коммит в публичный репозиторий `protocols` через GitHub Git Data API (токен организатора, localStorage через `github/admin-token.service.ts`, retry в ядре коммита, баннер при 401 на `/result`)
- ✅ Один коммит = `events/<дата>/{source.xlsx, protocol.pdf, results.json}` + обновлённые `index.json` и `athletes.json`; кнопка «Опубликовать в архив» на `/result`, после успеха репост ВК ссылается на PDF в архиве (sha-pinned jsDelivr url)
- ✅ **Главная страница `/` — список забегов, сверху самый свежий** (`github/archive.service.ts`: `index.json` через jsDelivr CDN; raw.githubusercontent не используем — блокируется в РФ). Просмотр/скачивание PDF прямо из списка, отдельные состояния «пусто» и «ошибка сети», пометка о задержке CDN
- ✅ **Админ-режим**: сверху главной — блок «Загрузить забег» (вход в мастер `/upload`), виден только админу (в браузере сохранён GitHub-токен организатора). Остальные посетители — только просмотр. Вход в админ-режим — неприметная ссылка «для организатора» → `/admin` (проверка fine-grained PAT, сохранение/удаление); `adminGuard` закрывает `/upload`, `/preview`, `/result`

## Фаза 7 — Полировка ✅

- ✅ **Английский перевод**: `bun run generate-i18n` → `messages.xlf` (70 сообщений), `messages.en.xlf` заполнен полностью; сборка с `i18nMissingTranslation: "error"` — пропущенный перевод валит `bun run build`. PDF/примечания/ВК-анонс не локализуются (осознанно, см. архитектуру)
- ✅ **Доимпорт старой истории**: `github/history.service.ts` читает `athletes.json` авторизованным Contents API (jsDelivr отдал бы устаревший кэш при серийной загрузке); `ProtocolStateService.applyAutoNotes()` пересчитывает примечания всех участников через `buildAutoNote` поверх `historyBeforeDate` (история отсекается до даты события — перепубликация и доимпорт не сравнивают атлета с самим собой и с будущими результатами); на `/preview` кнопка «Подставить примечания из истории» (заблокирована без даты события, статусы загрузки/ошибки). Порядок доимпорта: от старых к новым; перепубликация идемпотентна
- ✅ **A11y-проход**: глобальный `:focus-visible`-outline, скип-линк «К содержимому» → `#main` на всех страницах, утилита `.visually-hidden`; `role="alert"` на ошибках и `aria-live="polite"`/`role="status"` на статусах (upload, preview, result, admin, races); `<th scope="col">` и скрытая пометка «пол не определён» в таблице участников; уникальные aria-label примечаний и PDF-ссылок (через `$localize` — i18n-атрибуты с интерполяцией компилятор отбрасывает)
- ✅ **CI/деплой**: prettier:check и madge в quality-джобе; build/deploy также по `workflow_dispatch`; smoke-проверка сборки (ru/en index + base href); корневой редирект `/` → `/ru/` продублирован скриптом; SPA-fallback `404.html` (spa-github-pages: сохранение пути в sessionStorage + восстановление в `index.html`); deploy в отдельной concurrency-группе `pages` без cancel-in-progress
- ✅ README переписан (роли, настройка репозитория `protocols`, PAT, доимпорт, деплой Pages), ARCHITECTURE дополнена

## Фаза 8 — Страницы атлетов ✅

Данные для этого копятся в `results.json`/`athletes.json` с первого же опубликованного протокола.

- ✅ **Анонимное чтение с CDN**: `github/athletes.service.ts` (`athletes.json`, promise-кэш на сессию) и `github/results.service.ts` (`events/<slug>/results.json`, кэш по slug); 404/403 jsDelivr = «ещё не публиковалось», ошибка сети/сервера — отдельное состояние; упавший запрос выбрасывается из кэша (перезагрузка повторяет). Ядро: `core/github/results-file.ts#parseEventResultsFile` (schema-guard без `as`), `core/github/event-slug.ts` (валидация `YYYY-MM-DD` до похода в CDN), `core/history/athletes-list.ts` (поиск с нормализацией ключа + сортировки), `core/history/athlete-runs.ts` (годы, фильтры, сортировки, рекорды по годам)
- ✅ **Онлайн-протокол `/races/:slug`**: шапка (№, дата, город/парк, участники, PDF с CDN), таблица как в PDF (№, Спортсмен, Время 2,3/5, Пол, Место М/Ж, Клуб, Примечание; `th scope="col"`); имя — ссылка на страницу атлета с aria-label через `$localize`; состояния loading/notFound/error (`role="status"`/`role="alert"`)
- ✅ **Список атлетов `/athletes`**: поиск по имени (регистр/пробелы/«ё» нормализуются как в ключах истории), сортировка по лучшему времени 5 км (без результата — в конец) и по числу участий (тай-брейк — имя по-русски), кнопки с `aria-pressed`; пустая история — подсказка про первые протоколы и задержку CDN
- ✅ **Страница атлета `/athletes/:key`**: участия/финиши, лучшее за всё время и по годам (только 5 км), таблица забегов (дата — ссылка на онлайн-протокол, дистанция, время), фильтры по году и дистанции + сортировка по дате/времени; DNF-only — «Финишей пока нет»; «атлет не найден» упоминает возможную задержку CDN
- ✅ **Переходы**: карточки на главной получили «Протокол онлайн» (`/races/<slug>`), строки онлайн-протокола ведут на атлетов, забеги атлета — обратно на протоколы
- ✅ i18n: `messages.en.xlf` заполнен полностью (ru/en по 127 trans-unit, включая `$localize`-строки из TS; сборка с `i18nMissingTranslation: "error"` зелёная); общие миксины `styles/_table.scss` и `button-toggle` вместо копипасты SCSS; всё покрыто на 100%

## Как проверять (на каждой фазе)

```bash
bun run check:code-quality   # prettier + eslint + stylelint
bun run test                 # vitest, покрытие 100%
bun run build                # прод-сборка ru+en
bun run madge                # циклические зависимости
```

Сквозная проверка: загрузить оба xlsx из `assets/` → PDF совпадает с образцом; повторная загрузка второго файла даёт «ЛР (было …)» у повторных участников и «Первое участие» у новых.
