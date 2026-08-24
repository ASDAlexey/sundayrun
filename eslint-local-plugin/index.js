'use strict';
/**
 * Локальные ESLint-правила проекта. Реализации перенесены из tooling-пакета meta-libs
 * (`libs/tooling/runtime/eslint/local-rules.cjs`) и живут здесь целиком: sundayrun не зависит
 * от @meta/libs. Хелперы, на которые ссылаются спековые правила, берутся напрямую из
 * `vitest-auto-spy` — meta-libs их только реэкспортирует, так что чужой рантайм не нужен.
 * `enforce-decorated-filename` перенесён с таблицей соглашений ЭТОГО проекта: компоненты и
 * директивы здесь без суффиксов (стиль Angular 20+), поэтому правило сторожит только @Pipe и
 * DI-классы. Не перенесён `no-unused-icons` — он про конфиг svg-иконок meta-frontend.
 */
const { ESLintUtils } = require('@typescript-eslint/utils');
const { ensureTemplateParser } = require('@angular-eslint/utils');
const fs = require('fs');
const path = require('path');
const minimatchPackage = require('minimatch');
const CYRILLIC_LITERAL_MESSAGE = 'Хардкод кириллицы — оберните эту строку в $localize';
const minimatch = minimatchPackage.minimatch || minimatchPackage;

const cyrillicI18nRestrictedSyntax = [
  {
    selector: 'Literal[value=/[\\u0400-\\u04FF]/]:not(TaggedTemplateExpression[tag.name="$localize"] Literal)',
    message: CYRILLIC_LITERAL_MESSAGE,
  },
  {
    selector:
      'TemplateLiteral[expressions.length=0]:not(TaggedTemplateExpression > TemplateLiteral)[quasis.0.value.raw=/[\\u0400-\\u04FF]/]',
    message: 'Хардкод кириллицы в template literal — оберните эту строку в $localize',
  },
  {
    selector: 'TextAttribute[value=/[\\u0400-\\u04FF]/]:not([i18n])',
    message: 'Хардкод кириллицы в template attribute — добавьте Angular i18n-* атрибут.',
  },
];

let ts = null;

try {
  ts = require('typescript');
} catch {
  ts = null;
}

const noInjectExplicitType = ESLintUtils.RuleCreator(() => '')({
  name: 'no-inject-explicit-type',
  meta: {
    type: 'problem',
    docs: { description: 'Disallow explicit type annotations on inject() for private class fields', recommended: 'error' },
    schema: [],
    messages: { forbidden: 'Do not specify type explicitly when using inject() for private class fields.' },
  },
  defaultOptions: [],
  create(context) {
    return {
      PropertyDefinition(node) {
        if (!node.key || node.key.type !== 'PrivateIdentifier') return;
        if (!node.value || node.value.type !== 'CallExpression') return;
        if (node.value.callee.type === 'Identifier' && node.value.callee.name === 'inject' && node.typeAnnotation) {
          context.report({ node, messageId: 'forbidden' });
        }
      },
    };
  },
});

const decoratorCache = new Map();
const standaloneCache = new Map();

