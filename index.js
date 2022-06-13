'use strict';

const path = require('path');
const fp = require('fastify-plugin');
const base = require('./lib/base');
const tracing = require('./lib/tracing');
const request = require('./lib/request');

const PACKAGE_NAME = require(path.resolve(__dirname, 'package.json')).name;

module.exports = fp(
  function (
    fastify,
    {
      shouldHandleError,
      setErrorHandler = true,
      errorResponse,
      getTransactionName,
      ...sentryOptions
    },
    next
  ) {
    fastify.register(base, {
      shouldHandleError,
      setErrorHandler,
      errorResponse,
      ...sentryOptions,
    });
    fastify.register(tracing, { getTransactionName });
    fastify.register(request, { getTransactionName });
    next();
  },
  {
    name: PACKAGE_NAME,
    fastify: '3.x',
  }
);
