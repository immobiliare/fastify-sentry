'use strict';

const tap = require('tap');
const { defaultIntegrations } = require('@sentry/node');
const { spy, fake, stub } = require('sinon');
const fastify = require('fastify');
const sensible = require('@fastify/sensible');
const plugin = require('../');

const DSN =
    'https://00000000000000000000000000000000@o000000.ingest.sentry.io/0000000';

async function setup(options, pre = async () => {}, post = async () => {}) {
    const server = fastify();
    await pre(server);
    server.register(plugin, options);
    await post(server);
    server.get('/oops', async () => {
        throw new Error('Oops');
    });
    server.post('/oops', async () => {
        throw new Error('Oops');
    });
    await server.ready();
    return server;
}

tap.beforeEach(() => {
    delete require.cache[require.resolve('../')];
    for (const key in require.cache) {
        if (/node_modules\/@sentry\//.test(key)) {
            delete require.cache[key];
        }
    }
});

tap.test('configuration validation', async (t) => {
    const list = [
        {
            config: {
                allowedStatusCodes: ['123', {}],
            },
            message:
                'code in allowedStatusCodes must be a number, received string',
        },
        {
            config: {
                allowedStatusCodes: '123',
            },
            message:
                'code in allowedStatusCodes must be a number, received string',
        },
        {
            config: {
                onErrorFactory: null,
            },
            message: 'onErrorFactory must be a function',
        },
        {
            config: {
                onErrorFactory: () => 'string',
            },
            message: 'onError handler must be a function',
        },
    ];
    for (const item of list) {
        await t.rejects(async () => {
            await setup(item.config);
        }, new Error(item.message));
    }
});

tap.test('configuration without options', async (t) => {
    const server = await setup();
    t.equal('object', typeof server.Sentry);
});

tap.test('configuration without dns', async (t) => {
    const server = await setup({ allowedStatusCodes: [] });
    t.equal('object', typeof server.Sentry);
});

tap.test('configuration with dsn', async (t) => {
    const server = await setup({ dsn: DSN });
    t.equal('object', typeof server.Sentry);
});

tap.test('configuration without default integrations', async (t) => {
    let addedIntegrations;
    const server = await setup({
        dsn: DSN,
        integrations(integrations) {
            addedIntegrations = integrations;
            return integrations;
        },
    });
    t.ok(addedIntegrations.length > 0);
    t.equal('object', typeof server.Sentry);
});

tap.test('configuration with default integrations', async (t) => {
    let addedIntegrations;
    const server = await setup({
        dsn: DSN,
        defaultIntegrations: true,
        integrations(integrations) {
            addedIntegrations = integrations;
            return integrations;
        },
    });
    t.equal(defaultIntegrations.length, addedIntegrations.length);
    t.equal('object', typeof server.Sentry);
});

tap.test('error handler with allowed status code', async (t) => {
    const server = await setup({ dsn: DSN });
    const captureException = spy(server.Sentry, 'captureException');
    const response = await server.inject({
        method: 'GET',
        path: '/not-found',
    });
    t.equal(404, response.statusCode);
    t.equal(false, captureException.called);
    server.Sentry.captureException.restore();
});

tap.test(
    'error handler with allowed status code and without Sentry configured',
    async (t) => {
        const server = await setup();
        t.equal('object', typeof server.Sentry);
        const response = await server.inject({
            method: 'GET',
            path: '/oops',
        });
        t.equal(500, response.statusCode);
        const payload = JSON.parse(response.payload);
        t.equal('Something went wrong', payload.message);
    }
);

tap.test('error handler with not allowed status code', async (t) => {
    const server = await setup({ dsn: DSN });
    const captureException = spy(server.Sentry, 'captureException');
    const response = await server.inject({
        method: 'GET',
        path: '/oops',
    });
    t.equal(500, response.statusCode);
    t.equal(true, captureException.called);
    const payload = JSON.parse(response.payload);
    t.equal('Something went wrong', payload.message);
    server.Sentry.captureException.restore();
});

tap.test(
    'error handler with not allowed status code in production environment',
    async (t) => {
        const server = await setup({ dsn: DSN, environment: 'production' });
        const captureException = spy(server.Sentry, 'captureException');
        const response = await server.inject({
            method: 'GET',
            path: '/oops',
        });
        t.equal(500, response.statusCode);
        t.equal(true, captureException.called);
        const payload = JSON.parse(response.payload);
        t.equal('Something went wrong', payload.message);
        server.Sentry.captureException.restore();
    }
);

tap.test('error handler with custom allowed list', async (t) => {
    const server = await setup({ dsn: DSN, allowedStatusCodes: [500] });
    const captureException = spy(server.Sentry, 'captureException');
    const response = await server.inject({
        method: 'GET',
        path: '/oops',
    });
    t.equal(500, response.statusCode);
    t.equal(false, captureException.called);
    const payload = JSON.parse(response.payload);
    t.equal('Something went wrong', payload.message);
    server.Sentry.captureException.restore();
});

tap.test('should call the custom onErrorFactory', async (t) => {
    const onErrorFactory = fake(() => () => {});
    await setup({
        onErrorFactory,
    });
    t.equal(onErrorFactory.called, true);
});

tap.test('should call the custom onError', async (t) => {
    const onError = fake((error, _, reply) => reply.send(error));
    const server = await setup({ dsn: DSN, onErrorFactory: () => onError });
    const captureException = spy(server.Sentry, 'captureException');
    const response = await server.inject({
        method: 'GET',
        path: '/oops',
    });
    t.equal(onError.called, true);
    t.equal(500, response.statusCode);
    t.equal(false, captureException.called);
    const payload = JSON.parse(response.payload);
    t.equal('Oops', payload.message);
    server.Sentry.captureException.restore();
});

tap.test('Should close sentry when fastify closes', async (t) => {
    // We use a stub here because in a CI environment the sdk fails
    // with a 400 status code when calling `close()`.
    const server = await setup({ dsn: DSN });
    const close = stub(server.Sentry, 'close').resolves();
    await server.close();
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
        const server = await setup();
        const close = spy(server.Sentry, 'close');
        await server.close();
        t.ok(close.calledOnce);
        close.restore();
    }
);

tap.test(
    '@fastify/sensible explicit internal errors support',
    { only: true },
    async (t) => {
        const server = await setup(
            { dsn: DSN, environment: 'production' },
            async (s) => {
                s.register(sensible);
            },
            async (s) => {
                s.get('/sensible', async function () {
                    throw this.httpErrors.internalServerError('My Error');
                });
            }
        );
        const captureException = spy(server.Sentry, 'captureException');
        const response = await server.inject({
            method: 'GET',
            path: '/sensible',
        });
        t.equal(500, response.statusCode);
        t.equal(true, captureException.called);
        const payload = JSON.parse(response.payload);
        t.equal('My Error', payload.message);
        server.Sentry.captureException.restore();
    }
);
