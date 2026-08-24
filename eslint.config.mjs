import js from '@eslint/js';
import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import localRules from 'eslint-plugin-local-rules';
import optimizeRegex from 'eslint-plugin-optimize-regex';
import rxjsX from 'eslint-plugin-rxjs-x';

// ESLint 10 больше не читает .eslintrc.* и .eslintignore — только flat config.
// Набор правил повторяет tooling-пакет meta-libs (`createLegacyConfig`) в том виде, в каком его
// потребляет meta-frontend, но целиком живёт здесь: sundayrun не зависит от @meta/libs.
// Сознательно не перенесено:
//   * `ngrx/*` — в проекте нет NgRx, состояние на сигналах;
//   * `change-detection-strategy/on-push` — с Angular 22 OnPush и так по умолчанию, а приложение
//     вдобавок zoneless (`provideZonelessChangeDetection`, zone.js нет и в зависимостях);
//   * `local-rules/enforce-decorated-filename` перенесён, но с таблицей соглашений ЭТОГО проекта:
//     компоненты и директивы здесь без суффиксов, поэтому правило сторожит `@Pipe` и DI-классы.
// Спековые правила (`no-object-define-property-in-specs`, `no-unasserted-console-spy`) ссылаются
// на `vitest-auto-spy` напрямую — meta-libs его только реэкспортирует, чужой рантайм не нужен.

const restrictedSyntax = [
  { selector: 'MethodDefinition[accessibility="private"]', message: 'Используйте методы с # вместо private' },
  { selector: 'PropertyDefinition[accessibility="private"]', message: 'Используйте поля с # вместо private' },
  {
    selector: "TSTypeReference[typeName.name='Subscription']",
    message: 'Subscription запрещён. Используйте альтернативы (например, takeUntilDestroyed).',
  },
  {
    selector: 'PropertyDefinition[value.callee.name=/^inject/][readonly!=true]',
    message: 'Зависимости из inject*(...) должны быть readonly.',
  },
  { selector: 'TSAsExpression > TSUnknownKeyword', message: 'Использование "as unknown" запрещено. Найдите правильную типизацию.' },
  {
    selector: "Property[key.name='changeDetection'][value.object.name='ChangeDetectionStrategy'][value.property.name='OnPush']",
    message: 'OnPush — стратегия по умолчанию начиная с Angular 22. Не указывайте changeDetection явно.',
  },
  {
    selector: "Decorator[expression.callee.name='Injectable']:has(Property[key.name='providedIn'][value.value='root'])",
    message: "Начиная с Angular 22, для синглтонов используйте @Service() вместо @Injectable({ providedIn: 'root' }).",
  },
];

const [cyrillicLiteral, cyrillicTemplateLiteral, cyrillicTextAttribute] = localRules.cyrillicI18nRestrictedSyntax;

const memberOrdering = [
  'error',
  {
    default: {
      memberTypes: [
        ['#private-readonly-field'],
        'static-field',
        'public-field',
        'protected-field',
        'private-static-field',
        'private-field',
        '#private-field',
        'abstract-field',
        'constructor',
        'public-method',
        'protected-method',
        'private-method',
        '#private-method',
        'abstract-method',
      ],
    },
  },
];

const eslintCommentRules = {
  '@eslint-community/eslint-comments/disable-enable-pair': 'error',
  '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
  '@eslint-community/eslint-comments/no-duplicate-disable': 'error',
  '@eslint-community/eslint-comments/no-unused-disable': 'error',
  '@eslint-community/eslint-comments/require-description': ['error', { ignore: [] }],
  '@eslint-community/eslint-comments/no-restricted-disable': ['error', '*'],
};

/**
 * Набор rxjs-правил meta-libs. Пакет другой: оригинальный `eslint-plugin-rxjs` заявляет peer
 * `eslint ^8` и зовёт снятый в ESLint 10 контекстный API, поэтому взят поддерживаемый форк
 * `eslint-plugin-rxjs-x` — правила те же, из переименований задето одно:
 * `rxjs/no-ignored-observable` там называется `no-floating-observables`.
 */
