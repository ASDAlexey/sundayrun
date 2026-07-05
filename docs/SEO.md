# SEO

Что уже сделано в приложении и что нужно сделать руками после деплоя.

## Сделано в коде

- **`src/index.html`** — расширенные `title`/`description`/`keywords`, `author`, `theme-color`;
  Open Graph (`og:*` + `og:image` 1200×630) и Twitter Cards; `hreflang` (ru/en/x-default);
  JSON-LD (`WebSite`, `SportsOrganization` КЛБ «Легенда» с `sameAs` на VK, `EventSeries` пробега);
  `preconnect`/`dns-prefetch` к `cdn.jsdelivr.net`.
- **Заголовки страниц** — `title` у каждого маршрута в `app.routes.ts` (локализованы через `$localize`).
- **`public/sitemap.xml`** — главная и «Участники» в обеих локалях с `xhtml:link hreflang`.
  Страницы забегов (`/races/<slug>`) в sitemap не перечислены — поисковики находят их по внутренним
  ссылкам с главной; генерация полного sitemap при публикации забега — идея на будущее (ROADMAP).
- **Графика** — favicon (`favicon.ico`, `logo-mark.png`), `apple-touch-icon.png`, `og-image.jpg`
  собраны из официального логотипа пробега (исходники в `assets/branding/`).

## Производительность (PageSpeed)

Замер Lighthouse (mobile, локальный сервер с brotli, прод-сборка): главная, `/admin`, `/athletes` —
**Performance 97, Accessibility 100, CLS ≈ 0**. На реальном GitHub Pages (HTTP/2 + CDN) быстрее.

Что сделано:

- **Картинки**: карта трассы — AVIF 42 КБ (+ WebP-фолбэк 100 КБ) вместо JPEG 540 КБ через `<picture>`;
  логотип в шапке/футере — WebP 4 КБ; у всех `<img>` заданы `width`/`height` (нет сдвигов),
  `loading="lazy"` + `decoding="async"` ниже первого экрана. OG-картинка — JPEG 59 КБ
  (соцсети не понимают AVIF/WebP). Исходники — в `assets/branding/` (в деплой не попадают).
- **Шрифты**: самостоятельный хостинг в `public/fonts` (variable woff2, только latin+cyrillic),
  `@font-face` инлайном в `index.html` + `<link rel="preload">` — сдвиг от подмены шрифта убран
  полностью (CLS был 0.55). Пакеты `@fontsource-variable/*` удалены.
- **Маршруты**: публичные страницы (главная, протокол, участники, атлет, admin) собраны eagerly —
  ленивый чанк давал прыжок футера (CLS 0.49) и лишний roundtrip до LCP. Ленивыми остались
  только шаги визарда организатора (upload/preview/result) — они тянут xlsx/pdf-машинерию.

Известные локальные «минусы» Lighthouse, которых не будет на проде: `robots.txt is not valid`
(локальный SPA-сервер отдаёт index.html вместо 404) и ошибка консоли от jsDelivr 404
(репозиторий `protocols` ещё пуст — уйдёт после первой публикации).

Полные 100 по Performance на медленной мобилке гарантирует только prerender/SSG (см. ROADMAP).

## Ограничения GitHub Pages (важно понимать)

- Это SPA без SSR: Google и Яндекс рендерят JS, но индексация медленнее, чем у статических страниц.
  Prerender/SSG — кандидат в ROADMAP, если понадобится глубокая индексация протоколов.
- `robots.txt` работает только в корне домена (`asdalexey.github.io`) и принадлежит
  корневому сайту-портфолио, а не этому репозиторию. Он не обязателен: страницы и так
  индексируются, а sitemap отправляется напрямую в консоли поисковиков.
- `index.html` общий для локалей ru/en, поэтому статические `og:url`/`og:image` указывают на `/ru/`.

## Что сделать руками после деплоя (однократно)

1. **Google Search Console** — <https://search.google.com/search-console>:
   добавьте ресурс «URL prefix» `https://asdalexey.github.io/sundayrun/`,
   подтвердите правами на аккаунт GitHub Pages (HTML-тег можно добавить в `index.html`),
   затем Sitemaps → отправьте `https://asdalexey.github.io/sundayrun/ru/sitemap.xml`.
2. **Яндекс Вебмастер** — <https://webmaster.yandex.ru>:
   добавьте сайт, подтвердите метатегом (`<meta name="yandex-verification" ...>` в `index.html`),
   отправьте тот же sitemap; в «Регионах» укажите Таганрог.
3. **VK** — в описании сообщества добавьте ссылку на сайт: обратные ссылки с живого
   сообщества — главный локальный сигнал для Яндекса.
4. После первых публикаций проверьте сниппеты: <https://validator.schema.org> и
   «Проверка ответа сервера» в Вебмастере.
