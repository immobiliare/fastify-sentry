'use strict';

const { hostname } = require('os');
const domain = require('domain');
const {
  normalize,
  isString,
  isPlainObject,
  extractTraceparentData,
  parseBaggageString,
} = require('@sentry/utils');
const Sentry = require('@sentry/node');
const cookie = require('cookie');
const { SENTRY_NAME } = process.env;

const DEFAULT_EVENT_DATA = {
  ip: true,
  request: true,
  serverName: true,
  transaction: true,
  user: true,
  version: true,
};

exports.DEFAULT_EVENT_DATA = DEFAULT_EVENT_DATA;

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

function tryToExtractBody(req) {
  if (req.body !== undefined) {
    return isString(req.body) ? req.body : JSON.stringify(normalize(req.body));
  }
}

function addRequestToEvent(req) {
  const method = req.method;
  const headers = req.headers;
  const host = req.hostname || '<no host>';
  const protocol = req.protocol;
  const absoluteUrl = `${protocol}://${host}${req.url}`;
  const data =
    method === 'GET' || method === 'HEAD' ? undefined : tryToExtractBody(req);
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

/** Default user keys that'll be used to extract data from the request */
const DEFAULT_USER_KEYS = ['id', 'username', 'email'];

function addUserToEvent(request) {
  if (!isPlainObject(request.user)) {
    return {};
  }
  const extractedUser = {};
  const { user } = request.user;
  for (const key of DEFAULT_USER_KEYS) {
    if (key in user) {
      extractedUser[key] = user[key];
    }
  }

  return extractedUser;
}
// TODO: implement custom keys to extract using the options array as
function eventProcessor(event, hint, request) {
  const transaction = request[kSentryTransaction]
    ? request[kSentryTransaction].request
    : addRequestToEvent(request);
  event.contexts = {
    ...event.contexts,
    runtime: {
      name: 'node',
      version: global.process.version,
    },
  };

  event.transaction = {
    ...event.transaction,
    ...transaction,
  };

  if (!event.server_name) {
    event.server_name = SENTRY_NAME || hostname();
  }

  event.user = {
    ...event.user,
    ip_address: request.ip,
    ...addUserToEvent(request),
  };

  event.transaction = request[kSentryTransaction]
    ? request[kSentryTransaction].name
    : defaultGetTransactionName(request);
  return event;
}

// exports.validateOptions = function (opts) {
//     if (opts.parseRequestOptions) {
//         for (const key of Object.keys(DEFAULT_EVENT_DATA).filter(
//             (key) => key === 'request' || key === 'transaction'
//         )) {
//             if (!key in opts.parseRequestOptions) continue;
//             else if (typeof opts.parseRequestOptions[key] !== 'boolean')
//                 throw new Error(`parseRequestOptions.${key} must be a boolean`);
//         }
//     }
//     if (typeof opts.shouldHandleError !== 'function') {
//         throw new Error('shouldHandleError must be a function');
//     }
//     if (typeof opts.setErrorHandler !== 'function') {
//         throw new Error('setErrorHandler must be a function');
//     }
// };

function defaultShouldHandleError(error, request, reply) {
  return reply.statusCode >= 500;
}

exports.sentryTransactionHook = function () {
  return function (request, reply, done) {
    const traceparentData =
      request.headers &&
      isString(request.headers['sentry-trace']) &&
      extractTraceparentData(request.headers['sentry-trace']);
    const baggage =
      request.headers &&
      isString(request.headers.baggage) &&
      parseBaggageString(request.headers.baggage);
    const transaction = Sentry.startTransaction(
      {
        name: getTransactionName(request, reply),
        op: 'http.server',
        ...traceparentData,
        ...(baggage && { metadata: { baggage: baggage } }),
      },
      { request: addRequestToEvent(request) }
    );
    done();
  };
};
exports.sentryRequestHook = function () {
  const currentHub = Sentry.getCurrentHub();
  const client = currentHub.getClient();
  if (client && isAutoSessionTrackingEnabled(client)) {
    client.initSessionFlusher();
    const scope = currentHub.getScope();
    if (scope && scope.getSession()) {
      scope.setSession();
    }
  }
  return (request, reply, done) => {
    const local = domain.create();
    local.add(request);
    local.add(reply);
    local.on('error', done);
    local.run(() => {
      Sentry.getCurrentHub().configureScope((scope) => {
        scope.addEventProcessor((event, hint) =>
          eventProcessor(event, hint, request)
        );
        if (transaction) {
          transaction.setData('url', request.url);
          transaction.setData('query', request.query);
          scope.setSpan(transaction);
          request[kSentryTransaction] = transaction;
        }
      });
      done();
    });
  };
};

exports.onResponseHook = function () {
  return (request, reply, done) => {
    if (request[kSentryTransaction]) {
      request[kSentryTransaction].setHttpStatus(reply.statusCode);
      request[kSentryTransaction].finish();
    }
    done();
  };
};

const getTransactionName = (request) => {
  return `${request.method} ${request.routerPath}`;
};
exports.getTransactionName = getTransactionName;

exports.defaultShouldHandleError = defaultShouldHandleError;

function defaultErrorResponse(error, request, reply) {
  // @fastify/sensible explicit internal errors support
  if (reply.statusCode === 500 && error.explicitInternalServerError !== true) {
    reply.send(new Error('Something went wrong'));
  } else {
    reply.send(error);
  }
}
exports.defaultErrorResponse = defaultErrorResponse;

exports.setErrorHandler = function (
  shouldHandleError = defaultShouldHandleError,
  errorResponse = defaultErrorResponse
) {
  return function errorHandler(error, request, reply) {
    request.log.error(error);
    const instance = this;
    if (shouldHandleError(error, request, reply)) {
      const client = instance.Sentry.getCurrentHub().getClient();
      const scope = instance.Sentry.getCurrentHub().getScope();
      if (client && isAutoSessionTrackingEnabled(client)) {
        const isSessionAggregatesMode = client._sessionFlusher !== undefined;
        if (isSessionAggregatesMode) {
          const requestSession = scope.getRequestSession();
          if (requestSession && requestSession.status !== undefined) {
            requestSession.status = 'crashed';
          }
        }
      }
      reply.sentryEventId = instance.Sentry.captureException(error);
      errorResponse(error, request, reply);
    }
  };
};

const kSentryTransaction = Symbol('kSentryTransaction');
exports.kSentryTransaction = kSentryTransaction;
