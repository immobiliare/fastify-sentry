'use strict';

const Fastify = require('fastify');

const fastify = Fastify();

fastify.register(require('../'), {
    dsn: 'http://00000000000000000000000000000000@localhost:4000/0000000',
});

fastify.get('/', async () => {
    throw new Error('test');
});

fastify.listen(4002);
