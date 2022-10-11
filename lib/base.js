'use strict';

const Sentry = require('@sentry/node');

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

module.exports = function (fastify, opts) {
  let { setErrorHandler, shouldHandleError, errorResponse, ...sentryOptions } =
    opts;
  Sentry.init(sentryOptions);
  fastify.decorate('Sentry', Sentry);
  fastify.decorateReply('sentryEventId', '');
  fastify.decorateReply('sentryTransaction', null);
  fastify.addHook('onClose', (instance, done) => {
    Sentry.close(2000).then(() => done(), done);
  });

  shouldHandleError = opts.shouldHandleError || defaultShouldHandleError;
  errorResponse = opts.errorResponse || defaultErrorResponse;

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
          if (reply.sentryTransaction && scope.getSpan() === undefined) {
            scope.setSpan(reply.sentryTransaction);
          }
          reply.sentryEventId = instance.Sentry.captureException(error);
        });
      }
      errorResponse(error, request, reply);
    });
  }
};