const noTestBedCompileComponentsForStandalone = ESLintUtils.RuleCreator(() => '')({
  name: 'no-compile-components-for-standalone',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow async/compileComponents() in beforeEach when testing standalone components (JIT compilation handles this automatically)',
      recommended: 'error',
    },
    schema: [],
    messages: {
      unnecessaryAsync: 'Для standalone компонентов не нужен async в beforeEach - JIT компиляция происходит автоматически',
      unnecessaryCompileComponents: 'Для standalone компонентов не нужен compileComponents() - JIT компиляция происходит автоматически',
      unnecessaryAwait: 'Для standalone компонентов не нужен await перед TestBed.configureTestingModule() - используйте синхронный код',
    },
  },
  defaultOptions: [],
  create(context) {
    const parserServices = ESLintUtils.getParserServices(context);

    function isComponentStandalone(componentName) {
      if (!componentName || !parserServices) return null;
      if (standaloneCache.has(componentName)) return standaloneCache.get(componentName);
      const program = parserServices.program;
      if (!program) {
        standaloneCache.set(componentName, null);
        return null;
      }

      for (const sourceFile of program.getSourceFiles()) {
        const filePath = sourceFile.fileName;
        if (!filePath.endsWith('.ts') || filePath.endsWith('.spec.ts')) continue;

        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const componentPattern = new RegExp(`@Component[^]*class\\s+${componentName}\\b`, 's');
          const componentMatch = fileContent.match(componentPattern);
          if (componentMatch) {
            if (/standalone:\s*false/.test(componentMatch[0])) {
              standaloneCache.set(componentName, false);
              return false;
            }
            if (/standalone:\s*true/.test(componentMatch[0])) {
              standaloneCache.set(componentName, true);
              return true;
            }
            standaloneCache.set(componentName, true);
            return true;
          }
        } catch {
          continue;
        }
      }
      standaloneCache.set(componentName, null);
      return null;
    }

    const foundTestedComponents = new Set();
    const asyncBeforeEachNodes = [];
    const compileComponentsNodes = [];
    const awaitConfigureTestingModuleNodes = [];

    return {
      CallExpression(node) {
        if (
          node.callee?.type === 'MemberExpression' &&
          node.callee.property?.type === 'Identifier' &&
          node.callee.property.name === 'createComponent'
        ) {
          const typeArg = node.typeParameters?.[0];
          if (typeArg && typeArg.type === 'TSTypeReference' && typeArg.typeName.type === 'Identifier') {
            foundTestedComponents.add(typeArg.typeName.name);
          }
          const firstArg = node.arguments?.[0];
          if (firstArg && firstArg.type === 'Identifier') foundTestedComponents.add(firstArg.name);
        }
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'beforeEach' &&
          node.arguments[0]?.type === 'ArrowFunctionExpression' &&
          node.arguments[0].async
        ) {
          asyncBeforeEachNodes.push(node.arguments[0]);
        }
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'configureTestingModule' &&
          node.parent?.type === 'AwaitExpression'
        ) {
          awaitConfigureTestingModuleNodes.push(node.parent);
        }
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'compileComponents'
        ) {
          compileComponentsNodes.push(node.callee.property);
        }
      },
      'Program:exit'() {
        if (![...foundTestedComponents].some((name) => isComponentStandalone(name) === true)) return;
        for (const node of asyncBeforeEachNodes) context.report({ node, messageId: 'unnecessaryAsync' });
        for (const node of compileComponentsNodes) context.report({ node, messageId: 'unnecessaryCompileComponents' });
        for (const node of awaitConfigureTestingModuleNodes) context.report({ node, messageId: 'unnecessaryAwait' });
      },
    };
  },
});

const noFilterMap = ESLintUtils.RuleCreator(() => '')({
  name: 'no-filter-map',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow chaining filter() and map() on arrays. Use reduce() instead for better performance with single iteration.',
      recommended: 'error',
    },
    schema: [],
    messages: { useReduce: 'Используйте reduce() вместо цепочки filter().map() или map().filter() для одной итерации по массиву.' },
    fixable: 'code',
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        const method =
          node.callee?.type === 'MemberExpression' && node.callee.property?.type === 'Identifier' ? node.callee.property.name : null;
        if (method !== 'map' && method !== 'filter') return;
        if (node.parent?.type === 'ArrowFunctionExpression' || node.parent?.type === 'FunctionExpression') return;
        const previous = node.callee.object;
        const previousMethod =
          previous?.type === 'CallExpression' &&
          previous.callee?.type === 'MemberExpression' &&
          previous.callee.property?.type === 'Identifier'
            ? previous.callee.property.name
            : null;
        if ((method === 'map' && previousMethod === 'filter') || (method === 'filter' && previousMethod === 'map')) {
          context.report({ node, messageId: 'useReduce' });
        }
      },
    };
  },
});

