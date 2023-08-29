import fastify from 'fastify';
import plugin from '@immobiliarelabs/fastify-sentry';
import assert from 'assert';

const app = fastify();
app.register(plugin);
app.ready().then(() => {
  assert(app.Sentry !== undefined);
});
