'use strict';

const Sentry = require('@sentry/node');
const {
  kSentryRequestData,
  kSentryIsAutoSessionTrackingEnabled,
  kSentryExtractRequestData,
  kSentryExtractUserData,
  kSentryGetTransactionName,
} = require('./symbols');

module.exports = function (fastify, opts) {
  let {
    setErrorHandler,
    shouldHandleError,
    errorResponse,
    getTransactionName,
    extractRequestData,
    extractUserData,
    ...sentryOptions
  } = opts;
  Sentry.init(sentryOptions);
  fastify.decorate(kSentryExtractRequestData, extractRequestData);
  fastify.decorate(kSentryExtractUserData, extractUserData);
  fastify.decorate(kSentryGetTransactionName, getTransactionName);
  fastify.decorate('Sentry', Sentry);
  fastify.decorateRequest(kSentryRequestData, null);
  fastify.decorateRequest(kSentryIsAutoSessionTrackingEnabled, false);
  fastify.decorateReply('sentryEventId', '');
  fastify.decorateReply('sentryTransaction', null);
  fastify.addHook('onClose', (instance, done) => {
    Sentry.close(2000).then(() => done(), done);
  });

  if (setErrorHandler) {
    fastify.setErrorHandler(function (error, request, reply) {
      if (error.headers !== undefined) {
        reply.headers(error.headers);
      }
      if (!reply.statusCode || reply.statusCode === 200) {
        const statusCode = error.statusCode || error.status;
        reply.code(statusCode >= 400 ? statusCode : 500);
      }
      request.log.error(error);
      const instance = this;
      if (shouldHandleError(error, request, reply)) {
        instance.Sentry.withScope((scope) => {
          if (reply.sentryTransaction) {
            if (scope.getSpan() === undefined) {
              scope.setSpan(reply.sentryTransaction);
            }
          }
          reply.sentryEventId = instance.Sentry.captureException(error);
        });
      }
      errorResponse(error, request, reply);
    });
  }
};
