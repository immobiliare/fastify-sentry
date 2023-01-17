'use strict';

const fp = require('fastify-plugin');
const base = require('./lib/base');
const request = require('./lib/request');
const validate = require('./lib/validate');
const {
  getTransactionName,
  extractRequestData,
  extractUserData,
  errorResponse,
  shouldHandleError,
} = require('./lib/utils');

const DEFAULT_CONFIG = {
  setErrorHandler: true,
  shouldHandleError,
  errorResponse,
  getTransactionName,
  extractRequestData,
  extractUserData,
};

module.exports = fp(
  function (fastify, opts, next) {
    const config = Object.assign({}, DEFAULT_CONFIG, opts);
    try {
      validate(config);
    } catch (error) {
      return next(error);
    }
    base(fastify, config);
    request(fastify);
    next();
  },
  {
    name: '@immobiliarelabs/fastify-sentry',
    fastify: '4.x',
  }
);
