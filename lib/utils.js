'use strict';

const { normalize, isString, isPlainObject } = require('@sentry/utils');
const cookie = require('cookie');

/* istanbul ignore next */
function isAutoSessionTrackingEnabled(client) {
  if (client === undefined) {
    return false;
  }
  const clientOptions = client && client.getOptions();
  if (clientOptions && clientOptions.autoSessionTracking !== undefined) {
    return clientOptions.autoSessionTracking;
  }
  return false;
}

exports.isAutoSessionTrackingEnabled = isAutoSessionTrackingEnabled;

function tryToExtractBody(req) {
  if (req.body !== undefined) {
    return isString(req.body) ? req.body : JSON.stringify(normalize(req.body));
  }
}

exports.tryToExtractBody = tryToExtractBody;

function extractRequestData(req, keys) {
  const extracted = {};
  for (const key of keys) {
    switch (key) {
      case 'headers':
        extracted.headers = req.headers;
        break;
      case 'method':
        extracted.method = req.method;
        break;
      case 'url':
        {
          const host = req.hostname;
          extracted.url = `${req.protocol}://${host}${req.url}`;
        }
        break;
      case 'cookies':
        if (extracted.headers) {
          extracted.cookies = cookie.parse(extracted.headers.cookie || '');
        }
        break;
      case 'query_string':
        extracted.query_string = req.query;
        break;
      case 'data':
        if (req.method === 'GET' || req.method === 'HEAD') {
          break;
        }
        if (req.body !== undefined) {
          extracted.data = tryToExtractBody(req);
        }
        break;
    }
  }
  return extracted;
}

exports.extractRequestData = extractRequestData;

/** Default user keys that'll be used to extract data from the request */
const DEFAULT_USER_KEYS = ['id', 'username', 'email'];

function extractUserData(request) {
  if (!isPlainObject(request.user)) {
    return {};
  }
  const extractedUser = {};
  const user = request.user;
  for (const key of DEFAULT_USER_KEYS) {
    if (key in user) {
      extractedUser[key] = user[key];
    }
  }

  return extractedUser;
}

exports.extractUserData = extractUserData;

const getTransactionName = (request) => {
  return `${request.method} ${request.routerPath}`;
};
exports.getTransactionName = getTransactionName;
