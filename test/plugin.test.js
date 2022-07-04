'use strict';

const tap = require('tap');
const { defaultIntegrations } = require('@sentry/node');
const { spy, fake, stub } = require('sinon');
const sensible = require('@fastify/sensible');
const { setup, resetModuleCache } = require('./helpers');
const { kSentryTransaction } = require('../lib/symbols');

const DSN =
  'https://00000000000000000000000000000000@o000000.ingest.sentry.io/0000000';

tap.beforeEach(resetModuleCache);

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
  const close = stub(app.Sentry, 'close').resolves();
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
    const close = spy(app.Sentry, 'close');
    await app.close();
    t.ok(close.calledOnce);
    close.restore();
  }
);

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
  t.teardown(() => app.Sentry.captureException.restore());
  const captureException = spy(app.Sentry, 'captureException');
  const response = await app.inject({
    method: 'GET',
    path: '/sensible',
  });
  t.equal(500, response.statusCode);
  t.equal(true, captureException.called);
  const payload = JSON.parse(response.payload);
  t.equal('My Error', payload.message);
});

tap.test('custom `shouldHandleError`', async (t) => {
  const app = await setup({
    shouldHandleError: () => false,
    dsn: DSN,
    environment: 'fastify-sentry-test',
  });
  t.teardown(() => app.Sentry.captureException.restore());
  const captureException = spy(app.Sentry, 'captureException');
  const response = await app.inject({
    method: 'GET',
    path: '/oops',
  });
  t.equal(500, response.statusCode);
  t.equal(false, captureException.called);
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
  t.teardown(() => app.Sentry.captureException.restore());
  const captureException = spy(app.Sentry, 'captureException');
  const response = await app.inject({
    method: 'GET',
    path: '/oops',
  });
  t.equal(500, response.statusCode);
  t.equal(true, captureException.called);
  const payload = JSON.parse(response.payload);
  t.equal('My Error', payload.error);
});

tap.test('custom getTransactionName', async (t) => {
  const app = await setup(
    {
      getTransactionName: (request) => {
        t.ok(request);
        return 'my-transaction';
      },
      dsn: DSN,
      environment: 'fastify-sentry-test',
      tracesSampleRate: 1.0,
      beforeSend(event, hint) {
        t.equal(event.transaction, 'my-transaction');
        return event;
      },
    },
    null,
    async (s) => {
      s.get('/transaction', async function (request, reply) {
        const transaction = this.Sentry.getCurrentHub()
          .getScope()
          .getTransaction();
        t.equal(transaction.name, 'my-transaction');
        return { transaction: true };
      });
    }
  );
  t.teardown(() => app.Sentry.captureException.restore());
  const captureException = spy(app.Sentry, 'captureException');
  let response = await app.inject({
    method: 'GET',
    path: '/oops',
  });
  // We need to flush all events otherwise tap won't be able to
  // count the asserts in `getTransactionName` and `beforeSend`
  await app.Sentry.flush();
  t.equal(500, response.statusCode);
  t.equal(true, captureException.called);
  let payload = JSON.parse(response.payload);
  t.equal('Something went wrong', payload.message);

  response = await app.inject({
    method: 'GET',
    path: '/transaction',
  });
  t.equal(200, response.statusCode);
  payload = JSON.parse(response.payload);
  console.log(payload);
});
