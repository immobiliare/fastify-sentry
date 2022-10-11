'use strict';

const Fastify = require('fastify');

const fastify = Fastify();

fastify.register(require('../'), {
  dsn: 'http://00000000000000000000000000000000@localhost:4000/0000000',
});

fastify.get('/', async () => {
  return { ok: true };
});

fastify.get('/error', async () => {
  throw new Error('test');
});

fastify.listen({ port: 4002 });
