'use strict';

const path = require('path');
const fp = require('fastify-plugin');
const Sentry = require('@sentry/node');
const defaultAllowedStatusCodes = require('./allowedStatusCodes');
const { parseRequest, isAutoSessionTrackingEnabled } = require('./lib/utils');

const PACKAGE_NAME = require(path.resolve(__dirname, 'package.json')).name;

const defaultErrorFactory = ({ allowedStatusCodes }) =>
    function errorHandler(error, request, reply) {
        request.log.error(error);
        const instance = this;
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
            instance.Sentry.withScope((scope) => {
                scope.addEventProcessor((event) =>
                    parseRequest(event, request)
                );
                const client = instance.Sentry.getCurrentHub().getClient();
                if (client && isAutoSessionTrackingEnabled(client)) {
                    const isSessionAggregatesMode =
                        client._sessionFlusher !== undefined;
                    if (isSessionAggregatesMode) {
                        const requestSession = scope.getRequestSession();
                        if (
                            requestSession &&
                            requestSession.status !== undefined
                        ) {
                            requestSession.status = 'crashed';
                        }
                    }
                }
                instance.Sentry.captureException(error);
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
                allowedStatusCodes,
                onErrorFactory,
            });
        } catch (error) {
            return next(error);
        }

        const onError = onErrorFactory({
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
