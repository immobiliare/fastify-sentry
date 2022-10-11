'use strict';

const Fastify = require('fastify');

const fastify = Fastify();

fastify.get('/', async () => {
  return { ok: true };
});

fastify.get('/error', async () => {
  throw new Error('test');
});

fastify.listen({ port: 4001 });