const requireSpecFile = ESLintUtils.RuleCreator(() => '')({
  name: 'require-spec-file',
  meta: {
    type: 'problem',
    docs: { description: 'Require a sibling .spec.ts file for every source file, except excluded patterns', recommended: 'error' },
    schema: [
      {
        type: 'object',
        properties: {
          exclude: { type: 'array', items: { type: 'string' }, description: 'Glob patterns of files that do not require a spec file' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingSpec:
        'Файл не имеет файла тестов "{{specName}}". Создайте тесты или добавьте паттерн в исключения local-rules/require-spec-file.',
    },
  },
  defaultOptions: [{ exclude: [] }],
  create(context) {
    const excludePatterns = (context.options[0] || {}).exclude || [];
    return {
      Program(node) {
        const filePath = context.filename ?? context.getFilename();
        if (!filePath.endsWith('.ts') || filePath.endsWith('.spec.ts') || filePath.endsWith('.d.ts')) return;
        const relativePath = path
          .relative(context.cwd ?? process.cwd(), filePath)
          .split(path.sep)
          .join('/');
        if (excludePatterns.some((pattern) => minimatch(relativePath, pattern, { dot: true }))) return;
        const specPath = filePath.replace(/\.ts$/, '.spec.ts');
        if (fs.existsSync(specPath)) return;
        context.report({
          node,
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } },
          messageId: 'missingSpec',
          data: { specName: path.basename(specPath) },
        });
      },
    };
  },
});

const noProvideAutoSpyDirective = ESLintUtils.RuleCreator(() => '')({
  name: 'no-provide-auto-spy-directive',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow using provideAutoSpy() with Angular Directives and Components. Only Services should be used with provideAutoSpy().',
      recommended: 'error',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedClasses: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of class names that are allowed to be used with provideAutoSpy() even if detected as directives/components',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      forbidden:
        'Directives and Components cannot be used with provideAutoSpy(). Use imports in TestBed.configureTestingModule or remove from providers. Services should be provided via provideAutoSpy().',
      falsePositive:
        'Class "{{className}}" was detected as having @Directive or @Component decorators, but it may be a false positive. If this is a valid Service or Angular injection token (e.g., ActivatedRoute, Router, etc.), add it to "allowedClasses" in eslint.config.mjs or remove it from providers if not used by the component.',
    },
  },
  defaultOptions: [{ allowedClasses: [] }],
  create(context) {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();
    const allowedClasses = new Set((context.options[0] || {}).allowedClasses || []);
    const defaultAllowedClasses = new Set([
      'ActivatedRoute',
      'Router',
      'ActivatedRouteSnapshot',
      'RouterState',
      'RouterStateSnapshot',
      'UrlSegmentGroup',
      'UrlTree',
      'Route',
    ]);

    function hasDirectiveOrComponentDecorator(node) {
      const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
      if (!tsNode) return false;
      const symbol = checker.getTypeAtLocation(tsNode).getSymbol();
      if (!symbol) return false;
      for (const declaration of symbol.getDeclarations() || []) {
        const filePath = declaration.getSourceFile()?.fileName;
        if (!filePath) continue;
        if (decoratorCache.has(filePath)) return decoratorCache.get(filePath).has(symbol.getName());
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const className = symbol.getName();
          const found = new RegExp(`@(Directive|Component)[^]*?class\\s+${className}\\b`, 's').test(content);
          if (found) {
            if (!decoratorCache.has(filePath)) decoratorCache.set(filePath, new Set());
            decoratorCache.get(filePath).add(className);
            return true;
          }
        } catch {
          continue;
        }
      }
      return false;
    }

    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'provideAutoSpy') return;
        const firstArg = node.arguments[0];
        if (!firstArg || firstArg.type !== 'Identifier') return;
        if (allowedClasses.has(firstArg.name) || defaultAllowedClasses.has(firstArg.name)) return;
        if (hasDirectiveOrComponentDecorator(firstArg)) context.report({ node: firstArg, messageId: 'forbidden' });
      },
    };
  },
});

const programCache = new Map();

function getProgramForFile(filePath) {
  if (!ts) return null;
  const configPath = ts.findConfigFile(path.dirname(filePath), ts.sys.fileExists, 'tsconfig.json');
  if (!configPath) return null;
  let program = programCache.get(configPath);
  if (!program) {
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    if (config.error) return null;
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
    program = ts.createProgram(parsed.fileNames, parsed.options);
    programCache.set(configPath, program);
  }
  return program;
}

