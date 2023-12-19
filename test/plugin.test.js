'use strict';

const tap = require('tap');
const { defaultIntegrations } = require('@sentry/node');
const sensible = require('@fastify/sensible');
const {
  setup,
  resetModuleCache,
  testkit,
  extractMetaFromEvent,
} = require('./helpers');

const DSN =
  'https://00000000000000000000000000000000@o000000.ingest.sentry.io/0000000';

tap.beforeEach(() => {
  resetModuleCache();
  testkit.reset();
});

tap.test('default integrations should be active by default', async (t) => {
  let addedIntegrations;
  await setup({
    dsn: DSN,
    integrations(integrations) {
      addedIntegrations = integrations;
      return integrations;
    },
  });
  t.equal(defaultIntegrations.length, addedIntegrations.length);
});

tap.test('Should close sentry when fastify closes', async (t) => {
  // We use a stub here because in a CI environment the sdk fails
  // with a 400 status code when calling `close()`.
  const app = await setup({ dsn: DSN });
  const close = t.sinon.stub(app.Sentry, 'close').resolves();
  await app.close();
  t.ok(close.calledOnce);
  close.restore();
});

tap.test(
  'fastify .close should not reject if no DSN is configured',
  async (t) => {
    // Here we are testing that we don't error
    // when no dsn is passed because `Sentry.close`
    // passes an argument when it resolves **only** in this case,
    // causing the `done()` cb in the hook to pass a value, which is considered
    // an error by the fastify hook runner.
    const app = await setup();
    const close = t.sinon.spy(app.Sentry, 'close');
    await app.close();
    t.ok(close.calledOnce);
    close.restore();
  }
);

tap.test('event with transactions disabled', async (t) => {
  const app = await setup(
    { dsn: DSN, environment: 'fastify-sentry-test' },
    async (fastify) => {
      fastify.decorateRequest('user', null);
      fastify.addHook('onRequest', (request, reply, done) => {
        request.user = {
          username: 'some',
          email: 'some@example.com',
        };
        done();
      });
    },
    async (fastify) => {
      fastify.post('/body', async () => {
        throw new Error('An Error');
      });
    }
  );
  let response = await app.inject({
    method: 'GET',
    path: '/oops',
  });
  t.equal(500, response.statusCode);
  await app.Sentry.flush();
  let reports = testkit.reports();
  t.equal(reports.length, 1);
  let report = reports[0];
  t.equal(report.user.username, 'some');
  t.equal(report.user.email, 'some@example.com');
  t.equal(report.user.ip_address, '127.0.0.1');
  t.equal(report.breadcrumbs.length, 0);
  t.matchSnapshot(extractMetaFromEvent(report));
  const transactions = testkit.transactions();
  t.equal(transactions.length, 0);
  const payload = JSON.parse(response.payload);
  t.equal('Something went wrong', payload.message);
  testkit.reset();
  response = await app.inject({
    method: 'POST',
    path: '/body',
    payload: { some: 'some' },
  });
  t.equal(500, response.statusCode);
  await app.Sentry.flush();
  reports = testkit.reports();
  t.equal(reports.length, 1);
  report = reports[0];
  t.equal(report.breadcrumbs.length, 0);
  t.matchSnapshot(extractMetaFromEvent(report));
});

tap.test('event with transactions enabled', async (t) => {
  const app = await setup(
    { dsn: DSN, environment: 'fastify-sentry-test', tracesSampleRate: 1.0 },
    async (fastify) => {
      fastify.decorateRequest('user', null);
      fastify.addHook('onRequest', (request, reply, done) => {
        request.user = {
          username: 'some',
          email: 'some@example.com',
        };
        done();
      });
    },
    async (fastify) => {
      fastify.post('/body', async () => {
        throw new Error('An Error');
      });
    }
  );
  let response = await app.inject({
    method: 'GET',
    path: '/oops',
  });
  t.equal(500, response.statusCode);
  await app.Sentry.flush();
  let reports = testkit.reports();
  t.equal(reports.length, 1);
  let report = reports[0];
  t.equal(report.user.username, 'some');
  t.equal(report.user.email, 'some@example.com');
  t.equal(report.user.ip_address, '127.0.0.1');
  t.equal(report.breadcrumbs.length, 0);
  t.matchSnapshot(extractMetaFromEvent(report));
  const transactions = testkit.transactions();
  t.equal(transactions.length, 1);
  t.equal(transactions[0].name, 'GET /oops');
  const payload = JSON.parse(response.payload);
  t.equal('Something went wrong', payload.message);
  testkit.reset();
  response = await app.inject({
    method: 'POST',
    path: '/body',
    payload: { some: 'some' },
  });
  t.equal(500, response.statusCode);
  await app.Sentry.flush();
  reports = testkit.reports();
  t.equal(reports.length, 1);
  report = reports[0];
  t.equal(report.breadcrumbs.length, 0);
  t.matchSnapshot(extractMetaFromEvent(report));
});

