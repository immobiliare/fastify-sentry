'use strict';

const path = require('path');
const fp = require('fastify-plugin');
const base = require('./lib/base');
const request = require('./lib/request');
const validate = require('./lib/validate');

const PACKAGE_NAME = require(path.resolve(__dirname, 'package.json')).name;

module.exports = fp(
  function (fastify, opts, next) {
    try {
      validate(opts);
    } catch (error) {
      return next(error);
    }
    const {
      shouldHandleError,
      setErrorHandler = true,
      errorResponse,
      getTransactionName,
      extractRequestData,
      extractUserData,
      ...sentryOptions
    } = opts;
    base(fastify, {
      shouldHandleError,
      setErrorHandler,
      errorResponse,
      ...sentryOptions,
    });
    request(fastify, {
      getTransactionName,
      extractRequestData,
      extractUserData,
    });
    next();
  },
  {
    name: PACKAGE_NAME,
    fastify: '4.x',
  }
);
