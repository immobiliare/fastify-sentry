import plugin from '../index.js';
import { tryToExtractBody } from '../utils.js'; // @immobiliarelabs/fastify-sentry/utils
import fastify from 'fastify';

const app = fastify({ logger: true });
app.register(plugin, {
  environment: 'Fastify Tests',
  extractRequestData(request, keys) {
    const data = {};
    /**
     * For each request this function is called twice.
     * The first time it extract the data without the body to attach it
     * to the Sentry transaction. The second one when an exception is captured
     * in order to try to extract the body from the request.
     *
     * This is because the `onRequest` hook of fastify (used to initialize the transaction)
     * doesn't provide the request body yet.
     */
    if (keys.includes('data')) {
      data.data = tryToExtractBody(request);
    } else {
      data.headers = request.headers;
    }
    return data;
  },
});

app.get('/', async () => {
  return { hello: true };
});

app.get('/error', async () => {
  throw new Error('Fastify Error');
});

app.listen({ port: 3000 });
