import plugin from '../index.js';
import fastify from 'fastify';

const app = fastify({ logger: true });
app.register(plugin, {
  environment: 'Fastify Tests',
  // eslint-disable-next-line no-unused-vars
  shouldHandleError(error, request, reply) {
    if (error.statusCode > 400) return true;
    return false;
  },
});

app.get('/', async () => {
  return { hello: true };
});

app.get('/error', async () => {
  throw new Error('Fastify Error');
});

app.listen({ port: 3000 });
