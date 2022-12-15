'use strict';

module.exports = function ({
  shouldHandleError,
  setErrorHandler,
  errorResponse,
  getTransactionName,
  extractRequestData,
  extractUserData,
} = {}) {
  if (shouldHandleError && typeof shouldHandleError !== 'function') {
    throw new TypeError('shouldHandleError should be a function.');
  }
  if (setErrorHandler && typeof setErrorHandler !== 'boolean') {
    throw new TypeError('setErrorHandler should be a boolean.');
  }
  if (errorResponse && typeof errorResponse !== 'function') {
    throw new TypeError('errorResponse should be a function.');
  }
  if (getTransactionName && typeof getTransactionName !== 'function') {
    throw new TypeError('getTransactionName should be a function.');
  }
  if (extractRequestData && typeof extractRequestData !== 'function') {
    throw new TypeError('extractRequestData should be a function.');
  }
  if (extractUserData && typeof extractUserData !== 'function') {
    throw new TypeError('extractUserData should be a function.');
  }
};