const rxjsRules = {
  'rxjs-x/ban-observables': 'error',
  'rxjs-x/ban-operators': 'error',
  'rxjs-x/finnish': [
    'error',
    {
      functions: false,
      methods: false,
      // Имена, которые диктует сам Angular: моки обязаны повторять `Router.events` и
      // `SwUpdate.versionUpdates`, поэтому `$` к ним не приставить. Список meta-libs — про то же.
      names: {
        '^(canActivate|canActivateChild|canDeactivate|canLoad|intercept|resolve|validate|actionsSubject|useValue|events|versionUpdates)$': false,
      },
      parameters: true,
      properties: true,
      strict: false,
      types: { '^EventEmitter$': false },
      variables: true,
    },
  ],
  'rxjs-x/no-create': 'error',
  'rxjs-x/no-cyclic-action': ['error', { observable: '[Aa]ction(s|s\\$|\\$)$' }],
  'rxjs-x/no-explicit-generics': 'error',
  'rxjs-x/no-floating-observables': 'error',
  'rxjs-x/no-ignored-replay-buffer': 'error',
  'rxjs-x/no-nested-subscribe': 'error',
  'rxjs-x/no-unbound-methods': 'error',
  'rxjs-x/no-unsafe-catch': 'error',
  'rxjs-x/no-unsafe-takeuntil': 'error',
  'rxjs-x/throw-error': 'error',
};

const commonTypeScriptRules = {
  '@typescript-eslint/no-deprecated': 'error',
  '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
  '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
  '@typescript-eslint/no-non-null-assertion': 'error',
  'padding-line-between-statements': ['error', { blankLine: 'always', prev: '*', next: 'if' }],
  'no-restricted-syntax': ['error', ...restrictedSyntax],
  'no-restricted-globals': [
    'error',
    { name: 'window', message: 'Используйте inject(DOCUMENT)/inject(WINDOW), а не глобальный window.' },
    { name: 'document', message: 'Используйте inject(DOCUMENT), а не глобальный document.' },
  ],
  '@angular-eslint/prefer-inject': 'error',
  '@typescript-eslint/no-empty-function': ['error', { allow: ['methods'] }],
  'dot-notation': 'off',
  '@typescript-eslint/dot-notation': ['error', { allowIndexSignaturePropertyAccess: true }],
  '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-unused-expressions': 'off',
  'import/no-duplicates': ['error', { considerQueryString: true }],
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-inferrable-types': 'error',
  '@typescript-eslint/explicit-function-return-type': 'error',
  '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
  '@typescript-eslint/member-ordering': memberOrdering,
  '@typescript-eslint/max-params': ['error', { max: 2 }],
  '@angular-eslint/use-lifecycle-interface': 'error',
  'no-console': ['error', { allow: ['info', 'time', 'timeEnd'] }],
  'optimize-regex/optimize-regex': 'error',
  'no-restricted-imports': [
    'error',
    {
      paths: [
        { name: 'rxjs', importNames: ['Subscription'], message: 'Использование Subscription запрещено. Используйте takeUntilDestroyed.' },
      ],
    },
  ],
  'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
  'object-shorthand': 'error',
  '@angular-eslint/no-output-on-prefix': 'error',
  '@angular-eslint/no-output-rename': 'error',
  '@angular-eslint/use-pipe-transform-interface': 'error',
  curly: 'error',
  '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
  '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
  '@typescript-eslint/prefer-includes': 'error',
  '@typescript-eslint/prefer-optional-chain': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': 'error',
  '@typescript-eslint/sort-type-constituents': 'error',
  eqeqeq: ['error', 'always'],
  ...eslintCommentRules,
  // К списку meta добавлены 'c'/'d' (канонические имена состояния MD5 и атрибут `d` у SVG-пути)
  // и 'M'/'F' — коды пола, которыми размечен архив.
  'id-length': [
    'error',
    { min: 2, exceptions: ['i', 'j', '_', 'x', 'y', 'z', 'a', 'b', 'c', 'd', 'r', 'g', 'h', 's', 'v', 'e', 'm', 'M', 'F', 'N', 'R'] },
  ],
  'id-denylist': ['error', 'val', 'obj', 'elem', 'tmp', 'temp', 'ret'],
  ...rxjsRules,
};

