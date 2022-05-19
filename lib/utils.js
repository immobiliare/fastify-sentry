'use strict';

const { hostname } = require('os');
const {
    normalize,
    isString,
    isPlainObject,
    stripUrlQueryAndFragment,
} = require('@sentry/utils');

const { SENTRY_NAME } = process.env;

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
    const host = req.hostname || '<no host>';
    const protocol = req.protocol;
    const absoluteUrl = `${protocol}://${host}${req.url}`;
    const data =
        method === 'GET' || method === 'HEAD'
            ? undefined
            : tryToExtractBody(req);
    return {
        headers: req.headers,
        method,
        host,
        protocol,
        url: absoluteUrl,
        // TODO: add cookies, we may need to add the 'cookie' library to parse them.
        query_string: req.query,
        data,
    };
}

// TODO: implement custom keys to extract using the options array as
exports.parseRequest = function (event, req) {
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
};
