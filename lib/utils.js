'use strict';

const { normalize, isString, isPlainObject } = require('@sentry/utils');
const cookie = require('cookie');

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

function extractRequestData(req) {
  const method = req.method;
  const headers = req.headers;
  const host = req.hostname || '<no host>';
  const protocol = req.protocol;
  const absoluteUrl = `${protocol}://${host}${req.url}`;
  const data =
    method === 'GET' || method === 'HEAD' ? undefined : tryToExtractBody(req);
  return {
    headers,
    method,
    host,
    protocol,
    url: absoluteUrl,
    cookies: cookie.parse(headers.cookie || ''),
    query_string: req.query,
    data,
  };
}

exports.extractRequestData = extractRequestData;
/** Default user keys that'll be used to extract data from the request */
const DEFAULT_USER_KEYS = ['id', 'username', 'email'];

function extractUserData(request) {
  if (!isPlainObject(request.user)) {
    return {};
  }
  const extractedUser = {};
  const { user } = request.user;
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