const productionTypeScriptRules = {
  'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
  '@angular-eslint/prefer-signals': 'error',
  '@angular-eslint/prefer-output-emitter-ref': 'error',
  '@angular-eslint/prefer-signal-model': 'error',
};

/**
 * Исключения `require-spec-file` — по образцу `requireSpecExcludes` в конфиге meta-frontend.
 * Первый блок — виды файлов без собственного поведения: данные, типы, строковые таблицы.
 * Второй — чистые хелперы, которые разбираются спеками своих потребителей; их сторожит не факт
 * существования файла спеки, а глобальный порог покрытия 100 % в `vitest-base.config.ts`.
 */
const REQUIRE_SPEC_EXCLUDES = [
  '**/*.mock.ts',
  '**/*.interface.ts',
  '**/*.type.ts',
  '**/*.constant.ts',
  '**/*.enum.ts',
  '**/*.token.ts',
  '**/*.schema.ts',
  '**/*.routes.ts',
  '**/*.text.ts',
  '**/*.error.ts',
  '**/environments/**',
  '**/spec-utils/**',
  '**/index.ts',
  'src/test-providers.ts',

  'src/app/core/github/json-base64.ts',
  'src/app/core/github/protocol-db-path.ts',
  'src/app/core/github/race-number.ts',
  'src/app/core/history/iso-year.ts',
  'src/app/core/history/median.ts',
  'src/app/core/history/note-tokens.ts',
  'src/app/core/history/score-text.ts',
  'src/app/core/history/signed-delta.ts',
  'src/app/core/protocol/race-time-cells.ts',
  'src/app/core/sqlite/deserialize-db.ts',
  'src/app/core/sqlite/protocol-db-notes.ts',
  'src/app/core/sqlite/protocol-db-overall-stats.ts',
  'src/app/core/sqlite/protocol-db-read.ts',
  'src/app/core/sqlite/protocol-db-summary.ts',
  'src/app/core/sqlite/sqlite-loader-node.ts',
  'src/app/core/track/track-distance.ts',
  'src/app/core/transfer/transfer-load.ts',
  'src/app/core/weather/temperature-text.ts',
  'src/app/core/weather/weather-icon.ts',
  'src/app/core/weather/weather-line.ts',
  'src/app/core/xlsx/full-name-case.ts',
  'src/app/features/athlete/athlete-page-text.ts',
  'src/app/features/records/records-attendance.ts',
  'src/app/features/timer/finish-board/finish-rows.ts',
  'src/app/features/timer/handout-sheet/handout-sheet.ts',
  'src/app/features/timer/lap-board/lap-rows.ts',
  'src/app/features/timer/session-list/session-list.view.ts',
  'src/app/features/timer/session-publish/session-publish.view.ts',
  'src/app/github/protocol-db-first-lap.ts',
  'src/app/github/protocol-db-vk.ts',
  'src/app/github/protocol-db-weather.ts',
  'src/app/shared/install-app/install-app.view.ts',
  'src/app/shared/install-app/install-prompt.service.ts',
  'src/app/shared/offline-notice/offline-status.service.ts',
  'src/app/state/timer-storage.ts',
];

/**
 * Кириллица в этих файлах — не интерфейсный текст, а данные: словари и таблицы, по которым код
 * сопоставляет значения. Оборачивать их в `$localize` бессмысленно, поэтому селекторы кириллицы
 * здесь сняты (аналог `cyrillicLiteralExceptions` в конфиге meta-frontend).
 */
