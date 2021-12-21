'use strict';

const Fastify = require('fastify');

const fastify = Fastify();

fastify.get('/', async () => {
    throw new Error('test');
});

fastify.listen(4001);