tap.test('@fastify/sensible explicit internal errors support', async (t) => {
  const app = await setup(
    { dsn: DSN, environment: 'fastify-sentry-test' },
    async (s) => {
      s.register(sensible);
    },
    async (s) => {
      s.get('/sensible', async function () {
        throw this.httpErrors.internalServerError('My Error');
      });
    }
  );
  const response = await app.inject({
    method: 'GET',
    path: '/sensible',
  });
  t.equal(500, response.statusCode);
  await app.Sentry.flush();
  t.equal(testkit.reports().length, 1);
  const payload = JSON.parse(response.payload);
  t.equal('My Error', payload.message);
});

tap.test('custom `shouldHandleError`', async (t) => {
  const app = await setup({
    shouldHandleError: () => false,
    dsn: DSN,
    environment: 'fastify-sentry-test',
  });
  const response = await app.inject({
    method: 'GET',
    path: '/oops',
  });
  t.equal(500, response.statusCode);
  await app.Sentry.flush();
  t.equal(testkit.reports().length, 0);
  const payload = JSON.parse(response.payload);
  t.equal('Something went wrong', payload.message);
});

tap.test('custom errorResponse', async (t) => {
  const app = await setup({
    errorResponse: (error, request, reply) => {
      t.ok(error);
      t.ok(request);
      t.ok(reply);
      reply.send({ error: 'My Error' });
    },
    dsn: DSN,
    environment: 'fastify-sentry-test',
  });
  const response = await app.inject({
    method: 'GET',
    path: '/oops',
  });
  t.equal(500, response.statusCode);
  await app.Sentry.flush();
  t.equal(testkit.reports().length, 1);
  const payload = JSON.parse(response.payload);
  t.equal('My Error', payload.error);
});

tap.test('custom getTransactionName', async (t) => {
  const app = await setup({
    getTransactionName: (request) => {
      t.ok(request);
      return 'my-transaction';
    },
    dsn: DSN,
    environment: 'fastify-sentry-test',
    tracesSampleRate: 1.0,
  });
  let response = await app.inject({
    method: 'GET',
    path: '/oops',
  });
  await app.Sentry.flush();
  t.equal(testkit.reports().length, 1);
  const transactions = testkit.transactions();
  t.equal(transactions.length, 1);
  t.equal(transactions[0].name, 'my-transaction');
  t.equal(500, response.statusCode);
  let payload = JSON.parse(response.payload);
  t.equal('Something went wrong', payload.message);
});

tap.test('custom extractRequestData', async (t) => {
  let count = 0;
  const app = await setup(
    {
      dsn: DSN,
      environment: 'fastify-sentry-test',
      tracesSampleRate: 1.0,
      extractRequestData: (request, keys) => {
        count++;
        t.ok(keys);
        if (count % 2 !== 0) {
          t.same(keys, [
            'headers',
            'method',
            'protocol',
            'url',
            'cookies',
            'query_string',
          ]);
        } else {
          t.same(keys, ['data']);
        }
        return {};
      },
    },
    null,
    async (fastify) => {
      fastify.post('/body', async () => {
        throw new Error('An Error');
      });
    }
  );
  let response = await app.inject({
    method: 'GET',
    path: '/oops',
  });
  t.equal(500, response.statusCode);
  await app.Sentry.flush();
  let reports = testkit.reports();
  t.equal(reports.length, 1);
  let report = reports[0];
  t.equal(report.user.ip_address, '127.0.0.1');
  t.equal(report.breadcrumbs.length, 0);
  t.matchSnapshot(extractMetaFromEvent(report));
  const transactions = testkit.transactions();
  t.equal(transactions.length, 1);
  t.equal(transactions[0].name, 'GET /oops');
  const payload = JSON.parse(response.payload);
  t.equal('Something went wrong', payload.message);
  testkit.reset();
  response = await app.inject({
    method: 'POST',
    path: '/body',
    payload: { some: 'some' },
  });
  t.equal(500, response.statusCode);
  await app.Sentry.flush();
  reports = testkit.reports();
  t.equal(reports.length, 1);
  report = reports[0];
  t.equal(report.breadcrumbs.length, 0);
  t.matchSnapshot(extractMetaFromEvent(report));
});

tap.test('should not override validation errors (issue #209)', async (t) => {
  const app = await setup({ dsn: DSN }, async (s) => {
    s.get(
      '/validation',
      {
        schema: {
          querystring: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
            },
            required: ['foo'],
          },
        },
      },
      async function () {
        return { foo: true };
      }
    );
  });
  const response = await app.inject({
    method: 'GET',
    path: '/validation',
  });
  await app.Sentry.flush();
  t.equal(testkit.reports().length, 0);
  t.equal(400, response.statusCode);
  const payload = JSON.parse(response.payload);
  t.equal("querystring must have required property 'foo'", payload.message);
});
