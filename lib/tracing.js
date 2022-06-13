'use strict';

const path = require('path');
const fp = require('fastify-plugin');
const {
  isString,
  extractTraceparentData,
  parseBaggageString,
} = require('@sentry/utils');
const Sentry = require('@sentry/node');
const { hasTracingEnabled } = require('@sentry/tracing');
const { kSentryTransaction, kSentryRequestData } = require('./symbols');
const {
  getTransactionName: defaultGetTransactionName,
  extractRequestData,
} = require('./utils');

const PACKAGE_NAME = require(path.resolve(__dirname, '../package.json')).name;

module.exports = fp(
  function (fastify, opts, done) {
    fastify.decorateRequest(kSentryTransaction, null);
    fastify.decorateRequest(kSentryRequestData, null);

    if (!hasTracingEnabled()) {
      fastify.log.info('Sentry tracing not enabled.');
      return done();
    }
    fastify.log.info('Sentry tracing enabled.');
    const getTransactionName =
      opts.getTransactionName || defaultGetTransactionName;

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
      Sentry.getCurrentHub().configureScope((scope) => {
        if (transaction) {
          transaction.setData('url', request.url);
          transaction.setData('query', request.query);
          scope.setSpan(transaction);
          request[kSentryTransaction] = transaction;
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
    done();
  },
  {
    name: `${PACKAGE_NAME}.tracing`,
    fastify: '3.x',
  }
);
