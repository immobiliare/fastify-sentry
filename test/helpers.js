'use strict';

const fastify = require('fastify');
const sentryTestkit = require('sentry-testkit');
const { testkit, sentryTransport } = sentryTestkit();
const plugin = require('../');

exports.setup = async function (
  options,
  pre = async () => {},
  post = async () => {}
) {
  const server = fastify();
  if (pre) {
    await pre(server);
  }
  server.register(plugin, {
    ...options,
    transport: sentryTransport,
  });
  if (post) {
    await post(server);
  }
  server.get('/oops', async () => {
    throw new Error('Oops');
  });
  await server.ready();
  return server;
};

exports.resetModuleCache = function () {
  delete require.cache[require.resolve('../')];
  for (const key in require.cache) {
    if (/node_modules\/@sentry\//.test(key)) {
      delete require.cache[key];
    }
  }
};

exports.testkit = testkit;

exports.extractMetaFromEvent = (event) => {
  const {
    breadcrumbs,
    environment,
    platform,
    request,
    tags,
    transaction,
    user,
  } = event.originalReport;
  return {
    breadcrumbs,
    environment,
    platform,
    request,
    tags,
    transaction,
    user,
  };
};