function getComponentTypeInfo(htmlFilePath) {
  const tsFilePath = htmlFilePath.replace(/\.html$/, '.ts');
  const program = getProgramForFile(tsFilePath);
  const sourceFile = program?.getSourceFile(tsFilePath);
  if (!sourceFile) return null;
  let classNode = null;
  sourceFile.forEachChild((node) => {
    if (!classNode && ts.isClassDeclaration(node) && node.name) classNode = node;
  });
  if (!classNode) return null;
  const checker = program.getTypeChecker();
  const classSymbol = checker.getSymbolAtLocation(classNode.name);
  return classSymbol ? { checker, instanceType: checker.getDeclaredTypeOfSymbol(classSymbol) } : null;
}

function isComponentMethod(typeInfo, memberName) {
  const symbol = typeInfo.instanceType.getProperty(memberName);
  return Boolean(symbol?.declarations?.some((declaration) => ts.isMethodDeclaration(declaration) || ts.isMethodSignature(declaration)));
}

function isInsideBoundEvent(node) {
  let current = node.parent;
  while (current) {
    if (current.type === 'BoundEvent') return true;
    current = current.parent;
  }
  return false;
}

const noMethodCallInTemplate = ESLintUtils.RuleCreator(() => '')({
  name: 'no-method-call-in-template',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow calling component methods in templates; only signals, computed(), inputs and pipes are allowed',
      recommended: 'error',
    },
    schema: [],
    messages: { forbidden: 'Вызовы методов в шаблоне запрещены. Используйте сигнал, computed() или pipe вместо вызова "{{name}}()".' },
  },
  defaultOptions: [],
  create(context) {
    ensureTemplateParser(context);
    const sourceCode = context.sourceCode;
    let typeInfo;
    const resolveTypeInfo = () => {
      if (typeInfo === undefined) typeInfo = getComponentTypeInfo(context.filename);
      return typeInfo;
    };
    return {
      'Call[receiver.name!="$any"]'(node) {
        const receiver = node.receiver;
        if (!receiver || typeof receiver.name !== 'string') return;
        const owner = receiver.receiver;
        if (!owner || (owner.type !== 'ImplicitReceiver' && owner.type !== 'ThisReceiver')) return;
        if (isInsideBoundEvent(node)) return;
        const info = resolveTypeInfo();
        if (!info || !isComponentMethod(info, receiver.name)) return;
        context.report({
          loc: { start: sourceCode.getLocFromIndex(node.sourceSpan.start), end: sourceCode.getLocFromIndex(node.sourceSpan.end) },
          messageId: 'forbidden',
          data: { name: receiver.name },
        });
      },
    };
  },
});

const FILENAME_SUFFIX_BLOCKLIST = [
  ['utils', 'util'],
  ['consts', 'constant'],
  ['constants', 'constant'],
  ['const', 'constant'],
  ['types', 'type'],
  ['mocks', 'mock'],
  ['helpers', 'helper'],
  ['until', 'util'],
  ['emun', 'enum'],
  ['directice', 'directive'],
  ['quard', 'guard'],
];

const enforceFilenameSuffix = ESLintUtils.RuleCreator(() => '')({
  name: 'enforce-filename-suffix',
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow non-canonical or misspelled filename type-suffixes (e.g. .utils/.consts/.quard)', recommended: 'error' },
    schema: [],
    messages: {
      blocked: "Filename segment '.{{bad}}.' is not allowed; rename it to '.{{good}}.' to follow the project suffix convention.",
    },
  },
  defaultOptions: [],
  create(context) {
    const base = path.basename(context.filename ?? context.getFilename());
    return {
      Program(node) {
        for (const [bad, good] of FILENAME_SUFFIX_BLOCKLIST) {
          if (base.includes(`.${bad}.`)) {
            context.report({ node, messageId: 'blocked', data: { bad, good } });
            break;
          }
        }
      },
    };
  },
});

