'use strict';

const domain = require('domain'); // eslint-disable-line node/no-deprecated-api
const {
  isString,
  extractTraceparentData,
  baggageHeaderToDynamicSamplingContext,
} = require('@sentry/utils');
const { hasTracingEnabled } = require('@sentry/tracing');
const {
  getTransactionName: defaultGetTransactionName,
  extractRequestData: defaultExtractRequestData,
  extractUserData: defaultExtractUserData,
  extractPathForTransaction,
} = require('./utils');
const {
  kSentryIsAutoSessionTrackingEnabled,
  kSentryRequestData,
} = require('./symbols');

module.exports = function (fastify, opts) {
  fastify.decorateRequest(kSentryRequestData, null);
  fastify.decorateRequest(kSentryIsAutoSessionTrackingEnabled, false);
  const getTransactionName =
    opts.getTransactionName || defaultGetTransactionName;
  const extractRequestData =
    opts.extractRequestData || defaultExtractRequestData;
  const extractUserData = opts.extractUserData || defaultExtractUserData;

  const eventProcessor = (request, reply, event) => {
    if (!request[kSentryRequestData]) {
      request[kSentryRequestData] = extractRequestData(request, [
        'headers',
        'method',
        'protocol',
        'url',
        'cookies',
        'query_string',
        'data',
      ]);
    } else {
      const { data } = extractRequestData(request, ['data']);
      if (data) {
        request[kSentryRequestData].data = data;
      }
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
      event.transaction = reply.sentryTransaction
        ? reply.sentryTransaction.name
        : getTransactionName(request);
    }

    event.user = {
      ...event.user,
      ip_address: request.ip,
      ...extractUserData(request),
    };
    return event;
  };

  if (hasTracingEnabled()) {
    fastify.log.info('Sentry tracing enabled.');
    fastify.addHook('onRequest', function (request, reply, done) {
      const traceparentData =
        request.headers &&
        isString(request.headers['sentry-trace']) &&
        extractTraceparentData(request.headers['sentry-trace']);
      const dynamicSamplingContext =
        request.headers &&
        isString(request.headers.baggage) &&
        baggageHeaderToDynamicSamplingContext(request.headers.baggage);
      // In this hook the body of the request is not available yet,
      // but in the context of a transaction it shouldn't matter.
      // It will be extracted later in the `eventProcessor` to enrich the
      // event.
      const r = extractRequestData(request, [
        'headers',
        'method',
        'protocol',
        'url',
        'cookies',
        'query_string',
      ]);
      request[kSentryRequestData] = r;

      const [name, source] = extractPathForTransaction(
        request,
        getTransactionName
      );
      const transaction = fastify.Sentry.startTransaction(
        {
          name,
          op: 'http.server',
          ...traceparentData,
          metadata: {
            dynamicSamplingContext:
              traceparentData && !dynamicSamplingContext
                ? {}
                : dynamicSamplingContext,
            // The request should already have been stored in `scope.sdkProcessingMetadata` (which will become
            // `event.sdkProcessingMetadata` the same way the metadata here will) by `sentryRequestMiddleware`, but on the
            // off chance someone is using `sentryTracingMiddleware` without `sentryRequestMiddleware`, it doesn't hurt to
            // be sure
            request: r,
            source,
          },
        },
        { request: r }
      );
      reply.sentryTransaction = transaction;
      fastify.Sentry.getCurrentHub().configureScope((scope) => {
        if (transaction) {
          transaction.setData('url', request.url);
          transaction.setData('query', request.query);
          scope.setSpan(transaction);
        }
      });
      done();
    });

    fastify.addHook('onResponse', (request, reply, done) => {
      if (reply.sentryTransaction) {
        reply.sentryTransaction.setHttpStatus(reply.statusCode);
        reply.sentryTransaction.finish();
      }
      done();
    });
  } else {
    fastify.log.info('Sentry tracing not enabled.');
  }

  fastify.addHook('onRequest', (request, reply, done) => {
    const local = domain.create();
    local.add(request);
    local.add(reply);
    local.on('error', done);
    local.run(() => {
      const currentHub = fastify.Sentry.getCurrentHub();
      currentHub.configureScope((scope) => {
        scope.addEventProcessor((event, hint) =>
          eventProcessor(request, reply, event, hint)
        );
      });
      done();
    });
  });
};
