'use strict';

const path = require('path');
const fp = require('fastify-plugin');
const Sentry = require('@sentry/node');
const {
    validateOptions,
    onErrorFactory: defaultErrorFactory,
    defaultShouldHandleError,
} = require('./lib/utils');

const PACKAGE_NAME = require(path.resolve(__dirname, 'package.json')).name;

module.exports = fp(
    function (
        fastify,
        {
            shouldHandleError = defaultShouldHandleError,
            onErrorFactory = defaultErrorFactory,
            ...sentryOptions
        },
        next
    ) {
        sentryOptions = sentryOptions || {};
        Sentry.init(sentryOptions);
        if (!sentryOptions.dsn) {
            fastify.log.error('No Sentry DSN was provided.');
        }

        try {
            validateOptions({
                shouldHandleError,
                onErrorFactory,
            });
        } catch (error) {
            return next(error);
        }

        const onError = onErrorFactory(shouldHandleError);
        if (typeof onError !== 'function') {
            return next(new Error('onError handler must be a function'));
        }
        fastify.setErrorHandler(onError);
        fastify.decorate('Sentry', Sentry);
        fastify.addHook('onClose', (instance, done) => {
            Sentry.close(2000).then(() => done(), done);
        });
        next();
    },
    {
        name: PACKAGE_NAME,
        fastify: '3.x',
    }
);