function countParameters(node) {
  return node.params.length > 0 && node.params[0].type === 'Identifier' && node.params[0].name === 'this'
    ? node.params.length - 1
    : node.params.length;
}

function hasPipeDecorator(classNode) {
  return (classNode.decorators || []).some((decorator) => {
    const expression = decorator.expression;
    return (
      (expression?.type === 'CallExpression' && expression.callee.type === 'Identifier' && expression.callee.name === 'Pipe') ||
      (expression?.type === 'Identifier' && expression.name === 'Pipe')
    );
  });
}

function isPipeTransformMethod(node) {
  const method = node.parent;
  if (
    !method ||
    method.type !== 'MethodDefinition' ||
    method.kind !== 'method' ||
    method.key?.type !== 'Identifier' ||
    method.key.name !== 'transform'
  )
    return false;
  const classNode = method.parent?.parent;
  return Boolean(classNode && ['ClassDeclaration', 'ClassExpression'].includes(classNode.type) && hasPipeDecorator(classNode));
}

const maxParamsExceptPipeTransform = ESLintUtils.RuleCreator(() => '')({
  name: 'max-params-except-pipe-transform',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        "Enforce a max-params limit (like @typescript-eslint/max-params) but exempt the transform() method of an @Pipe class, whose args are positional template arguments and can't be objectified without breaking pure-pipe memoization.",
      recommended: 'error',
    },
    schema: [
      {
        oneOf: [
          { type: 'integer', minimum: 0 },
          { type: 'object', properties: { max: { type: 'integer', minimum: 0 } }, additionalProperties: false },
        ],
      },
    ],
    messages: {
      tooManyParams:
        'Слишком много параметров ({{count}}, максимум {{max}}). Используйте один деструктурированный объектный параметр. Единственное исключение — метод transform() пайпа.',
    },
  },
  defaultOptions: [{ max: 2 }],
  create(context) {
    const option = context.options[0];
    const max = typeof option === 'number' ? option : typeof option?.max === 'number' ? option.max : 2;
    const check = (node) => {
      const count = countParameters(node);
      if (count > max && !isPipeTransformMethod(node)) context.report({ node, messageId: 'tooManyParams', data: { count, max } });
    };
    return { FunctionDeclaration: check, FunctionExpression: check, ArrowFunctionExpression: check };
  },
});

/**
 * Соглашения об именах файлов ЭТОГО проекта. `@Component`/`@Directive` намеренно не описаны:
 * с Angular 20+ здесь `athlete-page.ts` и `nav-rail.ts`, а не `*.component.ts`.
 */
const DECORATED_FILE_RULES = {
  Pipe: { suffixes: ['.pipe.ts'], expectation: "ending '.pipe.ts'" },
  Service: { segments: ['service', 'client'], expectation: 'with a .service/.client suffix' },
  Injectable: { segments: ['service', 'client'], expectation: 'with a .service/.client suffix' },
};

function decoratorName(decorator) {
  const expression = decorator.expression;

  if (expression?.type === 'CallExpression' && expression.callee.type === 'Identifier') {
    return expression.callee.name;
  }

  return expression?.type === 'Identifier' ? expression.name : null;
}

function filenameSatisfies(base, ruleConfig) {
  return ruleConfig.suffixes
    ? ruleConfig.suffixes.some((suffix) => base.endsWith(suffix))
    : ruleConfig.segments.some((segment) => base.includes(`.${segment}.`));
}

const enforceDecoratedFilename = ESLintUtils.RuleCreator(() => '')({
  name: 'enforce-decorated-filename',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require a class decorated with @Pipe/@Service/@Injectable to live in a correctly-suffixed file',
      recommended: 'error',
    },
    schema: [],
    messages: { mismatch: "A class decorated with @{{decorator}} must live in a file named {{expectation}} (found '{{filename}}')." },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename ?? context.getFilename();
    const base = path.basename(filename);

    if (base.endsWith('.spec.ts') || base.endsWith('.mock.ts') || base.endsWith('.d.ts') || filename.includes('/spec-utils/')) {
      return {};
    }

    return {
      ClassDeclaration(node) {
        for (const decorator of node.decorators || []) {
          const name = decoratorName(decorator);
          const ruleConfig = name && DECORATED_FILE_RULES[name];

          if (ruleConfig && !filenameSatisfies(base, ruleConfig)) {
            context.report({
              node: decorator,
              messageId: 'mismatch',
              data: { decorator: name, expectation: ruleConfig.expectation, filename: base },
            });
          }
        }
      },
    };
  },
});

