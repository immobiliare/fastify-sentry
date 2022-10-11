'use strict';

const tap = require('tap');
const { setup, resetModuleCache } = require('./helpers');

tap.beforeEach(resetModuleCache);

tap.test('decorators', async (t) => {
  const app = await setup(null, null, async (s) => {
    s.get('/', async (request, reply) => {
      t.ok(typeof reply.sentryEventId === 'string');
      return { ok: true };
    });
  });
  t.ok(app.hasDecorator('Sentry'));
  await app.inject({
    method: 'GET',
    path: '/',
  });
});