const CYRILLIC_DATA_FILES = [
  // Словарь русских имён для определения пола по имени.
  'src/app/core/gender/russian-names.constant.ts',
  // Окончания и буквы, по которым определяется пол.
  'src/app/core/gender/gender-inference.constant.ts',
  // Названия месяцев и падежные формы — таблица локали, а не строки экрана.
  'src/app/core/time/russian-date.constant.ts',
  // Подписи точек трассы, приходящие из geojson.
  'src/app/features/home/course-track/course-geometry.constant.ts',
  // Нормализация буквы «е»/«ё» в ключе атлета.
  'src/app/core/history/athlete-key.constant.ts',
  // Тексты примечаний лежат в БД и разбираются регулярками — перевод сломал бы разбор архива.
  'src/app/core/history/notes-builder.constant.ts',
  // Сообщения git-коммитов: их читает история репозитория, а не пользователь.
  'src/app/core/github/github-api.constant.ts',
  'src/app/core/github/version-pointer.constant.ts',
  // Город, парк, клуб и председатель — имена собственные, они же уходят в БД и в PDF.
  'src/app/core/protocol/race-event-defaults.constant.ts',
  // Официальный протокол — русский документ независимо от языка интерфейса: он подписывается
  // председателем и хранится как есть, английской версии у него не бывает.
  'src/app/core/pdf/protocol-doc-definition.constant.ts',
  // Текст анонса забега для русских соцсетей — тот же случай, что и протокол.
  'src/app/core/share/race-announcement.constant.ts',
  // Тексты ошибок публикации переживают round-trip через localStorage и JSON (см. комментарий
  // в самом файле), поэтому это обычные строки, а не узлы перевода.
  'src/app/state/timer-publish.constant.ts',
];

// typescript-eslint отдаёт flat/recommended без files — базовый объект иначе
// навязал бы TS-парсер и html-шаблонам. Прибиваем его к нужным файлам.
const scoped = (configs, files, ignores) => configs.map((config) => ({ ...config, files, ...(ignores ? { ignores } : {}) }));

const tsRecommended = [js.configs.recommended, ...tsPlugin.configs['flat/recommended']];

const tsLanguageOptions = {
  parser: tsParser,
  parserOptions: {
    project: ['./tsconfig.app.json', './tsconfig.spec.json'],
    tsconfigRootDir: import.meta.dirname,
  },
};

const tsPlugins = {
  '@typescript-eslint': tsPlugin,
  '@angular-eslint': angular,
  '@eslint-community/eslint-comments': eslintComments,
  import: importPlugin,
  'local-rules': localRules,
  'optimize-regex': optimizeRegex,
  'rxjs-x': rxjsX,
};

