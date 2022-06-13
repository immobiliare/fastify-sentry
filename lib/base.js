'use strict';

const path = require('path');
const fp = require('fastify-plugin');
const Sentry = require('@sentry/node');
const { isAutoSessionTrackingEnabled } = require('./utils');
const { kSentryTransaction } = require('./symbols');

const PACKAGE_NAME = require(path.resolve(__dirname, '../package.json')).name;

function defaultShouldHandleError(error, request, reply) {
  return reply.statusCode >= 500;
}

function defaultErrorResponse(error, request, reply) {
  // @fastify/sensible explicit internal errors support
  if (reply.statusCode === 500 && error.explicitInternalServerError !== true) {
    reply.send(new Error('Something went wrong'));
  } else {
    reply.send(error);
  }
}

module.exports = fp(
  function (fastify, opts, done) {
    let {
      setErrorHandler,
      shouldHandleError,
      errorResponse,
      ...sentryOptions
    } = opts;
    Sentry.init(sentryOptions);
    fastify.decorate('Sentry', Sentry);
    fastify.decorateReply('sentryEventId', '');
    fastify.addHook('onClose', (instance, done) => {
      Sentry.close(2000).then(() => done(), done);
    });

    shouldHandleError = opts.shouldHandleError || defaultShouldHandleError;
    errorResponse = opts.errorResponse || defaultErrorResponse;

    if (setErrorHandler) {
      fastify.setErrorHandler(function (error, request, reply) {
        request.log.error(error);
        const instance = this;
        if (shouldHandleError(error, request, reply)) {
          instance.Sentry.withScope((scope) => {
            if (request[kSentryTransaction] && scope.getSpan() === undefined) {
              scope.setSpan(request[kSentryTransaction]);
            }
            const client = instance.Sentry.getCurrentHub().getClient();
            if (client && isAutoSessionTrackingEnabled(client)) {
              const isSessionAggregatesMode =
                client._sessionFlusher !== undefined;
              if (isSessionAggregatesMode) {
                const requestSession = scope.getRequestSession();
                if (requestSession && requestSession.status !== undefined) {
                  requestSession.status = 'crashed';
                }
              }
            }
            reply.sentryEventId = instance.Sentry.captureException(error);
            errorResponse(error, request, reply);
          });
        }
      });
    }
    done();
  },
  {
    name: `${PACKAGE_NAME}.base`,
    fastify: '3.x',
  }
);
