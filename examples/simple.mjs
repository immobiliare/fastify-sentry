import plugin from '../index.js';
import fastify from 'fastify';
import * as SentryTracing from '@sentry/tracing';

const app = fastify({ logger: true });
app.register(plugin, {
  sentryOptions: {
    environment: 'Fastify Tests',
  },
});

app.get('/', async () => {
  return { hello: true };
});

app.get('/error', async () => {
  throw new Error('Fastify Error');
});

app.listen(3000);
