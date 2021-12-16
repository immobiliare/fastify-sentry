'use strict';

const test = require('ava');
const { spy, fake } = require('sinon');
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

test.beforeEach(() => {
    delete require.cache[require.resolve('../')];
    for (const key in require.cache) {
        if (/node_modules\/@sentry\//.test(key)) {
            delete require.cache[key];
        }
    }
});

test.serial('configuration validation', async (t) => {
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
        await t.throwsAsync(
            async () => {
                await setup(item.config);
            },
            { message: item.message }
        );
    }
});

test.serial('configuration without options', async (t) => {
    const server = await setup();
    t.is('object', typeof server.Sentry);
});

test.serial('configuration without dns', async (t) => {
    const server = await setup({ allowedStatusCodes: [] });
    t.is('object', typeof server.Sentry);
});

test('configuration with dsn', async (t) => {
    const server = await setup({ dsn: DSN });
    t.is('object', typeof server.Sentry);
});

test.serial('configuration without default integrations', async (t) => {
    let addedIntegrations;
    const server = await setup({
        dsn: DSN,
        integrations(integrations) {
            addedIntegrations = integrations;
            return integrations;
        },
    });
    t.is(0, addedIntegrations.length);
    t.is('object', typeof server.Sentry);
});

test.serial('configuration with default integrations', async (t) => {
    let addedIntegrations;
    const server = await setup({
        dsn: DSN,
        defaultIntegrations: true,
        integrations(integrations) {
            addedIntegrations = integrations;
            return integrations;
        },
    });
    t.is(7, addedIntegrations.length);
    t.is('object', typeof server.Sentry);
});

test.serial('error handler with allowed status code', async (t) => {
    const server = await setup({ dsn: DSN });
    const captureException = spy(server.Sentry, 'captureException');
    const response = await server.inject({
        method: 'GET',
        path: '/not-found',
    });
    t.is(404, response.statusCode);
    t.is(false, captureException.called);
    server.Sentry.captureException.restore();
});

test.serial(
    'error handler with allowed status code and without Sentry configured',
    async (t) => {
        const server = await setup();
        t.is('object', typeof server.Sentry);
        const response = await server.inject({
            method: 'GET',
            path: '/oops',
        });
        t.is(500, response.statusCode);
        const payload = JSON.parse(response.payload);
        t.is('Something went wrong', payload.message);
    }
);

test.serial('error handler with not allowed status code', async (t) => {
    const server = await setup({ dsn: DSN });
    const captureException = spy(server.Sentry, 'captureException');
    const response = await server.inject({
        method: 'GET',
        path: '/oops',
    });
    t.is(500, response.statusCode);
    t.is(true, captureException.called);
    const payload = JSON.parse(response.payload);
    t.is('Something went wrong', payload.message);
    server.Sentry.captureException.restore();
});

test.serial(
    'error handler with not allowed status code in production environment',
    async (t) => {
        const server = await setup({ dsn: DSN, environment: 'production' });
        const captureException = spy(server.Sentry, 'captureException');
        const response = await server.inject({
            method: 'GET',
            path: '/oops',
        });
        t.is(500, response.statusCode);
        t.is(true, captureException.called);
        const payload = JSON.parse(response.payload);
        t.is('Something went wrong', payload.message);
        server.Sentry.captureException.restore();
    }
);

test.serial('error handler with custom allowed list', async (t) => {
    const server = await setup({ dsn: DSN, allowedStatusCodes: [500] });
    const captureException = spy(server.Sentry, 'captureException');
    const response = await server.inject({
        method: 'GET',
        path: '/oops',
    });
    t.is(500, response.statusCode);
    t.is(false, captureException.called);
    const payload = JSON.parse(response.payload);
    t.is('Something went wrong', payload.message);
    server.Sentry.captureException.restore();
});

test.serial('should call the custom onErrorFactory', async (t) => {
    const onErrorFactory = fake(() => () => {});
    await setup({
        onErrorFactory,
    });
    t.is(onErrorFactory.called, true);
});

test.serial('should call the custom onError', async (t) => {
    const onError = fake((error, _, reply) => reply.send(error));
    const server = await setup({ dsn: DSN, onErrorFactory: () => onError });
    const captureException = spy(server.Sentry, 'captureException');
    const response = await server.inject({
        method: 'GET',
        path: '/oops',
    });
    t.is(onError.called, true);
    t.is(500, response.statusCode);
    t.is(false, captureException.called);
    const payload = JSON.parse(response.payload);
    t.is('Oops', payload.message);
    server.Sentry.captureException.restore();
});

test.serial('Should close sentry when fastify .close', async (t) => {
    const server = await setup({ dsn: DSN });
    const close = server.Sentry.close;
    let called = false;
    server.Sentry.close = (...args) => {
        called = true;
        return close(...args);
    };
    await server.close();
    server.Sentry.close = close;
    t.is(called, true);
});

test('fastify .close should not reject if no DSN is configured', async (t) => {
    const server = await setup();
    const close = server.Sentry.close;
    let called = false;
    server.Sentry.close = (...args) => {
        called = true;
        return close(...args);
    };
    await server.close();
    server.Sentry.close = close;
    t.is(called, true);
});
