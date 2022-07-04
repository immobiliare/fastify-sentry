'use strict';

const fastify = require('fastify');
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
  server.register(plugin, options);
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
