'use strict';

const { exec } = require('child_process');
const { join, resolve } = require('path');
const { rename } = require('fs/promises');
const tap = require('tap');

const root = resolve(__dirname, '..');
const cache = join(root, 'node_modules', '.cache');
function install(opts = {}) {
  return run(`npm i --cache=${cache}`, opts);
}
function run(cmd, opts = {}) {
  const defaults = {
    stdio: 'inherit',
  };
  return new Promise((resolve, reject) => {
    exec(cmd, { ...defaults, ...opts }, (error, stdout) => {
      error ? reject(error) : resolve(stdout);
    });
  });
}

// Cannot handle concurrency now when installing from the same tarball,
// needs investigation.
// tap.jobs = 3;

tap.before(async () => {
  const root = resolve(__dirname, '..');
  const pack = await run('npm pack');
  const source = join(root, pack.trim());
  const dest = join(__dirname, 'fixtures', 'pack.tgz');
  await rename(source, dest);
});

tap.test('cjs', async (t) => {
  const cwd = join(__dirname, 'fixtures', 'cjs');
  await install({ cwd });
  await run('node index.js', { cwd });
  t.end();
});

tap.test('esm', async (t) => {
  const cwd = join(__dirname, 'fixtures', 'esm');
  await install({ cwd });
  await run('node index.mjs', { cwd });
  t.end();
});

tap.test('ts', async (t) => {
  const cwd = join(__dirname, 'fixtures', 'ts');
  await install({ cwd });
  await run('npm run build:ts', { cwd });
  t.end();
});
