import stylelint from 'stylelint';

export const ruleName = 'custom/no-m3-mixins';
export const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (mixin) => `Использование M3 миксина "${mixin}" запрещено. Используйте text() вместо него.`,
});

const forbiddenMixins = [
  'display-large',
  'display-medium',
  'display-small',
  'headline-large',
  'headline-medium-prominent',
  'headline-medium',
  'headline-small-prominent',
  'headline-small',
  'title-large-prominent',
  'title-large',
  'title-medium-plus-prominent',
  'title-medium-plus',
  'title-medium-prominent',
  'title-medium',
  'title-small-prominent',
  'title-small',
  'label-large-prominent',
  'label-large',
  'label-medium-prominent',
  'label-medium',
  'label-small-prominent',
  'label-small',
  'body-large',
  'body-medium',
  'body-small',
];

export default stylelint.createPlugin(ruleName, () => {
  return (root, result) => {
    root.walkAtRules('include', (atRule) => {
      const rawName = atRule.params.split('(')[0].trim();
      const mixinName = rawName.includes('.') ? rawName.split('.').pop() : rawName;

      if (forbiddenMixins.includes(mixinName)) {
        stylelint.utils.report({
          message: messages.rejected(mixinName),
          node: atRule,
          result,
          ruleName,
          word: mixinName,
        });
      }
    });
  };
});
