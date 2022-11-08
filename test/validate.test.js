'use strict';

const tap = require('tap');
const { setup, resetModuleCache } = require('./helpers');

tap.beforeEach(resetModuleCache);

tap.test('invalid options', async (t) => {
  const list = [
    {
      config: {
        shouldHandleError: 'true',
      },
      error: new TypeError('shouldHandleError should be a function.'),
    },
    {
      config: {
        setErrorHandler: 'true',
      },
      error: new TypeError('setErrorHandler should be a boolean.'),
    },
    {
      config: {
        errorResponse: 123,
      },
      error: new TypeError('errorResponse should be a function'),
    },
    {
      config: {
        getTransactionName: '123',
      },
      error: new TypeError('getTransactionName should be a function'),
    },
    {
      config: {
        extractRequestData: '1e3',
      },
      error: new TypeError('extractRequestData should be a function'),
    },
    {
      config: {
        extractUserData: 1e3,
      },
      error: new TypeError('extractUserData should be a function'),
    },
  ];
  for (const item of list) {
    await t.rejects(setup(item.config), item.error);
  }
});

tap.test('valid options', async (t) => {
  const list = [
    undefined,
    { shouldHandleError: () => false },
    { setErrorHandler: false },
    { errorResponse: () => {} },
    { getTransactionName: () => 'transaction' },
    { extractRequestData: () => {} },
    { extractUserData: () => {} },
  ];
  for (const config of list) {
    t.resolves(setup(config));
  }
});
