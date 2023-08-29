'use strict';

const fastify = require('fastify');
const plugin = require('@immobiliarelabs/fastify-sentry'); // eslint-disable-line
const assert = require('assert');

const app = fastify();
app.register(plugin);
app.ready().then(() => {
  assert(app.Sentry !== undefined);
});