export default [
  {
    // Перенесено из .eslintignore.
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '.angular/**',
      'out-tsc/**',
      // HTML в корне — только статичные макеты дизайна, не шаблоны приложения.
      '*.html',
      '_legacy/**',
      'content/**',
      'scripts/**',
      'seo/**',
      'eslint-local-plugin/**',
      'stylelint-rules/**',
      'src/index.html',
      'src/main.ts',
      'src/main.server.ts',
      'src/server.ts',
      'src/app/app.config.server.ts',
      'src/app/app.routes.server.ts',
      '**/*.config.ts',
      '**/*.config.mjs',
    ],
  },
  ...scoped(tsRecommended, ['src/**/*.ts'], ['**/*.spec.ts']),
  {
    files: ['src/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    languageOptions: tsLanguageOptions,
    plugins: tsPlugins,
    rules: {
      ...commonTypeScriptRules,
      ...productionTypeScriptRules,
      'no-restricted-syntax': ['error', ...restrictedSyntax, cyrillicLiteral, cyrillicTemplateLiteral],
      'local-rules/no-inject-explicit-type': 'error',
      'local-rules/no-filter-map': 'error',
      'local-rules/enforce-filename-suffix': 'error',
      'local-rules/enforce-decorated-filename': 'error',
      'local-rules/require-spec-file': ['error', { exclude: REQUIRE_SPEC_EXCLUDES }],
    },
  },
  {
    // Фикстуры: кириллица в них — тестовые данные, а не текст интерфейса.
    files: ['src/**/*.mock.ts'],
    rules: { 'no-restricted-syntax': ['error', ...restrictedSyntax] },
  },
  {
    files: [...CYRILLIC_DATA_FILES, 'src/**/spec-utils/**/*.ts'],
    rules: { 'no-restricted-syntax': ['error', ...restrictedSyntax] },
  },
  {
    // Хост этого компонента — сам `<dialog>`, поэтому селектор атрибутный: платформа рисует
    // backdrop и ловит Escape только на настоящем `<dialog>`. Исключение живёт в конфиге, а не
    // в inline-комментарии, которых `no-restricted-disable` не допускает.
    files: ['src/app/features/timer/confirm-dialog/confirm-dialog.ts'],
    rules: { '@angular-eslint/component-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }] },
  },
  {
    files: ['src/**/*.pipe.ts'],
    rules: {
      '@typescript-eslint/max-params': 'off',
      'local-rules/max-params-except-pipe-transform': ['error', { max: 2 }],
    },
  },
  {
    // Драйвер drizzle зовёт колбэк как `(sql, params, method)` — сигнатуру диктует библиотека,
    // свернуть аргументы в объект нельзя. Исключение живёт в конфиге, а не в inline-комментарии,
    // которых `no-restricted-disable` не допускает.
    files: ['src/app/core/sqlite/protocol-drizzle.ts'],
    rules: { '@typescript-eslint/max-params': 'off' },
  },
  {
    files: ['src/**/spec-utils/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': ['warn', { assertionStyle: 'as' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@eslint-community/eslint-comments/no-restricted-disable': 'off',
      '@eslint-community/eslint-comments/require-description': 'off',
      'rxjs-x/finnish': 'off',
      'max-lines-per-function': 'off',
    },
  },
  {
    files: ['src/**/*.d.ts'],
    rules: { '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }] },
  },
  ...scoped(tsRecommended, ['src/**/*.spec.ts']),
  {
    files: ['src/**/*.spec.ts'],
    languageOptions: tsLanguageOptions,
    plugins: tsPlugins,
    rules: {
      ...commonTypeScriptRules,
      '@typescript-eslint/consistent-type-assertions': ['warn', { assertionStyle: 'never' }],
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-console': ['error', { allow: ['time', 'timeEnd'] }],
      'local-rules/no-inject-explicit-type': 'error',
      'local-rules/no-provide-auto-spy-directive': 'error',
      'local-rules/no-compile-components-for-standalone': 'error',
      'local-rules/no-object-define-property-in-specs': 'error',
      'local-rules/no-unasserted-console-spy': 'error',
      'local-rules/enforce-filename-suffix': 'error',
      'max-lines-per-function': 'off',
      'no-restricted-properties': [
        'error',
        { object: 'describe', property: 'skip', message: 'Do not commit skipped tests (describe.skip)' },
        { object: 'it', property: 'skip', message: 'Do not commit skipped tests (it.skip)' },
        { object: 'test', property: 'skip', message: 'Do not commit skipped tests (test.skip)' },
      ],
    },
  },
  {
    files: ['src/**/spec-utils/**/*.spec.ts'],
    rules: {
      'no-console': 'off',
      '@eslint-community/eslint-comments/no-restricted-disable': 'off',
      '@eslint-community/eslint-comments/require-description': 'off',
    },
  },
  {
    files: ['**/*.html'],
    languageOptions: { parser: angularTemplateParser },
    plugins: {
      '@angular-eslint/template': angularTemplate,
      '@eslint-community/eslint-comments': eslintComments,
      'local-rules': localRules,
    },
    rules: {
      // Статический `class` рядом с `[class]` — документированное правило приоритета Angular:
      // базовые BEM-классы остаются в разметке, а вычисленный модификатор приходит биндингом.
      '@angular-eslint/template/no-duplicate-attributes': ['error', { allowStylePrecedenceDuplicates: true }],
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/conditional-complexity': 'error',
      '@angular-eslint/template/eqeqeq': 'error',
      '@angular-eslint/template/i18n': ['error', { checkId: true, checkText: true, checkAttributes: false, checkDuplicateId: true }],
      '@angular-eslint/template/label-has-associated-control': 'error',
      '@angular-eslint/template/no-any': 'error',
      '@angular-eslint/template/no-negated-async': 'error',
      '@angular-eslint/template/no-interpolation-in-attributes': 'error',
      '@angular-eslint/template/prefer-static-string-properties': 'error',
      'no-restricted-syntax': ['error', cyrillicTextAttribute],
      'local-rules/no-method-call-in-template': 'error',
      ...eslintCommentRules,
    },
  },
];