/** Хелперы живут в самом vitest-auto-spy; meta-libs их только реэкспортирует. */
const MOCK_PROP_MODULE = 'vitest-auto-spy/angular';
const CONSOLE_SPY_MODULE = 'vitest-auto-spy/console';

/** `Object.defineProperty(obj, key, descriptor)` → тот хелпер, который выражает тот же дескриптор. */
function resolveMockShape(descriptor, sourceCode) {
  if (!descriptor || descriptor.type !== 'ObjectExpression') {
    return null;
  }

  const props = new Map();

  for (const prop of descriptor.properties) {
    if (prop.type !== 'Property' || prop.computed || prop.method || prop.key.type !== 'Identifier') {
      return null;
    }

    props.set(prop.key.name, prop);
  }

  const knownKeys = new Set(['configurable', 'get', 'set', 'value', 'writable']);

  if ([...props.keys()].some((key) => !knownKeys.has(key))) {
    return null;
  }

  if (props.has('value')) {
    return props.has('get') || props.has('set') ? null : { util: 'mockValueProp', args: [sourceCode.getText(props.get('value').value)] };
  }

  if (props.has('set') || !props.has('get')) {
    return null;
  }

  const getValue = props.get('get').value;

  if (!['Identifier', 'ArrowFunctionExpression', 'FunctionExpression'].includes(getValue.type)) {
    return null;
  }

  return { util: 'mockReadonlyPropGetter', args: [sourceCode.getText(getValue)] };
}

/** Дописывает импорт хелпера: в уже существующий из того же модуля или новой строкой после импортов. */
function buildImportFix(fixer, sourceCode, utilName) {
  const imports = sourceCode.ast.body.filter((node) => node.type === 'ImportDeclaration');
  const importNode = imports.find((node) => node.source.value === MOCK_PROP_MODULE);

  if (importNode) {
    const named = importNode.specifiers.filter((specifier) => specifier.type === 'ImportSpecifier');

    if (named.length === 0 || named.some((specifier) => specifier.imported.name === utilName)) {
      return null;
    }

    return fixer.insertTextAfter(named[named.length - 1], `, ${utilName}`);
  }

  const statement = `import { ${utilName} } from '${MOCK_PROP_MODULE}';`;

  return imports.length === 0
    ? fixer.insertTextBefore(sourceCode.ast.body[0] ?? sourceCode.ast, `${statement}\n`)
    : fixer.insertTextBefore(imports[0], `${statement}\n`);
}

const noObjectDefinePropertyInSpecs = ESLintUtils.RuleCreator(() => '')({
  name: 'no-object-define-property-in-specs',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Object.defineProperty in specs; use the vitest-auto-spy mock*Prop helpers instead',
      recommended: 'error',
    },
    fixable: 'code',
    schema: [],
    messages: {
      forbidden:
        'Object.defineProperty is banned in specs: it leaves the patched property behind. Use the helpers from «{{module}}» (mockReadonlyProp / mockReadonlyPropGetter / mockAccessorsProp / mockValueProp), which restore themselves.',
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node) {
        const callee = node.callee;
        const isDefineProperty =
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'Object' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'defineProperty';

        if (!isDefineProperty) {
          return;
        }

        const [objectArg, propArg, descriptor] = node.arguments;
        const report = { node, messageId: 'forbidden', data: { module: MOCK_PROP_MODULE } };
        const shape = objectArg && propArg && descriptor ? resolveMockShape(descriptor, sourceCode) : null;

        if (shape) {
          report.fix = (fixer) => {
            const args = [sourceCode.getText(objectArg), sourceCode.getText(propArg), ...shape.args].join(', ');
            const fixes = [fixer.replaceText(node, `${shape.util}(${args})`)];
            const importFix = buildImportFix(fixer, sourceCode, shape.util);

            if (importFix) {
              fixes.push(importFix);
            }

            return fixes;
          };
        }

        context.report(report);
      },
    };
  },
});

