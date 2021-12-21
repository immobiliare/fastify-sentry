'use strict';

const fp = require('fastify-plugin');
const Sentry = require('@sentry/node');
const defaultAllowedStatusCodes = require('./allowedStatusCodes');

const defaultErrorFactory = ({ allowedStatusCodes }) =>
    function errorHandler(error, request, reply) {
        request.log.error(error);
        if (reply.statusCode === 500) {
            reply.send(new Error('Something went wrong'));
        } else {
            reply.send(error);
        }
    
        if (!allowedStatusCodes.includes(reply.statusCode)) {
            this.Sentry.withScope((scope) => {
                scope.setUser({
                    ip_address: request.ip,
                });
                scope.setLevel('error');
                scope.setTag('path', request.url);
                scope.setExtra('headers', request.headers);
                if (
                    request.headers['content-type'] === 'application/json' &&
                    request.body
                ) {
                    scope.setExtra('body', request.body);
                }
                this.Sentry.captureException(error);
            });
        }
    };

const validateOptions = function (opts) {
    if (!Array.isArray(opts.allowedStatusCodes)) {
        opts.allowedStatusCodes = [opts.allowedStatusCodes];
    }
    for (const code of opts.allowedStatusCodes) {
        if (typeof code !== 'number') {
            throw new Error(
                `code in allowedStatusCodes must be a number, received ${typeof code}`
            );
        }
    }
    if (typeof opts.onErrorFactory !== 'function') {
        throw new Error('onErrorFactory must be a function');
    }
};

module.exports = fp(
    function (
        fastify,
        {
            dsn,
            environment = 'Local',
            release,
            // I am not sure our Sentry instance supports this feature
            // so I am diabling it by default until we know that it's supported.
            // See https://docs.sentry.io/product/releases/health/
            autoSessionTracking = false,
            defaultIntegrations = false,
            integrations,
            // TODO: Check if this can be done using the native Sentry options.
            allowedStatusCodes = defaultAllowedStatusCodes,
            onErrorFactory = defaultErrorFactory,
            ...sentryOptions
        },
        next
    ) {
        Sentry.init({
            dsn,
            environment,
            release,
            autoSessionTracking,
            defaultIntegrations:
                defaultIntegrations === false ? defaultIntegrations : undefined,
            integrations,
            ...sentryOptions,
        });

        if (!dsn) {
            fastify.log.error(
                'No dsn was provided, skipping Sentry configuration.'
            );
        }

        try {
            validateOptions({
                environment,
                release,
                allowedStatusCodes,
                onErrorFactory,
            });
        } catch (error) {
            return next(error);
        }

        const onError = onErrorFactory({
            environment,
            allowedStatusCodes,
            fastify,
        });
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
        name: require('../package.json').name,
        fastify: '3.x',
    }
);
