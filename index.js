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
} = require('./utils');

const DEFAULT_CONFIG = {
  setErrorHandler: true,
  shouldHandleError,
  errorResponse,
  getTransactionName,
  extractRequestData,
  extractUserData,
  skipInit: false,
};

const fastifySentry = function (fastify, opts, next) {
  const config = Object.assign({}, DEFAULT_CONFIG, opts);
  try {
    validate(config);
  } catch (error) {
    return next(error);
  }
  base(fastify, config);
  request(fastify);
  next();
};

module.exports = fp(fastifySentry, {
  name: '@immobiliarelabs/fastify-sentry',
  fastify: '5.x',
});
module.exports.default = fastifySentry;
module.exports.fastifySentry = fastifySentry;
