'use strict';

const path = require('path');
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

const PACKAGE_NAME = require(path.resolve(__dirname, 'package.json')).name;

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
    name: PACKAGE_NAME,
    fastify: '4.x',
  }
);
