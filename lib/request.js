'use strict';

const path = require('path');
const domain = require('domain');
const { hostname } = require('os');
const fp = require('fastify-plugin');
const Sentry = require('@sentry/node');
const {
  getTransactionName: defaultGetTransactionName,
  extractRequestData,
  extractUserData,
  isAutoSessionTrackingEnabled,
} = require('./utils');
const { kSentryTransaction, kSentryRequestData } = require('./symbols');

const { SENTRY_NAME } = process.env;
const PACKAGE_NAME = require(path.resolve(__dirname, '../package.json')).name;

module.exports = fp(
  function (fastify, opts, done) {
    const getTransactionName =
      opts.getTransactionName || defaultGetTransactionName;

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

    fastify.addHook('onRequest', (request, reply, done) => {
      const local = domain.create();
      local.add(request);
      local.add(reply);
      local.on('error', done);
      local.run(() => {
        Sentry.getCurrentHub().configureScope((scope) => {
          scope.addEventProcessor((event) => {
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
          });
        });
        if (isAutoSessionTrackingEnabled(client)) {
          const scope = currentHub.getScope();
          if (scope) {
            scope.setRequestSession({ status: 'ok' });
          }
        }
        done();
      });
    });
    fastify.addHook('onResponse', (request, reply, done) => {
      const client = Sentry.getCurrentHub().getClient();
      if (isAutoSessionTrackingEnabled(client)) {
        if (client && client._captureRequestSession) {
          client._captureRequestSession();
        }
      }
      done();
    });
    done();
  },
  {
    name: `${PACKAGE_NAME}.request`,
    fastify: '3.x',
  }
);
