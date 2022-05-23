'use strict';

const { hostname } = require('os');
const {
    normalize,
    isString,
    isPlainObject,
    stripUrlQueryAndFragment,
} = require('@sentry/utils');
const cookie = require('cookie');

const { SENTRY_NAME } = process.env;

function isAutoSessionTrackingEnabled(client) {
    if (client === undefined) {
        return false;
    }
    const clientOptions = client && client.getOptions();
    if (clientOptions && clientOptions.autoSessionTracking !== undefined) {
        return clientOptions.autoSessionTracking;
    }
    return false;
}

function extractUserData(user) {
    const extractedUser = {};

    /** Default user keys that'll be used to extract data from the request */
    const DEFAULT_USER_KEYS = ['id', 'username', 'email'];

    for (const key of DEFAULT_USER_KEYS) {
        if (user && key in user) {
            extractedUser[key] = user[key];
        }
    }

    return extractedUser;
}

function tryToExtractBody(req) {
    if (req.body !== undefined) {
        return isString(req.body)
            ? req.body
            : JSON.stringify(normalize(req.body));
    }
}

function extractRequestData(req) {
    const method = req.method;
    const headers = req.headers;
    const host = req.hostname || '<no host>';
    const protocol = req.protocol;
    const absoluteUrl = `${protocol}://${host}${req.url}`;
    const data =
        method === 'GET' || method === 'HEAD'
            ? undefined
            : tryToExtractBody(req);
    return {
        headers,
        method,
        host,
        protocol,
        url: absoluteUrl,
        cookies: cookie.parse(headers.cookie || ''),
        query_string: req.query,
        data,
    };
}

// TODO: implement custom keys to extract using the options array as
function parseRequest(event, req) {
    event.contexts = {
        ...event.contexts,
        runtime: {
            name: 'node',
            version: global.process.version,
        },
    };

    event.request = {
        ...event.request,
        ...extractRequestData(req),
    };

    if (!event.server_name) {
        event.server_name = SENTRY_NAME || hostname();
    }

    const extractedUser =
        req.user && isPlainObject(req.user) ? extractUserData(req.user) : {};

    if (Object.keys(extractedUser)) {
        event.user = {
            ...event.user,
            ...extractedUser,
        };
    }

    event.user = {
        ...event.user,
        ip_address: req.ip,
    };

    event.transaction = `${req.method} ${stripUrlQueryAndFragment(req.url)}`;
    return event;
}

exports.validateOptions = function (opts) {
    if (typeof opts.shouldHandleError !== 'function') {
        throw new Error('shouldHandleError must be a function');
    }
    if (typeof opts.onErrorFactory !== 'function') {
        throw new Error('onErrorFactory must be a function');
    }
};

function defaultShouldHandleError(error, request, reply) {
    return reply.statusCode >= 500;
}

exports.defaultShouldHandleError = defaultShouldHandleError;

exports.onErrorFactory = function (
    shouldHandleError = defaultShouldHandleError
) {
    return function errorHandler(error, request, reply) {
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

        if (shouldHandleError(error, request, reply)) {
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
};
