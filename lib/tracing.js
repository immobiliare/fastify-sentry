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
const { kSentryTransaction } = require('./symbols');
const { getTransactionName: defaultGetTransactionName, addRequestToEvent } = require('./utils');

const PACKAGE_NAME = require(path.resolve(__dirname, '../package.json')).name;

module.exports = fp(
  function (fastify, opts, done) {
    console.log(hasTracingEnabled())
    const getTransactionName =
      opts.getTransactionName || defaultGetTransactionName;

    fastify.decorateRequest(kSentryTransaction, null)
    fastify.addHook('onRequest', function (request, reply, done) {
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
