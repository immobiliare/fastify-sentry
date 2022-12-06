'use strict';

const tap = require('tap');
const { get } = require('http');
const { setup, resetModuleCache } = require('./helpers');

const DSN =
  'https://00000000000000000000000000000000@o000000.ingest.sentry.io/0000000';

tap.beforeEach(resetModuleCache);

tap.test('distributed tracing', async (t) => {
  const app1 = await setup(
    {
      dsn: DSN,
      environment: 'fastify-sentry-test',
    },
    null,
    async (app) => {
      app.get('/call-1', async () => {
        return { some: 'some' };
      });
    }
  );

  const app2 = await setup(
    {
      dsn: DSN,
      environment: 'fastify-sentry-test',
    },
    null,
    async (app) => {
      app.get('/call-2', (request, reply) => {
        get(
          {
            port: app1.server.address().port,
            path: '/call-1',
            headers: {
              'sentry-trace':
                '12312012123120121231201212312012-1121201211212012-0',
              baggage:
                'sentry-version=1.0,sentry-environment=fastify-sentry-test',
            },
          },
          (response) => {
            response.setEncoding('utf-8');
            let rawData = '';
            response.on('data', (chunk) => (rawData += chunk));
            response.on('end', () => {
              reply.send(JSON.parse(rawData));
            });
          }
        );
      });
    }
  );
  t.teardown(async () => app1.close());
  await app1.listen({ port: 0 });
  const response = await app2.inject({
    method: 'GET',
    url: '/call-2',
  });
  t.equal(200, response.statusCode);
  t.same(JSON.parse(response.body), { some: 'some' });
});
