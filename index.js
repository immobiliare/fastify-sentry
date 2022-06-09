'use strict';

const path = require('path');
const fp = require('fastify-plugin');
const Sentry = require('@sentry/node');
const {
  validateOptions,
  setErrorHandler: errorFactory,
  defaultShouldHandleError,
  defaultErrorResponse,
  DEFAULT_EVENT_DATA,
  sentryRequestHook,
  onResponseHook,
  kSentryTransaction,
} = require('./lib/utils');
const tracing = require('./lib/tracing')
const PACKAGE_NAME = require(path.resolve(__dirname, 'package.json')).name;

module.exports = fp(
  function (
    fastify,
    {
      shouldHandleError = defaultShouldHandleError,
      setErrorHandler = true,
      errorResponse = undefined,
      eventData = Object.assign({}, DEFAULT_EVENT_DATA),
      // TODO: implement this
      // getTransactionName = defaultGetTransactionName,
      sentryOptions = {},
    },
    next
  ) {
    Sentry.init(sentryOptions);
    if (!sentryOptions.dsn) {
      fastify.log.error('No Sentry DSN was provided.');
    }

    // try {
    //     validateOptions({
    //         parseRequestOptions,
    //         shouldHandleError,
    //         setErrorHandler,
    //     });
    // } catch (error) {
    //     return next(error);
    // }

    fastify.register(require('./lib/tracing'));
    // fastify.addHook('onRequest', onRequestHook());
    fastify.addHook('onResponse', onResponseHook());
    if (setErrorHandler) {
      const onError = errorFactory(shouldHandleError, errorResponse);
      fastify.setErrorHandler(onError);
    }
    fastify.decorate('Sentry', Sentry);
    // fastify.decorateRequest(kSentryTransaction, null);
    fastify.decorateReply('sentryEventId', '');
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