const CONSOLE_SPY_NAME_PATTERN = /^console\w+Spy$/;
const SPY_CLEANUP_METHODS = new Set(['mockClear', 'mockReset', 'mockRestore']);
const CONSOLE_SPY_BY_METHOD = { info: 'consoleInfoSpy', warn: 'consoleWarnSpy', error: 'consoleErrorSpy' };

const noUnassertedConsoleSpy = ESLintUtils.RuleCreator(() => '')({
  name: 'no-unasserted-console-spy',
  meta: {
    type: 'problem',
    docs: { description: 'Disallow console spies that are never asserted', recommended: 'error' },
    schema: [],
    messages: {
      unasserted:
        '"{{name}}" is imported but only used for {{cleanupMethods}} — nothing is ever asserted on it. Drop the import and the cleanup calls, or add expect({{name}}).',
      consoleSpyOn:
        'vi.spyOn(console, ...) is banned: a second patch over the same method silently wins or loses by import order. Use {{spyName}} from «{{module}}» and assert expect({{spyName}}).toHaveBeenCalled().',
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const isCleanupOnlyUsage = (identifier) => {
      const member = identifier.parent;

      return (
        member?.type === 'MemberExpression' &&
        member.object === identifier &&
        member.property?.type === 'Identifier' &&
        SPY_CLEANUP_METHODS.has(member.property.name) &&
        member.parent?.type === 'CallExpression' &&
        member.parent.callee === member
      );
    };

    return {
      CallExpression(node) {
        const callee = node.callee;
        const isConsoleSpyOn =
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'vi' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'spyOn' &&
          node.arguments[0]?.type === 'Identifier' &&
          node.arguments[0].name === 'console';

        if (!isConsoleSpyOn) {
          return;
        }

        const methodArg = node.arguments[1];
        const methodName = methodArg?.type === 'Literal' ? methodArg.value : undefined;

        context.report({
          node,
          messageId: 'consoleSpyOn',
          data: {
            spyName: CONSOLE_SPY_BY_METHOD[methodName] ?? 'consoleInfoSpy/consoleWarnSpy/consoleErrorSpy',
            module: CONSOLE_SPY_MODULE,
          },
        });
      },
      ImportDeclaration(node) {
        if (node.source.value !== CONSOLE_SPY_MODULE) {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') {
            continue;
          }

          const importedName = specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value;

          if (!CONSOLE_SPY_NAME_PATTERN.test(importedName)) {
            continue;
          }

          const variable = sourceCode.getDeclaredVariables(specifier)[0];

          if (!variable) {
            continue;
          }

          const usages = variable.references.filter((reference) => reference.identifier !== specifier.local);

          if (!usages.some((reference) => !isCleanupOnlyUsage(reference.identifier))) {
            context.report({
              node: specifier,
              messageId: 'unasserted',
              data: { name: specifier.local.name, cleanupMethods: [...SPY_CLEANUP_METHODS].join('/') },
            });
          }
        }
      },
    };
  },
});

module.exports = {
  cyrillicI18nRestrictedSyntax,
  rules: {
    'enforce-filename-suffix': enforceFilenameSuffix,
    'enforce-decorated-filename': enforceDecoratedFilename,
    'no-object-define-property-in-specs': noObjectDefinePropertyInSpecs,
    'no-unasserted-console-spy': noUnassertedConsoleSpy,
    'no-inject-explicit-type': noInjectExplicitType,
    'no-provide-auto-spy-directive': noProvideAutoSpyDirective,
    'no-compile-components-for-standalone': noTestBedCompileComponentsForStandalone,
    'no-filter-map': noFilterMap,
    'require-spec-file': requireSpecFile,
    'no-method-call-in-template': noMethodCallInTemplate,
    'max-params-except-pipe-transform': maxParamsExceptPipeTransform,
  },
};
