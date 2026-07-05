import madge from 'madge';

const result = await madge('src/app', {
  fileExtensions: ['ts'],
  tsConfig: 'tsconfig.app.json',
  excludeRegExp: [/\.spec\.ts$/, /\.mock\.ts$/],
});

const circular = result.circular();

if (circular.length > 0) {
  console.error('✗ Circular dependencies detected:');
  for (const cycle of circular) {
    console.error('  ' + cycle.join(' → '));
  }
  process.exit(1);
}

console.log('✓ No circular dependencies');
