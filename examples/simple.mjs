import plugin from '../index.js';
import fastify from 'fastify';

const app = fastify({ logger: true });
app.register(plugin, {
  environment: 'Fastify Tests',
});

app.get('/', async () => {
  return { hello: true };
});

app.get('/error', async () => {
  throw new Error('Fastify Error');
});

app.listen({ port: 3000 });
