'use strict';

const path = require('path');
const fp = require('fastify-plugin');
const Sentry = require('@sentry/node');
const defaultAllowedStatusCodes = require('./allowedStatusCodes');

const PACKAGE_NAME = require(path.resolve(__dirname, 'package.json')).name;

const defaultErrorFactory = ({ allowedStatusCodes }) =>
    function errorHandler(error, request, reply) {
        request.log.error(error);
        // @fastify/sensible explicit internal errors support
        if (
            reply.statusCode === 500 &&
            error.explicitInternalServerError !== true
        ) {
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
            environment,
            release,
            allowedStatusCodes = defaultAllowedStatusCodes,
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
        name: PACKAGE_NAME,
        fastify: '3.x',
    }
);
