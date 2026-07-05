'use strict';
const { ESLintUtils } = require('@typescript-eslint/utils');
const fs = require('fs');

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

const noFilterMap = ESLintUtils.RuleCreator(() => '')({
  name: 'no-filter-map',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow chaining filter() and map() on arrays. Use reduce() instead for a single iteration.',
      recommended: 'error',
    },
    schema: [],
    messages: {
      useReduce: 'Используйте reduce() вместо цепочки filter().map() или map().filter() для одной итерации по массиву.',
    },
    fixable: 'code',
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        const isMapCall =
          node.callee?.type === 'MemberExpression' &&
          node.callee.property?.type === 'Identifier' &&
          node.callee.property.name === 'map' &&
          node.parent?.type !== 'ArrowFunctionExpression' &&
          node.parent?.type !== 'FunctionExpression';

        const isFilterCall =
          node.callee?.type === 'MemberExpression' &&
          node.callee.property?.type === 'Identifier' &&
          node.callee.property.name === 'filter' &&
          node.parent?.type !== 'ArrowFunctionExpression' &&
          node.parent?.type !== 'FunctionExpression';

        if (isMapCall) {
          if (
            node.callee.object?.type === 'CallExpression' &&
            node.callee.object.callee?.type === 'MemberExpression' &&
            node.callee.object.callee.property?.type === 'Identifier' &&
            node.callee.object.callee.property.name === 'filter'
          ) {
            context.report({ node, messageId: 'useReduce' });
          }
        }

        if (isFilterCall) {
          if (
            node.callee.object?.type === 'CallExpression' &&
            node.callee.object.callee?.type === 'MemberExpression' &&
            node.callee.object.callee.property?.type === 'Identifier' &&
            node.callee.object.callee.property.name === 'map'
          ) {
            context.report({ node, messageId: 'useReduce' });
          }
        }
      },
    };
  },
});

const standaloneCache = new Map();

const noTestBedCompileComponentsForStandalone = ESLintUtils.RuleCreator(() => '')({
  name: 'no-compile-components-for-standalone',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow async/compileComponents() in beforeEach when testing standalone components.',
      recommended: 'error',
    },
    schema: [],
    messages: {
      unnecessaryAsync: 'Для standalone компонентов не нужен async в beforeEach — JIT компиляция происходит автоматически',
      unnecessaryCompileComponents: 'Для standalone компонентов не нужен compileComponents() — JIT компиляция происходит автоматически',
      unnecessaryAwait: 'Для standalone компонентов не нужен await перед TestBed.configureTestingModule()',
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

            standaloneCache.set(componentName, true);
            return true;
          }
        } catch {
          // ignore unreadable files
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
          if (firstArg && firstArg.type === 'Identifier') {
            foundTestedComponents.add(firstArg.name);
          }
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
        if (foundTestedComponents.size === 0) return;

        let hasStandaloneComponent = false;
        for (const componentName of foundTestedComponents) {
          if (isComponentStandalone(componentName) === true) {
            hasStandaloneComponent = true;
            break;
          }
        }

        if (!hasStandaloneComponent) return;

        for (const beforeEachNode of asyncBeforeEachNodes) {
          context.report({ node: beforeEachNode, messageId: 'unnecessaryAsync' });
        }

        for (const compileComponentsNode of compileComponentsNodes) {
          context.report({ node: compileComponentsNode, messageId: 'unnecessaryCompileComponents' });
        }

        for (const awaitNode of awaitConfigureTestingModuleNodes) {
          context.report({ node: awaitNode, messageId: 'unnecessaryAwait' });
        }
      },
    };
  },
});

const decoratorCache = new Map();

const noProvideAutoSpyDirective = ESLintUtils.RuleCreator(() => '')({
  name: 'no-provide-auto-spy-directive',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow using provideAutoSpy() with Angular Directives and Components. Only Services should be used.',
      recommended: 'error',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedClasses: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      forbidden: 'Directives and Components cannot be used with provideAutoSpy(). Services should be provided via provideAutoSpy().',
    },
  },
  defaultOptions: [{ allowedClasses: [] }],
  create(context) {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();
    const options = context.options[0] || {};
    const allowedClasses = new Set(options.allowedClasses || []);
    const defaultAllowedClasses = new Set([
      'ActivatedRoute',
      'Router',
      'ActivatedRouteSnapshot',
      'RouterStateSnapshot',
      'UrlTree',
      'Route',
    ]);

    function isAllowed(className) {
      return allowedClasses.has(className) || defaultAllowedClasses.has(className);
    }

    function hasDirectiveOrComponentDecorator(node) {
      if (!node || !parserServices) return false;

      const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
      if (!tsNode) return false;

      const symbol = checker.getTypeAtLocation(tsNode).getSymbol();
      if (!symbol) return false;

      const declarations = symbol.getDeclarations();
      if (!declarations || declarations.length === 0) return false;

      for (const declaration of declarations) {
        const sourceFile = declaration.getSourceFile();
        if (!sourceFile) continue;

        const filePath = sourceFile.fileName;
        const className = symbol.getName();

        if (decoratorCache.has(filePath)) {
          return decoratorCache.get(filePath).has(className);
        }

        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const hasDirective = new RegExp(`@Directive[^]*?class\\s+${className}\\b`, 's').test(fileContent);
          const hasComponent = new RegExp(`@Component[^]*?class\\s+${className}\\b`, 's').test(fileContent);

          if (!decoratorCache.has(filePath)) {
            decoratorCache.set(filePath, new Set());
          }

          if (hasDirective || hasComponent) {
            decoratorCache.get(filePath).add(className);
            return true;
          }
        } catch {
          // ignore unreadable files
        }
      }

      return false;
    }

    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'provideAutoSpy') return;

        const firstArg = node.arguments[0];
        if (!firstArg || firstArg.type !== 'Identifier') return;
        if (isAllowed(firstArg.name)) return;

        if (hasDirectiveOrComponentDecorator(firstArg)) {
          context.report({ node: firstArg, messageId: 'forbidden' });
        }
      },
    };
  },
});

module.exports = {
  rules: {
    'no-inject-explicit-type': noInjectExplicitType,
    'no-provide-auto-spy-directive': noProvideAutoSpyDirective,
    'no-compile-components-for-standalone': noTestBedCompileComponentsForStandalone,
    'no-filter-map': noFilterMap,
  },
};
