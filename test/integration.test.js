'use strict';

const { exec } = require('child_process');
const { join, resolve } = require('path');
const { rename, readdir, rm } = require('fs/promises');
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
  return new Promise((resolve) => {
    exec(cmd, { ...defaults, ...opts }, (error, stdout, stderr) => {
      resolve({
        error,
        stdout,
        stderr,
      });
    });
  });
}

async function clean() {
  const fixtures = join(root, 'test', 'fixtures');
  const ret = await readdir(fixtures, { recursive: true });
  const node_modules = ret.filter(
    (p) => p.endsWith('node_modules') && p.split('/').length === 2
  );
  const lockFiles = ret.filter(
    (p) => p.endsWith('package-lock.json') && p.split('/').length === 2
  );
  await Promise.allSettled([
    ...node_modules.map((p) => rm(join(fixtures, p), { recursive: true })),
    ...lockFiles.map((p) => rm(join(fixtures, p))),
  ]);
}
// Cannot handle concurrency now when installing from the same tarball,
// needs investigation.
tap.jobs = 3;

tap.before(async () => {
  await clean();
  const { stdout } = await run('npm pack');
  const pack = stdout.trim().split('\n').pop();
  const source = join(root, pack);
  const dest = join(__dirname, 'fixtures', 'pack.tgz');
  await rename(source, dest);
});

tap.test('cjs', { only: true }, async (t) => {
  const cwd = join(__dirname, 'fixtures', 'cjs');
  await install({ cwd });
  const { error, stdout, stderr } = await run('node index.js', { cwd });
  t.notOk(error);
  t.equal(stdout, '');
  t.equal(stderr, '');
});

tap.test('esm', async (t) => {
  const cwd = join(__dirname, 'fixtures', 'esm');
  await install({ cwd });
  const { error, stdout, stderr } = await run('node index.mjs', { cwd });
  t.notOk(error);
  t.equal(stdout, '');
  t.equal(stderr, '');
});

tap.test('ts', async (t) => {
  const cwd = join(__dirname, 'fixtures', 'ts');
  await install({ cwd });
  const { error, stdout, stderr } = await run('npm run build:ts', { cwd });
  t.notOk(error);
  t.matchSnapshot(stdout);
  t.equal(stderr, '');
});
