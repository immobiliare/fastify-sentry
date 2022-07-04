'use strict';

const domain = require('domain'); // eslint-disable-line node/no-deprecated-api
const { hostname } = require('os');
const Sentry = require('@sentry/node');
const {
  isString,
  extractTraceparentData,
  parseBaggageString,
} = require('@sentry/utils');
const { hasTracingEnabled } = require('@sentry/tracing');
const {
  getTransactionName: defaultGetTransactionName,
  extractRequestData: defaultExtractRequestData,
  extractUserData: defaultExtractUserData,
  isAutoSessionTrackingEnabled,
} = require('./utils');
const {
  kSentryCurrentHub,
  kSentryClient,
  kSentryIsAutoSessionTrackingEnabled,
  kSentryTransaction,
  kSentryRequestData,
} = require('./symbols');

const { SENTRY_NAME } = process.env;

module.exports = function (fastify, opts = {}) {
  fastify.decorateRequest(kSentryTransaction, null);
  fastify.decorateRequest(kSentryRequestData, null);
  fastify.decorateRequest(kSentryClient, null);
  fastify.decorateRequest(kSentryIsAutoSessionTrackingEnabled, false);
  const getTransactionName =
    opts.getTransactionName || defaultGetTransactionName;
  const extractRequestData =
    opts.extractRequestData || defaultExtractRequestData;
  const extractUserData = opts.extractUserData || defaultExtractUserData;

  const eventProcessor = (request, event) => {
    if (!request[kSentryRequestData]) {
      request[kSentryRequestData] = extractRequestData(request);
    }
    event.contexts = {
      ...event.contexts,
      runtime: {
        name: 'node',
        version: global.process.version,
      },
    };
    event.request = {
      ...event.request,
      ...request[kSentryRequestData],
    };

    if (!event.transaction) {
      event.transaction = request[kSentryTransaction]
        ? request[kSentryTransaction].name
        : getTransactionName(request);
    }

    if (!event.server_name) {
      event.server_name = SENTRY_NAME || hostname();
    }

    event.user = {
      ...event.user,
      ip_address: request.ip,
      ...extractUserData(request),
    };

    return event;
  };
  const currentHub = Sentry.getCurrentHub();
  const client = currentHub.getClient();
  // Initialise an instance of SessionFlusher on the client when `autoSessionTracking` is enabled and the
  // `requestHandler` middleware is used indicating that we are running in SessionAggregates mode
  if (client && isAutoSessionTrackingEnabled(client)) {
    client.initSessionFlusher();

    // If Scope contains a Single mode Session, it is removed in favor of using Session Aggregates mode
    const scope = currentHub.getScope();
    if (scope && scope.getSession()) {
      scope.setSession();
    }
  }
  if (hasTracingEnabled()) {
    fastify.log.info('Sentry tracing enabled.');
    fastify.addHook('onRequest', function (request, reply, done) {
      const traceparentData =
        request.headers &&
        isString(request.headers['sentry-trace']) &&
        extractTraceparentData(request.headers['sentry-trace']);
      const baggage =
        request.headers &&
        isString(request.headers.baggage) &&
        parseBaggageString(request.headers.baggage);
      const r = extractRequestData(request);
      request[kSentryRequestData] = r;
      const transaction = Sentry.startTransaction(
        {
          name: getTransactionName(request, reply),
          op: 'http.server',
          ...traceparentData,
          ...(baggage && { metadata: { baggage: baggage } }),
        },
        { request: r }
      );
      request[kSentryTransaction] = transaction;
      Sentry.getCurrentHub().configureScope((scope) => {
        if (transaction) {
          transaction.setData('url', request.url);
          transaction.setData('query', request.query);
          scope.setSpan(transaction);
        }
      });
      done();
    });
    fastify.addHook('onResponse', (request, reply, done) => {
      if (request[kSentryTransaction]) {
        request[kSentryTransaction].setHttpStatus(reply.statusCode);
        request[kSentryTransaction].finish();
      }
      done();
    });
  } else {
    fastify.log.info('Sentry tracing not enabled.');
  }
  fastify.addHook('onRequest', (request, reply, done) => {
    request[kSentryCurrentHub] = Sentry.getCurrentHub();
    request[kSentryClient] = request[kSentryCurrentHub].getClient();
    request[kSentryIsAutoSessionTrackingEnabled] = isAutoSessionTrackingEnabled(
      request[kSentryClient]
    );
    const local = domain.create();
    local.add(request);
    local.add(reply);
    local.on('error', done);
    local.run(() => {
      Sentry.getCurrentHub().configureScope((scope) => {
        scope.addEventProcessor((event, hint) =>
          eventProcessor(request, event, hint)
        );
      });
      if (request[kSentryIsAutoSessionTrackingEnabled]) {
        const scope = request[kSentryCurrentHub].getScope();
        if (scope) {
          scope.setRequestSession({ status: 'ok' });
        }
      }
      done();
    });
  });
  fastify.addHook('onResponse', (request, reply, done) => {
    // const client = Sentry.getCurrentHub().getClient();
    if (request[kSentryIsAutoSessionTrackingEnabled]) {
      request[kSentryClient]._captureRequestSession();
      // if (client && client._captureRequestSession) {
      //   client._captureRequestSession();
      // }
    }
    done();
  });
};
