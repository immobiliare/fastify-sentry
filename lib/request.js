'use strict';

const {
  isString,
  extractTraceparentData,
  baggageHeaderToDynamicSamplingContext,
} = require('@sentry/utils');
const { hasTracingEnabled } = require('@sentry/tracing');
const { extractPathForTransaction } = require('../utils');
const {
  kSentryRequestData,
  kSentryExtractRequestData,
  kSentryExtractUserData,
  kSentryGetTransactionName,
} = require('./symbols');

const eventProcessor = (fastify, request, reply, event) => {
  if (!request[kSentryRequestData]) {
    request[kSentryRequestData] = fastify[kSentryExtractRequestData](request, [
      'headers',
      'method',
      'protocol',
      'url',
      'cookies',
      'query_string',
      'data',
    ]);
  } else {
    const { data } = fastify[kSentryExtractRequestData](request, ['data']);
    if (data) {
      request[kSentryRequestData].data = data;
    }
  }
  event.request = {
    ...event.request,
    ...request[kSentryRequestData],
  };

  if (!request[kSentryRequestData].user) {
    request[kSentryRequestData].user = fastify[kSentryExtractUserData](request);
  }
  event.user = {
    ip_address: request.ip,
    ...event.user,
    ...request[kSentryRequestData].user,
  };
  if (!event.transaction) {
    if (reply.sentryTransaction) {
      event.transaction = reply.sentryTransaction.name;
    } else {
      event.transaction = fastify[kSentryGetTransactionName](request);
    }
  }
  return event;
};

const tracingRequestHook = (fastify) => {
  return function (request, reply, done) {
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
    const r = fastify[kSentryExtractRequestData](request, [
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
      fastify[kSentryGetTransactionName]
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
  };
};
const tracingResponseHook = (fastify) => {
  return (request, reply, done) => {
    if (reply.sentryTransaction) {
      if (!request[kSentryRequestData].user) {
        request[kSentryRequestData].user =
          fastify[kSentryExtractUserData](request);
      }
      reply.sentryTransaction.setHttpStatus(reply.statusCode);
      reply.sentryTransaction.finish();
    }
    done();
  };
};
const errorWrapperRequestHook = (fastify) => {
  return (request, reply, done) => {
    fastify.Sentry.runWithAsyncContext(() => {
      const hub = fastify.Sentry.getCurrentHub();
      hub.configureScope((scope) => {
        scope.addEventProcessor((event) =>
          eventProcessor(fastify, request, reply, event)
        );
      });
      done();
    });
  };
};

module.exports = function (fastify) {
  if (hasTracingEnabled()) {
    fastify.log.info('Sentry tracing enabled.');
    fastify.addHook('onRequest', tracingRequestHook(fastify));
    fastify.addHook('onResponse', tracingResponseHook(fastify));
  } else {
    fastify.log.info('Sentry tracing not enabled.');
  }
  fastify.addHook('onRequest', errorWrapperRequestHook(fastify));
};
