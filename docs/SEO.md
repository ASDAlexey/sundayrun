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
- **Графика** — favicon (`favicon.ico`, `logo-mark.png`), `apple-touch-icon.png`, `og-image.png`
  собраны из официального логотипа пробега (исходники в `assets/branding/`).

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
