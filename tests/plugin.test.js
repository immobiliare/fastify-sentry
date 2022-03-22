'use strict';

const tap = require('tap');
const { spy, fake } = require('sinon');
const { defaultIntegrations } = require('@sentry/node');
const fastify = require('fastify');

const DSN = 'https://00000000000000000000000000000000@sentry.io/0000000';

async function setup(options) {
    const server = fastify();
    server.register(require('../'), options);
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
    t.equal(0, addedIntegrations.length);
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

tap.test('Should close sentry when fastify .close', async (t) => {
    const server = await setup({ dsn: DSN });
    const close = server.Sentry.close;
    let called = false;
    server.Sentry.close = (...args) => {
        called = true;
        return close(...args);
    };
    await server.close();
    server.Sentry.close = close;
    t.equal(called, true);
});

tap.test(
    'fastify .close should not reject if no DSN is configured',
    async (t) => {
        const server = await setup();
        const close = server.Sentry.close;
        let called = false;
        server.Sentry.close = (...args) => {
            called = true;
            return close(...args);
        };
        await server.close();
        server.Sentry.close = close;
        t.equal(called, true);
    }
);
